'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signOut, getCurrentProfile } from '../services/supabaseService';
import { isSuperAdmin } from '../services/adminService';

export const Header: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticação inicial
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError);
          setIsAuthenticated(false);
          return;
        }
        
        setIsAuthenticated(!!session);

        if (session?.user) {
          setUserEmail(session.user.email || null);
          
          // Verificar se é admin
          try {
            const adminCheck = await isSuperAdmin();
            setIsAdmin(adminCheck);
            console.log('🔐 [Header] Verificação de admin:', adminCheck, 'Email:', session.user.email);
          } catch (error) {
            console.error('Erro ao verificar admin:', error);
            setIsAdmin(false);
          }
          
          // Buscar perfil do usuário
          try {
            const profile = await getCurrentProfile();
            if (profile) {
              setUserName(profile.full_name || null);
            }
          } catch (error) {
            console.error('Erro ao buscar perfil:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        setUserEmail(session.user.email || null);
        
        // Verificar se é admin
        try {
          const adminCheck = await isSuperAdmin();
          setIsAdmin(adminCheck);
          console.log('🔐 [Header] Admin verificado após mudança de auth:', adminCheck);
        } catch (error) {
          console.error('Erro ao verificar admin:', error);
          setIsAdmin(false);
        }
        
        // Buscar perfil do usuário
        getCurrentProfile().then(profile => {
          if (profile) {
            setUserName(profile.full_name || null);
          }
        }).catch(error => {
          console.error('Erro ao buscar perfil:', error);
        });
      } else {
        setUserEmail(null);
        setUserName(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDiagnostics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const profile = await getCurrentProfile();
      
      const info = {
        session: {
          exists: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          confirmedAt: session?.user?.confirmed_at,
        },
        profile: profile ? {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
        } : null,
        admin: {
          isAdmin: isAdmin,
        },
      };
      
      console.log('🔍 [Diagnóstico]', info);
      setDiagnosticInfo(info);
      setShowDiagnostics(true);
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      alert('Erro ao gerar diagnóstico: ' + (error as any).message);
    }
  };

  const handleForceLogout = () => {
    console.log('💣 [Header] FORÇANDO LOGOUT COMPLETO...');
    
    // Limpar TUDO sem esperar
    if (typeof window !== 'undefined') {
      // Limpar storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpar cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Limpar cache se possível
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Redirecionar IMEDIATAMENTE
      window.location.href = '/login';
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 [Header] Iniciando logout...');
      
      // Limpar sessão do Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('❌ [Header] Erro ao fazer signOut:', signOutError);
        // Forçar logout se falhar
        handleForceLogout();
        return;
      }
      
      console.log('✅ [Header] SignOut bem-sucedido');
      
      // Limpar estados locais
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserName(null);
      setIsAdmin(false);
      
      // Limpar tudo e redirecionar
      handleForceLogout();
    } catch (error) {
      console.error('❌ [Header] Erro ao fazer logout:', error);
      // Forçar logout mesmo com erro
      handleForceLogout();
    }
  };

  return (
    <header className="bg-black border-b border-white/10">
      <div className="container mx-auto px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg
              className="w-10 h-10 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wider">
                LaBPrompT
              </h1>
              <p className="text-sm text-emerald-400/80">Laboratório de Engenharia de Prompt</p>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block mr-2">
                <p className="text-sm text-white font-medium">
                  {isAdmin && '🔐 '}{userName || userEmail}
                </p>
                <p className="text-xs text-white/60">{userEmail}</p>
              </div>
              <button
                onClick={handleDiagnostics}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                title="Diagnóstico da conta"
              >
                🔍
              </button>
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                  title="Painel de Administração"
                >
                  🔐
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                title="Logout normal"
              >
                Sair
              </button>
              <button
                onClick={handleForceLogout}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
                title="FORÇAR LOGOUT E LIMPAR TUDO"
              >
                💣
              </button>
            </div>
          )}
          
          {/* Modal de Diagnóstico */}
          {showDiagnostics && diagnosticInfo && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">🔍 Diagnóstico da Conta</h3>
                  <button 
                    onClick={() => setShowDiagnostics(false)}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-400 mb-2">Sessão</h4>
                    <pre className="text-xs text-white/80 overflow-auto">
                      {JSON.stringify(diagnosticInfo.session, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-400 mb-2">Perfil</h4>
                    <pre className="text-xs text-white/80 overflow-auto">
                      {JSON.stringify(diagnosticInfo.profile, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-400 mb-2">Admin</h4>
                    <pre className="text-xs text-white/80 overflow-auto">
                      {JSON.stringify(diagnosticInfo.admin, null, 2)}
                    </pre>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(diagnosticInfo, null, 2));
                      alert('Informações copiadas!');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Copiar Info
                  </button>
                  <button
                    onClick={() => setShowDiagnostics(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};