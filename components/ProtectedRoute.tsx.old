import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticação inicial
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // 🔒 VALIDAÇÃO CRÍTICA: Verificar se o email foi confirmado
        const confirmed = !!(session.user.email_confirmed_at || session.user.confirmed_at);
        
        if (!confirmed) {
          // Email não confirmado - fazer logout e redirecionar
          console.warn('⚠️ Tentativa de acessar rota protegida com email não confirmado');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setEmailConfirmed(false);
          setIsLoading(false);
          navigate('/login', { replace: true, state: { message: 'Por favor, confirme seu e-mail antes de acessar o dashboard.' } });
          return;
        }
        
        setEmailConfirmed(true);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setEmailConfirmed(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // 🔒 VALIDAÇÃO: Verificar se o email foi confirmado
        const confirmed = !!(session.user.email_confirmed_at || session.user.confirmed_at);
        
        if (!confirmed) {
          // Email não confirmado - fazer logout
          console.warn('⚠️ Sessão detectada com email não confirmado - fazendo logout');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setEmailConfirmed(false);
          setIsLoading(false);
          navigate('/login', { replace: true, state: { message: 'Por favor, confirme seu e-mail antes de acessar o dashboard.' } });
          return;
        }
        
        setEmailConfirmed(true);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setEmailConfirmed(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-12 w-12 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white/60">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // 🔒 Só permite acesso se estiver autenticado E com email confirmado
  if (!isAuthenticated || !emailConfirmed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

