// ═══════════════════════════════════════════════
//  PEDIDOS — orders.js
// ═══════════════════════════════════════════════

async function submitOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-order-btn');
  btn.disabled = true;
  btn.textContent = 'Enviando pedido...';

  if (cart.length === 0) {
    showToast('Tu carrito está vacío', 'error');
    btn.disabled = false; btn.textContent = 'Confirmar pedido';
    return;
  }

  const name     = document.getElementById('f-name').value.trim();
  const lastname = document.getElementById('f-lastname').value.trim();
  const phone    = document.getElementById('f-phone').value.trim();
  const email    = document.getElementById('f-email').value.trim();
  const address  = document.getElementById('f-address').value.trim();
  const shipping = document.getElementById('f-shipping').checked;
  const notes    = document.getElementById('f-notes').value.trim();

  if (!name || !lastname || !phone || !email) {
    showToast('Por favor completa todos los campos obligatorios', 'error');
    btn.disabled = false; btn.textContent = 'Confirmar pedido';
    return;
  }

  const totalAmount = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const orderId = 'ORD-' + Date.now();

  // 1. Verificar stock disponible para todos los items
  for (const item of cart) {
    const { data: prod } = await db
      .from('products')
      .select('stock, name')
      .eq('id', item.id)
      .single();

    if (!prod || prod.stock < item.qty) {
      showToast(`Stock insuficiente para "${item.name}". Ajusta tu carrito.`, 'error');
      btn.disabled = false; btn.textContent = 'Confirmar pedido';
      return;
    }
  }

  // 2. Crear pedido en Supabase
  const { data: order, error: orderErr } = await db
    .from('orders')
    .insert({
      order_id: orderId,
      customer_name: name,
      customer_lastname: lastname,
      customer_phone: phone,
      customer_email: email,
      customer_address: shipping ? address : null,
      needs_shipping: shipping,
      notes: notes,
      total_amount: totalAmount,
      status: 'pending',
      items: cart
    })
    .select()
    .single();

  if (orderErr) {
    console.error(orderErr);
    showToast('Error al procesar el pedido. Intenta de nuevo.', 'error');
    btn.disabled = false; btn.textContent = 'Confirmar pedido';
    return;
  }

  // 3. Descontar stock temporalmente (se restaura si se rechaza)
  for (const item of cart) {
    await db.rpc('decrement_stock', { product_id: item.id, amount: item.qty });
  }

  // 4. Notificar por WhatsApp al admin
  notifyWhatsApp(order, orderId);

  // 5. Notificar por email (EmailJS)
  notifyEmail(order, orderId);

  // 6. Limpiar carrito
  cart = [];
  saveCart();

  // 7. Mostrar confirmación
  showPage('confirmation');
  document.getElementById('confirm-order-id').textContent = orderId;
  document.getElementById('confirm-name').textContent = name + ' ' + lastname;

  btn.disabled = false;
  btn.textContent = 'Confirmar pedido';
}

function notifyWhatsApp(order, orderId) {
  const adminUrl = `${SITE_URL}/admin.html?order=${orderId}`;
  const itemsList = order.items.map(i => `• ${i.name} x${i.qty} — ${(i.price * i.qty).toFixed(2)}€`).join('\n');

  const msg = encodeURIComponent(
    `🛒 *NUEVO PEDIDO — GyRTECH*\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `📦 Pedido: *${orderId}*\n` +
    `👤 Cliente: ${order.customer_name} ${order.customer_lastname}\n` +
    `📞 Teléfono: ${order.customer_phone}\n` +
    `📧 Email: ${order.customer_email}\n` +
    (order.needs_shipping ? `📍 Dirección: ${order.customer_address}\n` : `🏪 Recojo en tienda\n`) +
    `━━━━━━━━━━━━━━━━━\n` +
    `${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `💰 *Total: ${order.total_amount.toFixed(2)} €*\n\n` +
    `🔗 Panel admin:\n${adminUrl}`
  );

  // Abre WhatsApp Web con el mensaje prellenado
  window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, '_blank');
}

async function notifyEmail(order, orderId) {
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'TU_PUBLIC_KEY') return;

  const adminUrl = `${SITE_URL}/admin.html`;
  const itemsList = order.items.map(i =>
    `${i.name} x${i.qty} — ${(i.price * i.qty).toFixed(2)} €`
  ).join('\n');

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: ADMIN_EMAIL,
      order_id: orderId,
      customer_name: `${order.customer_name} ${order.customer_lastname}`,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      customer_address: order.needs_shipping ? order.customer_address : 'Recojo en tienda',
      items_list: itemsList,
      total: order.total_amount.toFixed(2) + ' €',
      admin_url: adminUrl
    });
  } catch (err) {
    console.warn('EmailJS error:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('checkout-form');
  if (form) form.addEventListener('submit', submitOrder);

  const shippingCheck = document.getElementById('f-shipping');
  const addressRow = document.getElementById('address-row');
  if (shippingCheck && addressRow) {
    shippingCheck.addEventListener('change', () => {
      addressRow.style.display = shippingCheck.checked ? 'block' : 'none';
    });
  }
});
