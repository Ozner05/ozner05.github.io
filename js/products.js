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
  renderAllProducts(allProducts);
}

// ── Tarjeta de producto reutilizable ──────────
function productCardHTML(p) {
  const stockClass = p.stock <= 0 ? 'stock-empty' : p.stock <= 3 ? 'stock-low' : 'stock-ok';
  const stockText  = p.stock <= 0 ? 'Sin stock' : p.stock <= 3 ? `Últimas ${p.stock} unidades` : `En stock`;
  const disabled   = p.stock <= 0 ? 'disabled' : '';

  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="product-card-new">
        <img src="${p.image_url}" alt="${p.name}" loading="lazy" />
        <div class="product-card-body-new">
          <span class="stock-pill ${stockClass}">${stockText}</span>
          <h5>${p.name}</h5>
          <p class="prod-price">${p.price.toFixed(2)} €</p>
          <p class="prod-desc">${p.description}</p>
          <button class="btn-add-cart" onclick="addToCart('${p.id}')" ${disabled}>
            <i class="bi bi-bag-plus"></i>
            ${p.stock <= 0 ? 'Sin stock' : 'Añadir al carrito'}
          </button>
        </div>
      </div>
    </div>`;
}

// ── Home: los 4 primeros productos ───────────
function renderFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  const featured = allProducts.slice(0, 4);
  if (!featured.length) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-4">No hay productos disponibles aún.</div>`;
    return;
  }
  container.innerHTML = featured.map(productCardHTML).join('');
}

// ── Página Productos: todos, con filtro ───────
function renderAllProducts(products) {
  const container = document.getElementById('all-products');
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-5"><div style="font-size:2.5rem">🔍</div><p class="mt-2">No hay productos en esta categoría.</p></div>`;
    return;
  }
  container.innerHTML = products.map(productCardHTML).join('');
}

function filterProducts(category, btn) {
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const filtered = category === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === category);

  renderAllProducts(filtered);
}

document.addEventListener('DOMContentLoaded', loadProducts);
