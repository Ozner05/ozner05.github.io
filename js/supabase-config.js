// ═══════════════════════════════════════════════
//  CONFIGURACIÓN SUPABASE — edita solo estas 2 líneas
// ═══════════════════════════════════════════════
const SUPABASE_URL = 'https://cnkqqmpcezmttqyoyxdo.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_secret_NA0U3WJ9iNgb1HpMzQhqTA_h8K_grQI';

// WhatsApp del administrador (con código de país, sin + ni espacios)
const ADMIN_WHATSAPP = '51981059295'; // Ejemplo Perú: 51 + número

// Correo del administrador
const ADMIN_EMAIL = 'renzoromero@gmail.com';

// EmailJS (para notificaciones por correo)
const EMAILJS_SERVICE_ID  = 'service_brxdfbd';
const EMAILJS_TEMPLATE_ID = 'template_n8fm7fe';
const EMAILJS_PUBLIC_KEY  = 'k6aKK8BdqJ9YuR5ls';

// URL base de tu sitio en GitHub Pages
const SITE_URL = 'https://ozner05.github.io/';

// ── Init Supabase client ──────────────────────
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
