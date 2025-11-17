/**
 * 🔒 HEADERS DE SEGURANÇA HTTP
 * 
 * Configuração de headers de segurança para proteção adicional
 */

/**
 * Headers de segurança recomendados
 * 
 * Em produção, configure estes headers no Vercel ou no servidor:
 * 
 * vercel.json ou middleware:
 * - Content-Security-Policy
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Strict-Transport-Security
 * - Referrer-Policy
 * - Permissions-Policy
 */

export const SECURITY_HEADERS = {
  // Previne clickjacking
  'X-Frame-Options': 'DENY',
  
  // Previne MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Política de referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // HTTPS obrigatório (1 ano)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Permissões do navegador
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
  ].join(', '),
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

/**
 * Função para adicionar headers de segurança no cliente
 * (Para uso em middleware/fetch interceptors)
 */
export function addSecurityHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    'X-Requested-With': 'XMLHttpRequest',
  };
}

