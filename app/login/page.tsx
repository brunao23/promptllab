'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  validateEmail,
  sanitizeText,
  checkRateLimit,
  clearRateLimit,
  getRateLimitIdentifier,
  logSecurityEvent,
} from '@/utils/security';

export default function LoginPage() {
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

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validação de campos obrigatórios
      if (!formData.email || !formData.password) {
        setError('Por favor, preencha todos os campos.');
        setIsLoading(false);
        return;
      }

      // Validação de email
      const sanitizedEmail = formData.email.trim().toLowerCase();
      if (!validateEmail(sanitizedEmail)) {
        setError('Por favor, insira um e-mail válido.');
        setIsLoading(false);
        return;
      }

      // Rate limiting
      const identifier = getRateLimitIdentifier(sanitizedEmail);
      const rateLimitCheck = checkRateLimit(identifier, 'login');
      if (!rateLimitCheck.allowed) {
        setError(
          `Muitas tentativas de login. Tente novamente em ${rateLimitCheck.retryAfter} minutos.`
        );
        logSecurityEvent({
          type: 'rate_limit_exceeded',
          identifier,
          timestamp: Date.now(),
          details: { action: 'login', email: sanitizedEmail },
        });
        setIsLoading(false);
        return;
      }

      logSecurityEvent({
        type: 'login_attempt',
        identifier,
        timestamp: Date.now(),
      });

      // Autenticação
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: formData.password,
      });

      if (authError) {
        logSecurityEvent({
          type: 'login_failed',
          identifier,
          timestamp: Date.now(),
          details: { error: authError.message, email: sanitizedEmail },
        });

        const errorMessage = authError.message || '';

        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid credentials')) {
          setError('E-mail ou senha incorretos. Tente novamente.');
        } else if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
          setError('🔒 Por favor, confirme seu e-mail antes de fazer login.\n\n📧 Verifique sua caixa de entrada e clique no link de confirmação enviado por email.');
        } else if (errorMessage.includes('Too many requests')) {
          setError('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          setError('❌ Erro de conexão com o banco de dados.\n\n⚠️ IMPORTANTE: Este projeto usa Next.js!\n\n🔧 Variáveis de ambiente devem ter prefixo NEXT_PUBLIC_:\n   ✅ NEXT_PUBLIC_SUPABASE_URL\n   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n📋 Configure na Vercel: Settings → Environment Variables');
        } else {
          setError(`Erro ao fazer login: ${authError.message || 'Por favor, verifique suas credenciais e tente novamente.'}`);
        }
        setIsLoading(false);
        return;
      }

      // Verificar se o email foi confirmado
      if (data?.user) {
        if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
          await supabase.auth.signOut();
          setError('🔒 Seu e-mail ainda não foi confirmado.\n\n📧 Por favor, verifique sua caixa de entrada e clique no link de confirmação enviado por email.');
          logSecurityEvent({
            type: 'suspicious_activity',
            identifier,
            timestamp: Date.now(),
            details: { action: 'login_attempt_unconfirmed_email', email: sanitizedEmail },
          });
          setIsLoading(false);
          return;
        }

        clearRateLimit(identifier);
        logSecurityEvent({
          type: 'login_success',
          identifier,
          timestamp: Date.now(),
        });

        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError('Erro inesperado. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl mb-4">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h1>
          <p className="text-white/60">Faça login para continuar</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm whitespace-pre-line">
                {error}
              </div>
            )}

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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

