const { Op } = require("sequelize");
const { genAI, MODEL_NAME } = require("../config/gemini");
const { Product } = require("../models");
const productService = require("./product.service");
const orderService = require("./order.service");

/**
 * 🛡️ FUNCTION CALLING
 * ============================================================
 * Ini "kontrak" fungsi yang boleh dipanggil Gemini di tengah percakapan.
 * Gemini gak beneran EKSEKUSI fungsi ini - dia cuma bilang ke kita
 * "tolong panggilin fungsi buat_pesanan dengan parameter begini-begini",
 * terus KITA yang beneran jalanin kodenya (di executeBuatPesanan di bawah).
 *
 * Jadi tetep aman: AI gak punya akses langsung ke database, dia cuma
 * bisa "minta" lewat kontrak yang udah kita definisikan sendiri.
 * ============================================================
 */
const buatPesananFunctionDeclaration = {
  name: "buat_pesanan",
  description:
    'Membuat pesanan pembelian satu atau lebih produk untuk pelanggan dalam 1 transaksi sekaligus. PANGGIL FUNGSI INI HANYA setelah pelanggan secara eksplisit setuju untuk membeli (misal: "beli Kaos Polos A 2 biji dan Celana Chino 1 biji atas nama Budi"), dan kamu sudah mengetahui nama pembeli beserta daftar seluruh item dan jumlahnya. Kalau nama pembeli belum disebut, TANYA DULU sebelum memanggil fungsi ini, jangan mengarang nama.',
  parameters: {
    type: "OBJECT",
    properties: {
      namaPembeli: {
        type: "STRING",
        description: "Nama pembeli yang disebutkan pelanggan dalam percakapan",
      },
      items: {
        type: "ARRAY",
        description: "Daftar produk yang dibeli pelanggan beserta jumlah unit masing-masing",
        items: {
          type: "OBJECT",
          properties: {
            namaProduk: {
              type: "STRING",
              description: "Nama produk yang dibeli sesuai dengan katalog toko",
            },
            jumlah: {
              type: "NUMBER",
              description: "Jumlah unit yang dibeli (angka bulat positif)",
            },
          },
          required: ["namaProduk", "jumlah"],
        },
      },
    },
    required: ["namaPembeli", "items"],
  },
};

async function buildSystemInstruction() {
  const products = await productService.getAllProducts();
  const productList = productService.formatProductListText(products);
  const storeName = process.env.STORE_NAME || "Toko Kita";

  return `Kamu adalah asisten belanja cerdas untuk toko online "${storeName}".

DATA PRODUK SAAT INI:
${productList}

TUGAS UTAMA:
1. Jawab pertanyaan seputar katalog produk di atas: bandingkan produk, jelaskan kelebihan & spesifikasi, rekomendasikan produk sesuai preferensi/budget pembeli.
2. Membantu pemesanan SINGLE ITEM maupun MULTIPLE ITEMS sekaligus dalam 1 kali transaksi (misalnya: pelanggan ingin beli 2 Kaos Polos dan 1 Celana Chino).
3. Jika pelanggan sudah EKSPLISIT menyatakan ingin membeli (contoh: "ya udah aku pesan Kaos Polos Cotton Combed 2 dan Celana Chino 1 atas nama Wanda"), dan kamu sudah tahu nama pembeli serta daftar item dan kuantitasnya, panggil fungsi 'buat_pesanan'.
4. Jika nama pembeli belum disebutkan, TANYA DULU: "Atas nama siapa pesanannya?" sebelum mengeksekusi pesanan. Jangan pernah mengarang nama pembeli.
5. Jika ada produk yang stoknya kurang atau habis, jelaskan dengan ramah sisa stok yang tersedia.

ATURAN KETAT:
1. HANYA tawarkan dan proses produk yang terdaftar di DATA PRODUK SAAT INI.
2. Tolak dengan sopan jika ditanya hal di luar konteks toko, dan arahkan kembali ke belanja.
3. Jawab dengan ramah, komunikatif, dan ringkas layaknya customer service profesional.`;
}

/**
 * Fungsi yang dieksekusi server saat Gemini memanggil buat_pesanan.
 * Mendukung multiple order items dalam 1 kali transaksi.
 * Memanggil orderService.createOrder() yang sama dengan Web Cart (DRY).
 */
async function executeBuatPesanan(args) {
  const namaPembeli = (args.namaPembeli || "").trim() || "Pelanggan";
  let rawItems = [];

  if (Array.isArray(args.items) && args.items.length > 0) {
    rawItems = args.items;
  } else if (args.namaProduk && args.jumlah) {
    rawItems = [{ namaProduk: args.namaProduk, jumlah: args.jumlah }];
  }

  if (rawItems.length === 0) {
    return {
      success: false,
      message: "Tidak ada item produk yang ditentukan untuk dipesan.",
    };
  }

  const itemsToOrder = [];
  for (const item of rawItems) {
    const rawName = String(item.namaProduk || "").trim();
    const qty = Math.max(1, Math.round(Number(item.jumlah) || 1));

    // Pencarian produk case-insensitive
    let product = await Product.findOne({
      where: { name: { [Op.iLike]: `%${rawName}%` } },
    });

    // Fallback: cari kata kunci pertama jika nama panjang tidak langsung cocok
    if (!product && rawName.split(" ").length > 1) {
      const firstWord = rawName.split(" ")[0];
      if (firstWord.length >= 3) {
        product = await Product.findOne({
          where: { name: { [Op.iLike]: `%${firstWord}%` } },
        });
      }
    }

    if (!product) {
      return {
        success: false,
        message: `Produk "${rawName}" tidak ditemukan di katalog toko.`,
      };
    }

    if (product.stock < qty) {
      return {
        success: false,
        message: `Stok "${product.name}" tidak mencukupi (tersedia: ${product.stock}, diminta: ${qty}).`,
      };
    }

    itemsToOrder.push({ productId: product.id, quantity: qty });
  }

  // 🛡️ DRY: Memanggil orderService.createOrder() yang memproses multi-item
  const result = await orderService.createOrder({
    userId: null,
    buyerName: namaPembeli,
    items: itemsToOrder,
  });

  return result;
}

/**
 * Chat multi-turn: `history` dikirim dari CLIENT (browser), server gak
 * nyimpen sesi apapun (stateless) - client yang tanggung jawab nyimpen &
 * ngirim ulang riwayat percakapan tiap request. Formatnya: [{ role, text }]
 */
async function chatWithAI(message, historyRaw = []) {
  if (!genAI) {
    return {
      reply:
        "Maaf, fitur chat AI lagi gak aktif. Kamu masih bisa pesan lewat form biasa di tiap kartu produk ya.",
      orderCreated: null,
    };
  }

  const systemInstruction = await buildSystemInstruction();

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
    tools: [{ functionDeclarations: [buatPesananFunctionDeclaration] }],
  });

  const history = historyRaw.map((h) => ({
    role: h.role === "model" ? "model" : "user",
    parts: [{ text: String(h.text || "") }],
  }));
  const userMessage = { role: "user", parts: [{ text: message }] };
  const result = await model.generateContent({
    contents: [...history, userMessage],
  });
  const functionCalls = result.response.functionCalls();

  // Gemini gak minta manggil fungsi apapun - jawaban teks biasa
  if (!functionCalls || functionCalls.length === 0) {
    return { reply: result.response.text(), orderCreated: null };
  }

  // Gemini minta buat_pesanan dipanggil
  const call = functionCalls[0];
  const executionResult = await executeBuatPesanan(call.args);

  let replyText = "";
  try {
    const cleanResponse = {
      success: executionResult.success,
      message:
        executionResult.message ||
        (executionResult.success
          ? `Pesanan #${executionResult.order?.id} atas nama ${executionResult.order?.buyerName} berhasil dibuat dengan total Rp${executionResult.order?.totalAmount}`
          : "Gagal membuat pesanan"),
      orderId: executionResult.order ? executionResult.order.id : null,
      totalAmount: executionResult.order ? executionResult.order.totalAmount : null,
    };

    const modelParts = result.response.candidates?.[0]?.content?.parts || [];
    const followUp = await model.generateContent({
      contents: [
        ...history,
        userMessage,
        { role: "model", parts: modelParts },
        {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: call.name,
                response: cleanResponse,
              },
            },
          ],
        },
      ],
    });
    replyText = followUp.response.text();
  } catch (followUpErr) {
    console.error("Follow-up Gemini error:", followUpErr.message);
    if (executionResult.success) {
      replyText = `Pesanan #${executionResult.order.id} atas nama ${executionResult.order.buyerName} berhasil dibuat! Total tagihan: Rp${executionResult.order.totalAmount.toLocaleString("id-ID")}. Silakan cek faktur di tab Invoice.`;
    } else {
      replyText = `Maaf, pesanan belum dapat diproses: ${executionResult.message}`;
    }
  }

  return {
    reply: replyText,
    orderCreated: executionResult.success ? executionResult.order : null,
  };
}

module.exports = { chatWithAI };
