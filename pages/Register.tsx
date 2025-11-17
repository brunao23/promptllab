import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, supabase } from '../services/supabaseService';

export const Register: React.FC = () => {
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
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    setIsLoading(true);

    try {
      // Cadastro real com Supabase
      const { data, error: authError } = await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.name,
      });

      if (authError) {
        // Tratamento de erros mais amigável em português
        const errorMessage = authError.message || '';
        
        if (errorMessage.includes('User already registered') || errorMessage.includes('already registered') || errorMessage.includes('email_already_exists')) {
          setError('Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.');
        } else if (errorMessage.includes('Password') || errorMessage.includes('password')) {
          if (errorMessage.includes('length') || errorMessage.includes('6')) {
            setError('A senha deve ter pelo menos 6 caracteres.');
          } else {
            setError('A senha não atende aos requisitos de segurança.');
          }
        } else if (errorMessage.includes('Email') || errorMessage.includes('email')) {
          if (errorMessage.includes('invalid') || errorMessage.includes('formato')) {
            setError('Por favor, insira um e-mail válido.');
          } else {
            setError('Erro com o e-mail fornecido. Verifique e tente novamente.');
          }
        } else if (errorMessage.includes('rate_limit') || errorMessage.includes('Too many requests')) {
          setError('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
        } else if (errorMessage.includes('Signup is disabled')) {
          setError('O cadastro está temporariamente desabilitado. Entre em contato com o suporte.');
        } else {
          setError('Erro ao criar conta. Por favor, verifique os dados e tente novamente.');
        }
        return;
      }

      // Cadastro bem-sucedido
      if (data?.user) {
        // Verificar se precisa confirmar email
        if (data.user.confirmed_at) {
          // Email já confirmado - redirecionar
          setSuccess('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          // Email precisa ser confirmado
          setSuccess(
            'Conta criada com sucesso! Enviamos um e-mail de confirmação para você. ' +
            'Clique no link do e-mail para ativar sua conta e começar a usar a ferramenta.'
          );
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
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
          <h2 className="text-3xl font-bold text-white mb-2">Criar conta</h2>
          <p className="text-slate-400">Comece a criar prompts profissionais hoje</p>
        </div>

        {/* Formulário */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-red-200 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 text-green-200 text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Nome completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                placeholder="João Silva"
              />
            </div>

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
                minLength={6}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                placeholder="Digite a senha novamente"
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 bg-slate-700 border-slate-600 rounded text-cyan-500 focus:ring-cyan-500 focus:ring-2"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-slate-400">
                Eu concordo com os{' '}
                <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">
                  Política de Privacidade
                </Link>
              </label>
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
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Fazer login
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

