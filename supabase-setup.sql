-- ═══════════════════════════════════════════════════════════
--  GYRTECH — Supabase SQL Setup
--  Pega esto en: Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────
-- 1. TABLA: products
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  image_url   TEXT,
  category    TEXT DEFAULT 'general',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. TABLA: orders
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                 BIGSERIAL PRIMARY KEY,
  order_id           TEXT UNIQUE NOT NULL,
  customer_name      TEXT NOT NULL,
  customer_lastname  TEXT NOT NULL,
  customer_phone     TEXT NOT NULL,
  customer_email     TEXT NOT NULL,
  customer_address   TEXT,
  needs_shipping     BOOLEAN DEFAULT FALSE,
  notes              TEXT,
  total_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
  items              JSONB NOT NULL DEFAULT '[]',
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. FUNCIONES RPC para stock
-- ─────────────────────────────────────────────

-- Decrementar stock (cuando se hace un pedido)
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - amount)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementar stock (cuando se rechaza un pedido)
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock + amount
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Activar RLS en ambas tablas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: cualquiera puede leer
CREATE POLICY "productos_lectura_publica"
  ON products FOR SELECT
  USING (true);

-- PRODUCTS: solo admin autenticado puede modificar
CREATE POLICY "productos_admin_escritura"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- ORDERS: cualquiera puede crear un pedido
CREATE POLICY "pedidos_insertar_publico"
  ON orders FOR INSERT
  WITH CHECK (true);

-- ORDERS: cualquiera puede leer (para confirmación)
CREATE POLICY "pedidos_lectura_publica"
  ON orders FOR SELECT
  USING (true);

-- ORDERS: solo admin puede actualizar (aprobar/rechazar)
CREATE POLICY "pedidos_admin_actualizar"
  ON orders FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- 5. DATOS DE EJEMPLO — tus productos
--    ¡Edita nombre, precio, stock e image_url!
-- ─────────────────────────────────────────────
INSERT INTO products (name, description, price, stock, image_url, category) VALUES

('Smartphone XYZ',
 'Smartphone con cámara de alta resolución y batería de larga duración, ideal para quienes buscan rendimiento y estilo. ¡No te quedes sin el tuyo!',
 699.00, 5,
 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
 'electronica'),

('Auriculares Inalámbricos Pro',
 'Disfruta de un sonido envolvente con cancelación de ruido y diseño ergonómico, perfectos para cualquier ocasión.',
 149.00, 8,
 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
 'electronica'),

('Cámara Digital Compacta',
 'Captura tus momentos más preciados con tecnología avanzada y diseño ligero. Perfecta para llevar a cualquier lugar.',
 249.00, 4,
 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
 'electronica'),

('Altavoz Bluetooth Portátil',
 'Lleva tu música a todas partes. Sonido potente y batería de larga duración, ideal para cualquier aventura.',
 59.00, 12,
 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
 'electronica'),

('Tónico Facial Revitalizante',
 'Revitaliza y refresca tu piel con fórmula enriquecida con extractos botánicos. Ideal para todo tipo de piel.',
 29.00, 20,
 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
 'skincare'),

('Rizador de Cabello Automático',
 'Consigue ondas perfectas en minutos. Tecnología de cerámica que protege el cabello y garantiza resultados profesionales.',
 79.00, 6,
 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
 'belleza');
