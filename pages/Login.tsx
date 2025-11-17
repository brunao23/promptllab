import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, supabase } from '../services/supabaseService';
import { 
  validateEmail, 
  sanitizeText,
  checkRateLimit,
  clearRateLimit,
  getRateLimitIdentifier,
  logSecurityEvent,
} from '../utils/security';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // Redireciona se já estiver autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    };
    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
      // 🔒 VALIDAÇÃO DE ENTRADA - Campos obrigatórios
      if (!formData.email || !formData.password) {
        setError('Por favor, preencha todos os campos.');
        setIsLoading(false);
        return;
      }

      // 🔒 VALIDAÇÃO DE SEGURANÇA - Email
      const sanitizedEmail = formData.email.trim().toLowerCase();
      if (!validateEmail(sanitizedEmail)) {
        setError('Por favor, insira um e-mail válido.');
        setIsLoading(false);
        return;
      }

      // 🔒 VALIDAÇÃO DE SEGURANÇA - Rate Limiting (Proteção contra Brute Force)
      const identifier = getRateLimitIdentifier(sanitizedEmail);
      const rateLimitCheck = checkRateLimit(identifier, 'login');
      if (!rateLimitCheck.allowed) {
        setError(
          `Muitas tentativas de login. Sua conta foi temporariamente bloqueada. Tente novamente em ${rateLimitCheck.retryAfter} minutos.`
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

      // 🔒 LOG DE TENTATIVA DE LOGIN
      logSecurityEvent({
        type: 'login_attempt',
        identifier,
        timestamp: Date.now(),
      });

      // Autenticação real com Supabase
      const { data, error: authError } = await signIn({
        email: sanitizedEmail,
        password: formData.password,
      });

      if (authError) {
        // 🔒 LOG DE FALHA DE LOGIN (Brute Force Detection)
        logSecurityEvent({
          type: 'login_failed',
          identifier,
          timestamp: Date.now(),
          details: { error: authError.message, email: sanitizedEmail },
        });

        // Tratamento de erros mais amigável em português
        const errorMessage = authError.message || '';
        
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid credentials')) {
          setError('E-mail ou senha incorretos. Tente novamente.');
        } else if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
          setError('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.');
        } else if (errorMessage.includes('Too many requests') || errorMessage.includes('rate_limit')) {
          setError('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
        } else if (errorMessage.includes('User not found')) {
          setError('Usuário não encontrado. Verifique seu e-mail ou crie uma conta.');
        } else if (errorMessage.includes('Password')) {
          setError('Erro na senha. Verifique se digitou corretamente.');
        } else {
          setError('Erro ao fazer login. Por favor, verifique suas credenciais e tente novamente.');
        }
        return;
      }

      // Login bem-sucedido - o listener do useEffect redirecionará automaticamente
      if (data?.user) {
        // 🔒 Limpar rate limit após sucesso
        clearRateLimit(identifier);
        
        // 🔒 LOG DE LOGIN BEM-SUCEDIDO
        logSecurityEvent({
          type: 'login_success',
          identifier,
          timestamp: Date.now(),
        });
        
        // Navegação será feita pelo listener de auth state change
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-4">
            <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">LaBPrompT</h1>
              <p className="text-xs text-cyan-400/80">Laboratório de Engenharia de Prompt</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h2>
          <p className="text-slate-400">Faça login para continuar criando prompts</p>
        </div>

        {/* Formulário */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-cyan-500 focus:ring-cyan-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-slate-400">Lembrar-me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-all disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Criar conta gratuita
              </Link>
            </p>
          </div>
        </div>

        {/* Link para home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

