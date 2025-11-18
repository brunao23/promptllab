import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { PromptManager } from '../components/PromptManager';
import { RepositoryPage } from './RepositoryPage';
import { SettingsPage } from './SettingsPage';
import { AdminPage } from './AdminPage';
import { TrialBanner } from '../components/TrialBanner';
import { SubscriptionInfo } from '../components/SubscriptionInfo';
import { DiagnosticPanel } from '../components/DiagnosticPanel';

export const Dashboard: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Fechar menu mobile ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Sidebar - Desktop */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header - Topo em telas pequenas */}
        <header className="lg:hidden sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">LaBPrompT</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Content Area - Scrollável */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-black">
          {/* Container responsivo com padding adequado */}
          <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 md:py-6 lg:py-8">
            {/* Diagnostic Panel - Apenas aparece se houver erro */}
            <div className="mb-3 sm:mb-4">
              <DiagnosticPanel />
            </div>

            {/* Trial Banner - Topo do conteúdo */}
            <div className="mb-4 sm:mb-5 md:mb-6">
              <TrialBanner />
            </div>

            {/* Grid Layout Principal - Totalmente Responsivo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {/* Conteúdo Principal - Esquerda */}
              <div className="lg:col-span-8 xl:col-span-9 order-2 lg:order-1">
                <div className="min-w-0 w-full">
                  <Routes>
                    <Route path="/" element={<PromptManager />} />
                    <Route path="/repository" element={<RepositoryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Routes>
                </div>
              </div>

              {/* Sidebar Direita - Subscription Info */}
              <aside className="lg:col-span-4 xl:col-span-3 order-1 lg:order-2">
                <div className="sticky top-4 lg:top-6 space-y-3 sm:space-y-4">
                  <SubscriptionInfo />
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
