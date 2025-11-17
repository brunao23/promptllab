/**
 * 🔒 UTILITÁRIOS DE SEGURANÇA
 * 
 * Camada completa de segurança para proteção contra:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection (já protegido pelo Supabase, mas validamos inputs)
 * - CSRF (Cross-Site Request Forgery)
 * - Brute Force Attacks
 * - Input Validation
 * - Data Sanitization
 */

// =====================================================
// RATE LIMITING (Proteção contra Brute Force)
// =====================================================

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_CONFIG = {
  // Máximo de tentativas de login
  MAX_LOGIN_ATTEMPTS: 5,
  // Tempo de bloqueio em minutos após exceder tentativas
  BLOCK_DURATION_MINUTES: 15,
  // Janela de tempo em minutos para contar tentativas
  WINDOW_MINUTES: 15,
  // Máximo de requisições por minuto
  MAX_REQUESTS_PER_MINUTE: 60,
  // Máximo de requisições de cadastro por IP
  MAX_SIGNUP_PER_HOUR: 3,
};

/**
 * Verifica rate limiting para autenticação
 */
export function checkRateLimit(identifier: string, type: 'login' | 'signup' | 'api'): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      resetTime: now + (RATE_LIMIT_CONFIG.WINDOW_MINUTES * 60 * 1000),
      blocked: false,
    });
    return { allowed: true };
  }

  // Verificar se o bloqueio expirou
  if (entry.blocked && now < entry.resetTime) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000 / 60);
    return { allowed: false, retryAfter };
  }

  // Resetar se o período expirou
  if (now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      resetTime: now + (RATE_LIMIT_CONFIG.WINDOW_MINUTES * 60 * 1000),
      blocked: false,
    });
    return { allowed: true };
  }

  // Verificar limites
  const maxAttempts = type === 'login' 
    ? RATE_LIMIT_CONFIG.MAX_LOGIN_ATTEMPTS 
    : type === 'signup' 
    ? RATE_LIMIT_CONFIG.MAX_SIGNUP_PER_HOUR 
    : RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE;

  if (entry.attempts >= maxAttempts) {
    entry.blocked = true;
    entry.resetTime = now + (RATE_LIMIT_CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000);
    const retryAfter = RATE_LIMIT_CONFIG.BLOCK_DURATION_MINUTES;
    return { allowed: false, retryAfter };
  }

  entry.attempts++;
  return { allowed: true };
}

/**
 * Limpa tentativas bem-sucedidas após login
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Limpa entradas antigas do rate limit (chamado periodicamente)
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && !entry.blocked) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpar rate limit a cada 30 minutos
setInterval(cleanupRateLimit, 30 * 60 * 1000);

// =====================================================
// SANITIZAÇÃO DE DADOS (Proteção XSS)
// =====================================================

/**
 * Remove tags HTML e caracteres perigosos
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove tags HTML
    .replace(/<[^>]*>/g, '')
    // Remove scripts e eventos
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Remove caracteres de controle
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Normaliza espaços
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitiza texto mantendo formatação básica
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input
    // Remove apenas scripts perigosos, mantém HTML básico
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Remove caracteres de controle
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  // Limitar tamanho
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitiza objeto removendo propriedades perigosas
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  for (const key of dangerousKeys) {
    delete sanitized[key as keyof T];
  }
  
  return sanitized;
}

// =====================================================
// VALIDAÇÃO DE ENTRADA
// =====================================================

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida força da senha
 */
export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Senha é obrigatória'], strength: 'weak' };
  }

  // Verificar comprimento
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }

  if (password.length > 128) {
    errors.push('Senha muito longa (máximo 128 caracteres)');
  }

  // Verificar complexidade
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  if (!hasLowerCase) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  if (!hasNumbers) {
    errors.push('Senha deve conter pelo menos um número');
  }

  if (!hasSpecialChar) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }

  // Verificar senhas comuns (lista básica)
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'senha', '123456', '123456789', '1234567890'
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Senha muito comum. Escolha uma senha mais segura');
  }

  // Calcular força
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const criteriaMet = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, password.length >= 12].filter(Boolean).length;
  
  if (criteriaMet >= 4 && password.length >= 12) {
    strength = 'strong';
  } else if (criteriaMet >= 3) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Valida nome (sem caracteres especiais perigosos)
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nome é obrigatório' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Nome muito longo (máximo 100 caracteres)' };
  }

  // Permitir apenas letras, espaços, hífens e apostrofes
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, error: 'Nome contém caracteres inválidos' };
  }

  return { valid: true };
}

/**
 * Valida UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida e sanitiza texto do prompt
 */
export function validatePromptText(text: string, maxLength: number = 50000): { valid: boolean; error?: string; sanitized?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Texto é obrigatório' };
  }

  if (text.length > maxLength) {
    return { valid: false, error: `Texto muito longo (máximo ${maxLength} caracteres)` };
  }

  const sanitized = sanitizeText(text, maxLength);
  return { valid: true, sanitized };
}

// =====================================================
// PROTEÇÃO CSRF
// =====================================================

/**
 * Gera token CSRF
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida token CSRF (para uso em requisições futuras)
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  return token === storedToken && token.length === 64;
}

// =====================================================
// LOGS DE SEGURANÇA
// =====================================================

interface SecurityEvent {
  type: 'login_attempt' | 'login_failed' | 'login_success' | 'signup_attempt' | 'rate_limit_exceeded' | 'suspicious_activity';
  identifier: string;
  timestamp: number;
  details?: Record<string, any>;
}

/**
 * Registra evento de segurança (implementar persistência futura)
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // Em produção, enviar para serviço de logging/monitoramento
  if (import.meta.env.PROD) {
    // TODO: Enviar para serviço de monitoramento (ex: Sentry, CloudWatch)
    console.warn('🔒 Security Event:', event);
  } else {
    console.log('🔒 Security Event:', event);
  }
}

// =====================================================
// VALIDAÇÃO DE TAMANHO DE ARQUIVO
// =====================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }

  return { valid: true };
}

// =====================================================
// VALIDAÇÃO DE TIPO DE ARQUIVO
// =====================================================

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/html',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function validateFileType(file: File): { valid: boolean; error?: string } {
  const isValidType = ALLOWED_FILE_TYPES.includes(file.type) || 
                      file.name.toLowerCase().endsWith('.md') ||
                      file.name.toLowerCase().endsWith('.txt');
  
  if (!isValidType) {
    return { 
      valid: false, 
      error: 'Tipo de arquivo não permitido. Use PDF, TXT, MD, DOC ou DOCX.' 
    };
  }

  return { valid: true };
}

// =====================================================
// HELPER: Obter identificador para rate limiting
// =====================================================

export function getRateLimitIdentifier(email?: string, ip?: string): string {
  // Em produção, usar IP + email
  // Em desenvolvimento, usar apenas email
  if (import.meta.env.PROD && ip) {
    return `${email || 'anonymous'}_${ip}`;
  }
  return email || 'anonymous';
}

