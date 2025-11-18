import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseService';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando sua conta...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar o hash da URL (Supabase envia os tokens no hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Se for confirmação de email
        if (type === 'signup' || accessToken) {
          // O Supabase já processa automaticamente o token no hash
          // Verificar se a sessão foi criada
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          if (session) {
            setStatus('success');
            setMessage('Email confirmado com sucesso! Redirecionando...');
            
            // Redirecionar para produção ou desenvolvimento
            const productionUrl = 'https://labprompt.com.br';
            const isProduction = window.location.hostname === 'labprompt.com.br' || 
                                 window.location.hostname.includes('vercel.app') ||
                                 !window.location.hostname.includes('localhost');
            
            // Aguardar um pouco antes de redirecionar
            setTimeout(() => {
              if (isProduction) {
                // Redirecionar para produção
                window.location.href = `${productionUrl}/dashboard`;
              } else {
                // Redirecionar para desenvolvimento
                navigate('/dashboard', { replace: true });
              }
            }, 2000);
          } else {
            throw new Error('Não foi possível criar a sessão');
          }
        } else {
          // Outros tipos de callback (recovery, etc.)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }

          if (session) {
            setStatus('success');
            setMessage('Autenticação bem-sucedida! Redirecionando...');
            
            // Redirecionar para produção ou desenvolvimento
            const productionUrl = 'https://labprompt.com.br';
            const isProduction = window.location.hostname === 'labprompt.com.br' || 
                                 window.location.hostname.includes('vercel.app') ||
                                 !window.location.hostname.includes('localhost');
            
            setTimeout(() => {
              if (isProduction) {
                // Redirecionar para produção
                window.location.href = `${productionUrl}/dashboard`;
              } else {
                // Redirecionar para desenvolvimento
                navigate('/dashboard', { replace: true });
              }
            }, 2000);
          } else {
            throw new Error('Token inválido ou expirado');
          }
        }
      } catch (error: any) {
        console.error('Erro no callback de autenticação:', error);
        setStatus('error');
        
        const errorMessage = error.message || '';
        
        if (errorMessage.includes('expired') || errorMessage.includes('expirado')) {
          setMessage('O link de confirmação expirou. Por favor, solicite um novo link de confirmação.');
        } else if (errorMessage.includes('invalid') || errorMessage.includes('inválido')) {
          setMessage('Link inválido ou já utilizado. Por favor, verifique o link no seu email ou solicite um novo.');
        } else if (errorMessage.includes('already confirmed') || errorMessage.includes('já confirmado')) {
          setMessage('Seu email já foi confirmado. Você pode fazer login agora.');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        } else if (errorMessage.includes('rate_limit') || errorMessage.includes('limite')) {
          setMessage('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
        } else {
          setMessage('Erro ao confirmar seu email. Por favor, tente novamente ou entre em contato com o suporte.');
        }
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 shadow-xl text-center">
          {status === 'loading' && (
            <>
              <div className="mb-6 flex justify-center">
                <svg
                  className="animate-spin h-12 w-12 text-emerald-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verificando...</h2>
              <p className="text-white/60">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6 flex justify-center">
                <svg
                  className="h-12 w-12 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Confirmado!</h2>
              <p className="text-white/60">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-6 flex justify-center">
                <svg
                  className="h-12 w-12 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Erro na Confirmação</h2>
              <p className="text-slate-400 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all"
                >
                  Ir para Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all"
                >
                  Criar Nova Conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

