// ═══════════════════════════════════════════════
//  CONFIGURACIÓN SUPABASE — edita solo estas 2 líneas
// ═══════════════════════════════════════════════
const SUPABASE_URL = 'https://cnkqqmpcezmttqyoyxdo.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNua3FxbXBjZXptdHRxeW95eGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjIwMTIsImV4cCI6MjA4OTQzODAxMn0.m4VdeSRXQ7QGx1BTqqJhbay2qI-DmEeiY8rDCfYvMP8';

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
