// ═══════════════════════════════════════════════
//  PEDIDOS — orders.js
// ═══════════════════════════════════════════════

async function submitOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-order-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

  if (cart.length === 0) {
    showToast('Tu carrito está vacío', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-bag-check me-2"></i>Confirmar pedido';
    return;
  }

  const name     = document.getElementById('f-name').value.trim();
  const lastname = document.getElementById('f-lastname').value.trim();
  const phone    = document.getElementById('f-phone').value.trim();
  const email    = document.getElementById('f-email')?.value.trim() || '';
  const shipping = document.getElementById('f-shipping')?.checked || false;
  const address  = document.getElementById('f-address')?.value.trim() || '';
  const notes    = document.getElementById('f-notes')?.value.trim() || '';

  if (!name || !lastname || !phone) {
    showToast('Por favor completa tu nombre y número de WhatsApp', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-bag-check me-2"></i>Confirmar pedido';
    return;
  }

  // Verificar stock en tiempo real
  for (const item of cart) {
    const { data: prod } = await db
      .from('products').select('stock, name').eq('id', item.id).single();
    if (!prod || prod.stock < item.qty) {
      showToast(`Stock insuficiente para "${item.name}". Ajusta tu carrito.`, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-bag-check me-2"></i>Confirmar pedido';
      return;
    }
  }

  const totalAmount = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const orderId = 'ORD-' + Date.now();

  // Guardar pedido en Supabase
  const { data: order, error: orderErr } = await db
    .from('orders')
    .insert({
      order_id: orderId,
      customer_name: name,
      customer_lastname: lastname,
      customer_phone: phone,
      customer_email: email || null,
      customer_address: shipping ? address : null,
      needs_shipping: shipping,
      notes: notes || null,
      total_amount: totalAmount,
      status: 'pending',
      items: cart
    })
    .select().single();

  if (orderErr) {
    console.error(orderErr);
    showToast('Error al enviar el pedido. Intenta de nuevo.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-bag-check me-2"></i>Confirmar pedido';
    return;
  }

  // Descontar stock
  for (const item of cart) {
    await db.rpc('decrement_stock', { product_id: item.id, amount: item.qty });
  }

  // Notificar WhatsApp al admin
  notifyWhatsApp(order, orderId);

  // Notificar email (si está configurado)
  notifyEmail(order, orderId);

  // Limpiar carrito
  cart = [];
  saveCart();

  // Mostrar confirmación
  showPage('confirmation');
  document.getElementById('confirm-order-id').textContent = orderId;
  document.getElementById('confirm-name').textContent = name + ' ' + lastname;

  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-bag-check me-2"></i>Confirmar pedido';
}

function notifyWhatsApp(order, orderId) {
  const adminUrl = `${SITE_URL}/admin.html`;
  const itemsList = order.items
    .map(i => `• ${i.name} x${i.qty} — ${(i.price * i.qty).toFixed(2)}€`)
    .join('\n');

  const msg = encodeURIComponent(
    `🛒 *NUEVO PEDIDO — GyRTECH*\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `📦 Pedido: *${orderId}*\n` +
    `👤 Cliente: ${order.customer_name} ${order.customer_lastname}\n` +
    `📞 WhatsApp: ${order.customer_phone}\n` +
    (order.customer_email ? `📧 Email: ${order.customer_email}\n` : '') +
    (order.needs_shipping ? `📍 Dirección: ${order.customer_address}\n` : `🏪 Recojo en tienda\n`) +
    (order.notes ? `💬 Nota: ${order.notes}\n` : '') +
    `━━━━━━━━━━━━━━━━━\n` +
    `${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `💰 *Total: ${order.total_amount.toFixed(2)} €*\n\n` +
    `🔗 Panel admin: ${adminUrl}`
  );

  window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, '_blank');
}

async function notifyEmail(order, orderId) {
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'TU_PUBLIC_KEY') return;

  const itemsList = order.items
    .map(i => `${i.name} x${i.qty} — ${(i.price * i.qty).toFixed(2)} €`)
    .join('\n');

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: ADMIN_EMAIL,
      order_id: orderId,
      customer_name: `${order.customer_name} ${order.customer_lastname}`,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email || '—',
      customer_address: order.needs_shipping ? order.customer_address : 'Recojo en tienda',
      items_list: itemsList,
      total: order.total_amount.toFixed(2) + ' €',
      admin_url: `${SITE_URL}/admin.html`
    });
  } catch (err) {
    console.warn('EmailJS error (no crítico):', err);
  }
}

// ── Resumen checkout ──────────────────────────
function renderCheckoutSummary() {
  const container = document.getElementById('checkout-summary');
  if (!container) return;

  const sum = cart.reduce((s, i) => s + i.price * i.qty, 0);
  container.innerHTML = cart.map(i => `
    <div class="checkout-item">
      <img src="${i.image}" alt="${i.name}" />
      <div style="flex:1">
        <p>${i.name}</p>
        <small>x${i.qty}</small>
      </div>
      <strong style="color:var(--purple);white-space:nowrap">${(i.price * i.qty).toFixed(2)} €</strong>
    </div>
  `).join('') + `
    <div class="checkout-total">
      <span>Total</span>
      <strong>${sum.toFixed(2)} €</strong>
    </div>
    <p style="font-size:.75rem;color:#aaa;margin-top:8px;text-align:center">
      💳 Coordinamos el pago contigo por WhatsApp
    </p>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('checkout-form');
  if (form) form.addEventListener('submit', submitOrder);
});
