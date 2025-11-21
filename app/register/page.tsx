'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeText,
  checkRateLimit,
  clearRateLimit,
  getRateLimitIdentifier,
  logSecurityEvent,
} from '@/utils/security';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  // Redireciona se já estiver autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Rate limiting
    const identifier = getRateLimitIdentifier(formData.email);
    const rateLimitCheck = checkRateLimit(identifier, 'signup');
    if (!rateLimitCheck.allowed) {
      setError(
        `Muitas tentativas de cadastro. Tente novamente em ${rateLimitCheck.retryAfter} minutos.`
      );
      logSecurityEvent({
        type: 'rate_limit_exceeded',
        identifier,
        timestamp: Date.now(),
        details: { action: 'signup' },
      });
      setIsLoading(false);
      return;
    }

    // Validação de campos obrigatórios
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    // Validação de nome
    const nameValidation = validateName(sanitizeText(formData.name.trim()));
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Nome inválido.');
      setIsLoading(false);
      return;
    }

    // Validação de email
    if (!validateEmail(formData.email.trim())) {
      setError('Por favor, insira um e-mail válido.');
      setIsLoading(false);
      return;
    }

    // Validação de senha
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0] || 'Senha inválida.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    logSecurityEvent({
      type: 'signup_attempt',
      identifier,
      timestamp: Date.now(),
    });

    setIsLoading(true);

    try {
      const sanitizedName = sanitizeText(formData.name.trim(), 100);
      const sanitizedEmail = formData.email.trim().toLowerCase();

      const productionUrl = typeof window !== 'undefined' ? window.location.origin : 'https://labprompt.com.br';
      const redirectTo = `${productionUrl}/auth/callback`;

      const { data, error: authError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: formData.password,
        options: {
          data: {
            full_name: sanitizedName,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (authError) {
        logSecurityEvent({
          type: 'suspicious_activity',
          identifier,
          timestamp: Date.now(),
          details: { error: authError.message, action: 'signup_failed' },
        });

        const errorMessage = authError.message || '';

        if (errorMessage.includes('User already registered') || errorMessage.includes('already registered') || errorMessage.includes('email_already_exists')) {
          setError('Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.');
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          setError('❌ Erro de conexão com o banco de dados.\n\n⚠️ IMPORTANTE: Este projeto usa Next.js!\n\n🔧 Variáveis de ambiente devem ter prefixo NEXT_PUBLIC_:\n   ✅ NEXT_PUBLIC_SUPABASE_URL\n   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n📋 Configure na Vercel: Settings → Environment Variables');
        } else if (errorMessage.includes('Password') || errorMessage.includes('password')) {
          if (errorMessage.includes('length') || errorMessage.includes('6')) {
            setError('A senha deve atender aos requisitos de segurança (mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial).');
          } else {
            setError('A senha não atende aos requisitos de segurança.');
          }
        } else {
          setError(`Erro ao criar conta: ${authError.message || 'Por favor, tente novamente.'}`);
        }
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        clearRateLimit(identifier);
        setSavedEmail(sanitizedEmail);
        setSuccess('✅ Conta criada com sucesso!\n\n📧 Enviamos um email de confirmação para você. Por favor, verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.\n\n⚠️ Se não encontrar o email, verifique também a pasta de spam/lixo eletrônico.');
        logSecurityEvent({
          type: 'signup_success',
          identifier,
          timestamp: Date.now(),
        });

        // Limpar formulário
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err: any) {
      console.error('Erro ao criar conta:', err);
      setError('Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!savedEmail) return;

    setIsResending(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: savedEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'https://labprompt.com.br/auth/callback',
        },
      });

      if (resendError) {
        setError('Erro ao reenviar email. Tente novamente.');
      } else {
        setSuccess('✅ Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.');
      }
    } catch (err) {
      console.error('Erro ao reenviar email:', err);
      setError('Erro ao reenviar email. Tente novamente.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl mb-4">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-white/60">Comece sua jornada de engenharia de prompts</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4 text-emerald-400 text-sm whitespace-pre-line mb-4">
              {success}
              {savedEmail && (
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="mt-3 w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isResending ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm whitespace-pre-line mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Seu nome completo"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="seu@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-white/50">
                Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

