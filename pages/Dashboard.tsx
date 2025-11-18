import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { PromptManager } from '../components/PromptManager';
import { RepositoryPage } from './RepositoryPage';
import { SettingsPage } from './SettingsPage';

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
    <div className="flex h-screen w-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-black/80 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between z-30">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">LaBPrompT</span>
            </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<PromptManager />} />
            <Route path="/repository" element={<RepositoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
