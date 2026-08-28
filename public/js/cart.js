/**
 * 🛒 CLIENT-SIDE CART MANAGER (Multiple Order Support)
 */

const CART_STORAGE_KEY = 'tokokita_cart_items_v1';

function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCartItems(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  updateCartBadge();
}

function addProductToCart(productId, name, price, stock, category) {
  const qtyInput = document.getElementById('qty-' + productId);
  const quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;

  if (quantity > stock) {
    alert('Jumlah melebihi stok yang tersedia (' + stock + ')');
    return;
  }

  const items = getCartItems();
  const existingIndex = items.findIndex((i) => i.productId === productId);

  if (existingIndex > -1) {
    const newQty = items[existingIndex].quantity + quantity;
    if (newQty > stock) {
      alert('Total kuantitas di keranjang melebihi stok yang tersedia (' + stock + ')');
      return;
    }
    items[existingIndex].quantity = newQty;
  } else {
    items.push({
      productId,
      name,
      price,
      stock,
      category: category || 'Umum',
      quantity,
    });
  }

  saveCartItems(items);
  showToast('🛒 "' + name + '" (' + quantity + 'x) ditambahkan ke keranjang!');
  renderCartModalContent();
}

function incrementQty(productId, maxStock) {
  const input = document.getElementById('qty-' + productId);
  if (input) {
    let val = parseInt(input.value, 10) || 1;
    if (val < maxStock) input.value = val + 1;
  }
}

function decrementQty(productId) {
  const input = document.getElementById('qty-' + productId);
  if (input) {
    let val = parseInt(input.value, 10) || 1;
    if (val > 1) input.value = val - 1;
  }
}

function updateCartItemQty(productId, delta) {
  const items = getCartItems();
  const index = items.findIndex((i) => i.productId === productId);
  if (index > -1) {
    const item = items[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      items.splice(index, 1);
    } else if (newQty > item.stock) {
      alert('Stok maksimal tersedia: ' + item.stock);
      return;
    } else {
      item.quantity = newQty;
    }

    saveCartItems(items);
    renderCartModalContent();
  }
}

function removeCartItem(productId) {
  let items = getCartItems();
  items = items.filter((i) => i.productId !== productId);
  saveCartItems(items);
  renderCartModalContent();
}

function clearCart() {
  saveCartItems([]);
  renderCartModalContent();
}

function updateCartBadge() {
  const items = getCartItems();
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalCount > 0) {
    badge.textContent = totalCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function toggleCartModal() {
  const modal = document.getElementById('cart-modal');
  if (!modal) return;

  if (modal.classList.contains('hidden')) {
    renderCartModalContent();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } else {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function renderCartModalContent() {
  const container = document.getElementById('cart-items-list');
  const totalEl = document.getElementById('cart-total-amount');
  const countEl = document.getElementById('cart-total-count');
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  if (!container) return;

  const items = getCartItems();

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <p class="text-3xl mb-2">🧺</p>
        <p class="text-sm font-semibold">Keranjang Belanja Masih Kosong</p>
        <p class="text-xs text-gray-400 mt-1">Pilih produk di katalog dan tambahkan ke keranjang.</p>
      </div>
    `;
    if (totalEl) totalEl.textContent = 'Rp0';
    if (countEl) countEl.textContent = '0 item';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  let totalAmount = 0;
  let totalQty = 0;

  const html = items
    .map((item) => {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;
      totalQty += item.quantity;

      return `
      <div class="flex items-center justify-between p-3 bg-gray-50/80 rounded-2xl border border-gray-200/60">
        <div class="flex-1 min-w-0 pr-2">
          <p class="text-xs font-bold text-gray-900 truncate">${item.name}</p>
          <p class="text-[11px] text-gray-400">Rp${item.price.toLocaleString('id-ID')} / unit</p>
          <p class="text-xs font-extrabold text-blue-600 mt-0.5">Rp${subtotal.toLocaleString('id-ID')}</p>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onclick="updateCartItemQty(${item.productId}, -1)"
              class="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100"
            >-</button>
            <span class="w-7 text-center text-xs font-bold text-gray-800">${item.quantity}</span>
            <button
              type="button"
              onclick="updateCartItemQty(${item.productId}, 1)"
              class="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100"
            >+</button>
          </div>

          <button
            type="button"
            onclick="removeCartItem(${item.productId})"
            class="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
            title="Hapus"
          >✕</button>
        </div>
      </div>
    `;
    })
    .join('');

  container.innerHTML = html;
  if (totalEl) totalEl.textContent = 'Rp' + totalAmount.toLocaleString('id-ID');
  if (countEl) countEl.textContent = totalQty + ' item (' + items.length + ' jenis)';
  if (checkoutBtn) checkoutBtn.disabled = false;
}

async function handleCartCheckout(event) {
  event.preventDefault();
  const items = getCartItems();
  if (items.length === 0) {
    alert('Keranjang Anda kosong!');
    return;
  }

  const buyerInput = document.getElementById('cart-buyer-name');
  const buyerName = buyerInput ? buyerInput.value.trim() : '';

  if (!buyerName) {
    alert('Silakan masukkan nama pembeli terlebih dahulu!');
    if (buyerInput) buyerInput.focus();
    return;
  }

  const payloadItems = items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
  }));

  const checkoutBtn = document.getElementById('cart-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = 'Memproses Pesanan... ⏳';
  }

  try {
    const response = await fetch('/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        buyerName,
        items: payloadItems,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      alert('Gagal checkout: ' + data.message);
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Bayar & Pesan Sekarang 🚀';
      }
      return;
    }

    // Berhasil: kosongkan keranjang dan redirect
    clearCart();
    window.location.href = data.redirectUrl || '/invoices?orderId=' + data.order.id;
  } catch (err) {
    alert('Terjadi kesalahan jaringan: ' + err.message);
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = 'Bayar & Pesan Sekarang 🚀';
    }
  }
}

function showToast(message) {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className =
      'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl transition-opacity duration-300 opacity-0 pointer-events-none flex items-center gap-2';
    document.body.appendChild(toast);
  }

  toast.innerHTML = message;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2500);
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
