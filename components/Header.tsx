'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signOut, getCurrentProfile } from '../services/supabaseService';

export const Header: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar autenticação inicial
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      if (session?.user) {
        setUserEmail(session.user.email || null);
        
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
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        setUserEmail(session.user.email || null);
        
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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-white font-medium">{userName || userEmail}</p>
                <p className="text-xs text-white/60">{userEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};