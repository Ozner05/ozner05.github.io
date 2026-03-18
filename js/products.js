// ═══════════════════════════════════════════════
//  PRODUCTOS — products.js
// ═══════════════════════════════════════════════

let allProducts = [];

async function loadProducts() {
  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { console.error('Error cargando productos:', error); return; }
  allProducts = data || [];
  renderFeaturedProducts();
  renderAllProducts();
  renderNewProducts();
}

// Tienda destacada (home) — primeros 2 productos
function renderFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  const featured = allProducts.slice(0, 2);
  container.innerHTML = featured.map(p => `
    <div class="product-row">
      <img src="${p.image_url}" alt="${p.name}" />
      <div class="product-info">
        <h4>${p.name}</h4>
        <p class="product-price">${p.price.toFixed(2)} €</p>
        <p>${p.description}</p>
        <div class="qty-control">
          <span>Cantidad</span>
          <button class="qty-btn" onclick="changeStaticQty(this,-1)">—</button>
          <span class="qty-num">1</span>
          <button class="qty-btn" onclick="changeStaticQty(this,1)">+</button>
        </div>
        ${stockBadge(p.stock)}
        <button class="btn-buy mt-2" onclick="addToCart('${p.id}')" ${p.stock <= 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
          ${p.stock <= 0 ? 'Sin stock' : 'Añadir al carrito'}
        </button>
      </div>
    </div>
  `).join('');
}

// Tienda completa (página Productos)
function renderAllProducts() {
  const container = document.getElementById('all-products');
  if (!container) return;

  container.innerHTML = allProducts.map(p => `
    <div class="product-row">
      <img src="${p.image_url}" alt="${p.name}" />
      <div class="product-info">
        <h4>${p.name}</h4>
        <p class="product-price">${p.price.toFixed(2)} €</p>
        <p>${p.description}</p>
        <div class="qty-control">
          <span>Cantidad</span>
          <button class="qty-btn" onclick="changeStaticQty(this,-1)">—</button>
          <span class="qty-num">1</span>
          <button class="qty-btn" onclick="changeStaticQty(this,1)">+</button>
        </div>
        ${stockBadge(p.stock)}
        <button class="btn-buy mt-2" onclick="addToCart('${p.id}')" ${p.stock <= 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
          ${p.stock <= 0 ? 'Sin stock' : 'Añadir al carrito'}
        </button>
      </div>
    </div>
  `).join('');
}

// Grid de novedades (tarjetas con hover)
function renderNewProducts() {
  const container = document.getElementById('new-products-grid');
  if (!container) return;

  container.innerHTML = allProducts.map(p => `
    <div class="col-md-4">
      <div class="product-card position-relative">
        <img src="${p.image_url}" alt="${p.name}" />
        <div class="card-hover-overlay">
          <button class="btn-comprar" onclick="addToCart('${p.id}')" ${p.stock <= 0 ? 'disabled' : ''}>
            ${p.stock <= 0 ? 'SIN STOCK' : 'AÑADIR AL CARRITO'}
          </button>
        </div>
        <div class="product-card-body">
          <h5>${p.name}</h5>
          <p class="price">${p.price.toFixed(2)} €</p>
          ${stockBadge(p.stock)}
        </div>
      </div>
    </div>
  `).join('');
}

function stockBadge(stock) {
  if (stock <= 0)  return `<span class="badge bg-danger mb-2">Sin stock</span>`;
  if (stock <= 3)  return `<span class="badge bg-warning text-dark mb-2">Últimas ${stock} unidades</span>`;
  return `<span class="badge bg-success mb-2">En stock (${stock})</span>`;
}

function changeStaticQty(btn, delta) {
  const row = btn.closest('.qty-control');
  const el = row.querySelector('.qty-num');
  let val = parseInt(el.textContent) + delta;
  if (val < 1) val = 1;
  el.textContent = val;
}

document.addEventListener('DOMContentLoaded', loadProducts);
