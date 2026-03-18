// ═══════════════════════════════════════════════
//  CARRITO — cart.js
// ═══════════════════════════════════════════════

let cart = JSON.parse(localStorage.getItem('gyrtech_cart') || '[]');

function saveCart() {
  localStorage.setItem('gyrtech_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = total;
    b.style.display = total > 0 ? 'flex' : 'none';
  });
}

async function addToCart(productId) {
  // Verificar stock en tiempo real
  const { data: prod, error } = await db
    .from('products')
    .select('id, name, price, stock, image_url')
    .eq('id', productId)
    .single();

  if (error || !prod) return showToast('Producto no encontrado', 'error');
  if (prod.stock <= 0) return showToast('Sin stock disponible', 'error');

  const existing = cart.find(i => i.id === productId);
  const inCart = existing ? existing.qty : 0;

  if (inCart >= prod.stock) {
    return showToast(`Solo hay ${prod.stock} unidades disponibles`, 'warning');
  }

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image_url,
      qty: 1,
      maxStock: prod.stock
    });
  }

  saveCart();
  showToast(`"${prod.name}" añadido al carrito ✓`, 'success');
  renderCartSidebar();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  renderCartSidebar();
}

function changeCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(productId);
  if (item.qty > item.maxStock) {
    item.qty = item.maxStock;
    showToast(`Máximo disponible: ${item.maxStock}`, 'warning');
  }
  saveCart();
  renderCartSidebar();
}

function renderCartSidebar() {
  const list = document.getElementById('cart-items-list');
  const total = document.getElementById('cart-total');
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `<div class="cart-empty"><i class="bi bi-bag-x" style="font-size:2.5rem;color:#ccc"></i><p style="color:#999;margin-top:12px">Tu carrito está vacío</p></div>`;
    total.textContent = '0.00';
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">${item.price.toFixed(2)} €</p>
        <div class="cart-item-qty">
          <button onclick="changeCartQty('${item.id}', -1)" class="qty-mini-btn">−</button>
          <span>${item.qty}</span>
          <button onclick="changeCartQty('${item.id}', 1)" class="qty-mini-btn">+</button>
        </div>
      </div>
      <button onclick="removeFromCart('${item.id}')" class="cart-item-remove"><i class="bi bi-x"></i></button>
    </div>
  `).join('');

  const sum = cart.reduce((s, i) => s + i.price * i.qty, 0);
  total.textContent = sum.toFixed(2);
}

function openCart() {
  renderCartSidebar();
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
}

function openCheckout() {
  if (cart.length === 0) return showToast('Tu carrito está vacío', 'warning');
  closeCart();
  showPage('checkout');
  renderCheckoutSummary();
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkout-summary');
  if (!container) return;
  const sum = cart.reduce((s, i) => s + i.price * i.qty, 0);
  container.innerHTML = cart.map(i => `
    <div class="checkout-item">
      <img src="${i.image}" alt="${i.name}" />
      <div>
        <p>${i.name}</p>
        <small>x${i.qty} — ${(i.price * i.qty).toFixed(2)} €</small>
      </div>
    </div>
  `).join('') + `
    <div class="checkout-total">
      <span>Total</span>
      <strong>${sum.toFixed(2)} €</strong>
    </div>`;
}

// ── Toast notification ────────────────────────
function showToast(msg, type = 'success') {
  const colors = { success: '#2d6a4f', error: '#c1121f', warning: '#e9730c' };
  const t = document.createElement('div');
  t.className = 'gyr-toast';
  t.style.background = colors[type] || colors.success;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

// Init
document.addEventListener('DOMContentLoaded', updateCartBadge);
