import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-4 py-6 lg:px-8">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">LaBPrompT</h1>
                <p className="text-xs text-emerald-400/80">Laboratório de Engenharia de Prompt</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/30"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Engenharia de Prompt
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                Avançada
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-6 leading-relaxed">
              Crie, teste, otimize e gerencie prompts de IA de forma profissional e eficiente.
              Transforme suas ideias em prompts poderosos com nossa plataforma completa.
            </p>
            {/* Badge Trial - Muito Destacado */}
            <div className="mb-8 inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-2xl shadow-emerald-500/50 transform hover:scale-105 transition-all">
              <svg className="w-6 h-6 text-black mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <div className="text-left">
                <div className="text-black font-black text-xl leading-tight">🎉 7 DIAS GRÁTIS</div>
                <div className="text-black/80 font-semibold text-sm">Sem cartão de crédito • Cancele quando quiser</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xl rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-emerald-500/50 border-2 border-emerald-400"
              >
                🚀 Começar Gratuitamente Agora
              </Link>
              <Link
                to="/login"
                className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-bold text-lg rounded-xl transition-all border-2 border-white/20 hover:border-white/40"
              >
                Já Tenho Conta
              </Link>
            </div>
            <p className="text-white/60 text-sm mt-4">
              ✅ 100% Grátis nos primeiros 7 dias • ✅ Sem necessidade de cartão • ✅ Cancele a qualquer momento
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher o LaBPrompT?
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Uma ferramenta completa para engenharia de prompts profissional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Criação Intuitiva</h3>
              <p className="text-white/60">
                Interface moderna e fácil de usar para criar prompts profissionais com todos os elementos necessários.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Teste em Tempo Real</h3>
              <p className="text-white/60">
                Teste seus prompts diretamente na interface com chat interativo e validação instantânea.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Otimização Inteligente</h3>
              <p className="text-white/60">
                Melhore seus prompts baseado em feedback real e correções automáticas.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Versionamento</h3>
              <p className="text-white/60">
                Mantenha histórico completo de todas as versões dos seus prompts com comparação fácil.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Análise de Documentos</h3>
              <p className="text-white/60">
                Extraia informações automaticamente de documentos PDF, TXT, MD e outros formatos.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Assistente por Voz</h3>
              <p className="text-white/60">
                Preencha formulários usando comandos de voz com transcrição automática.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para criar prompts profissionais?
            </h2>
            <p className="text-xl text-white/60 mb-4">
              Junte-se a milhares de desenvolvedores que já estão usando o LaBPrompT
            </p>
            {/* Badge Trial CTA Section - Muito Destacado */}
            <div className="mb-8 inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-2xl shadow-emerald-500/50">
              <svg className="w-6 h-6 text-black mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <div className="text-left">
                <div className="text-black font-black text-xl leading-tight">🎉 TESTE 7 DIAS GRÁTIS</div>
                <div className="text-black/80 font-bold text-sm">Sem cartão de crédito • Sem compromisso</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xl rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-emerald-500/50 border-2 border-emerald-400"
              >
                🚀 Criar Conta Gratuita Agora
              </Link>
              <Link
                to="/login"
                className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-bold text-lg rounded-xl transition-all border-2 border-white/20 hover:border-white/40"
              >
                Fazer Login
              </Link>
            </div>
            <p className="text-white/60 text-sm mt-4">
              ✅ Comece agora • ✅ Teste por 7 dias sem pagar nada • ✅ Cancele quando quiser
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center text-white/60">
            <p>© 2024 LaBPrompT - Laboratório de Engenharia de Prompt</p>
            <p className="text-sm mt-2">Feito com ❤️ usando React + TypeScript + Vite</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

