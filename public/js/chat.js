const chatStore = createStore({
  // messages buat ditampilin ke UI: { role: 'user'|'bot', text }
  messages: [
    {
      role: "bot",
      text: "Halo! Mau tanya-tanya produk atau langsung pesan juga bisa 😊",
    },
  ],
  // history format Gemini: { role: 'user'|'model', text } - dikirim ulang
  // tiap request biar server "inget" konteks percakapan (server sendiri
  // gak nyimpen sesi apapun / stateless)
  history: [],
  isLoading: false,
});

function renderChatBubble({ role, text }) {
  const isUser = role === "user";
  const formattedText = formatChatText(text);
  return `
    <div class="flex ${isUser ? "justify-end" : "justify-start"}">
      <div class="max-w-[85%] break-words px-3 py-2.5 rounded-2xl text-sm leading-6 shadow-sm ${
        isUser
          ? "bg-blue-600 text-white rounded-br-sm"
          : "bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200"
      }">${formattedText}</div>
    </div>
  `;
}

function renderTypingIndicator() {
  return `
    <div class="flex justify-start">
      <div class="max-w-[85%] px-3 py-2 rounded-2xl text-sm bg-gray-100 text-gray-400 rounded-bl-sm italic">
        AI sedang mengetik...
      </div>
    </div>
  `;
}

function renderChat(state) {
  const container = document.getElementById("chat-messages");
  const bubbles = state.messages.map(renderChatBubble).join("");
  const typing = state.isLoading ? renderTypingIndicator() : "";
  container.innerHTML = bubbles + typing;
  container.scrollTop = container.scrollHeight;
}

chatStore.subscribe(renderChat);
renderChat(chatStore.getState());

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatSubmit = document.getElementById("chat-submit");

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  const current = chatStore.getState();

  chatStore.setState({
    messages: [...current.messages, { role: "user", text }],
    isLoading: true,
  });

  chatInput.value = "";
  chatInput.disabled = true;
  chatSubmit.disabled = true;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: chatStore.getState().history, // kirim riwayat sejauh ini
      }),
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    const { reply, orderCreated } = result.data;

    // update history buat konteks percakapan selanjutnya (format Gemini)
    const newHistory = [
      ...chatStore.getState().history,
      { role: "user", text },
      { role: "model", text: reply },
    ];

    chatStore.setState({
      messages: [
        ...chatStore.getState().messages,
        { role: "bot", text: reply },
      ],
      history: newHistory,
      isLoading: false,
    });

    // kalo AI berhasil bikin order, kasih notice kecil + link ke invoice
    if (orderCreated) {
      chatStore.setState({
        messages: [
          ...chatStore.getState().messages,
          {
            role: "bot",
            text: `✅ Order #${orderCreated.id} berhasil dibuat! Cek detailnya di tab Invoice.`,
          },
        ],
      });
      // refresh stok yang ditampilin di katalog biar sinkron
      setTimeout(() => window.location.reload(), 1500);
    }
  } catch (err) {
    chatStore.setState({
      messages: [
        ...chatStore.getState().messages,
        { role: "bot", text: "Maaf, ada gangguan. Coba lagi ya." },
      ],
      isLoading: false,
    });
  } finally {
    chatInput.disabled = false;
    chatSubmit.disabled = false;
    chatInput.focus();
  }
});
