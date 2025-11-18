import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, supabase, getCurrentProfile } from '../services/supabaseService';
import { isSuperAdmin } from '../services/adminService';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || null);
        try {
          const profile = await getCurrentProfile();
          if (profile) {
            setUserName(profile.full_name || null);
            setAvatarUrl(profile.avatar_url || null);
          }
          // Verificar se é admin
          console.log('🔍 [Sidebar] Verificando se é super admin...');
          const adminCheck = await isSuperAdmin();
          console.log('✅ [Sidebar] É super admin?', adminCheck);
          setIsAdminUser(adminCheck);
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        getCurrentProfile().then(profile => {
          if (profile) {
            setUserName(profile.full_name || null);
            setAvatarUrl(profile.avatar_url || null);
          }
        }).catch(() => {});
        isSuperAdmin().then(isAdmin => {
          console.log('✅ [Sidebar] Verificação de admin (onAuthStateChange):', isAdmin);
          setIsAdminUser(isAdmin);
        }).catch((error) => {
          console.error('❌ [Sidebar] Erro ao verificar admin:', error);
        });
      } else {
        setUserEmail(null);
        setUserName(null);
        setAvatarUrl(null);
      }
    });

    // Listener para atualizações de perfil (quando o nome é alterado)
    const handleProfileUpdate = async () => {
      try {
        const profile = await getCurrentProfile();
        if (profile) {
          setUserName(profile.full_name || null);
          setAvatarUrl(profile.avatar_url || null);
        }
      } catch (error) {
        console.error('Erro ao atualizar perfil no Sidebar:', error);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    {
      label: 'Workspace',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/dashboard',
      active: location.pathname === '/dashboard',
    },
    {
      label: 'Repositório',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      path: '/dashboard/repository',
      active: location.pathname === '/dashboard/repository',
    },
    {
      label: 'Configurações',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/dashboard/settings',
      active: location.pathname === '/dashboard/settings',
    },
    ...(isAdminUser ? [{
      label: 'Admin Master',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      path: '/admin',
      active: location.pathname === '/admin',
    }] : []),
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-black border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          flex flex-col shadow-2xl
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">LaBPrompT</h1>
              <p className="text-xs text-white/40">IA Engineering</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onMobileClose();
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${item.active
                  ? 'bg-white/5 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <span className={item.active ? 'text-emerald-400' : 'text-white/40 group-hover:text-emerald-400/60'}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/5 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-amber-500/30 overflow-hidden border-2 border-white/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white truncate">
                  {userName || 'Usuário'}
                </p>
                {isAdminUser && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 rounded text-amber-400 text-xs font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 truncate">
                {userEmail || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all duration-200 border border-white/5 hover:border-white/10 text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};
