import React, { useState, useEffect } from 'react';
import { getUserPrompts, getPrompt, deletePrompt } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';


interface Prompt {
  id: string;
  title: string | null;
  persona: string;
  objetivo: string;
  created_at: string;
  updated_at: string;
}

export const RepositoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptDetails, setPromptDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadedOnceRef = React.useRef(false);

  useEffect(() => {
    // Evitar recarregamento desnecessário se já foi carregado
    if (loadedOnceRef.current) {
      return;
    }
    
    loadPrompts().then(() => {
      loadedOnceRef.current = true;
    });
  }, []);

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const data = await getUserPrompts();
      setPrompts(data || []);
    } catch (error) {
      console.error('Erro ao carregar prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = async (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsLoadingDetails(true);
    try {
      const { promptData } = await getPrompt(prompt.id);
      setPromptDetails(promptData);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Tem certeza que deseja excluir este prompt?')) return;
    
    try {
      await deletePrompt(promptId);
      setPrompts(prompts.filter(p => p.id !== promptId));
      if (selectedPrompt?.id === promptId) {
        setSelectedPrompt(null);
        setPromptDetails(null);
      }
    } catch (error) {
      console.error('Erro ao excluir prompt:', error);
      alert('Erro ao excluir prompt');
    }
  };

  const handleUsePrompt = () => {
    if (selectedPrompt) {
      navigate('/dashboard', { 
        state: { promptId: selectedPrompt.id },
        replace: false 
      });
    }
  };

  const filteredPrompts = prompts.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.persona?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.objetivo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full overflow-auto bg-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
              title="Voltar para o Workspace"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Repositório de Prompts</h1>
              <p className="text-white/60">Gerencie e organize todos os seus prompts</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Prompts */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Meus Prompts</h2>
                <span className="text-sm text-white/40 bg-white/5 px-2 py-1 rounded">{filteredPrompts.length}</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredPrompts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/40">Nenhum prompt encontrado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleSelectPrompt(prompt)}
                      className={`
                        w-full text-left p-4 rounded-lg border transition-all duration-200
                        ${selectedPrompt?.id === prompt.id
                          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-white text-sm truncate flex-1">
                          {prompt.title || 'Sem título'}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt.id);
                          }}
                          className="ml-2 p-1 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-2 mb-2">
                        {prompt.persona || prompt.objetivo}
                      </p>
                      <p className="text-xs text-white/30">
                        {new Date(prompt.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalhes do Prompt */}
          <div className="lg:col-span-2">
            {selectedPrompt ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedPrompt.title || 'Sem título'}
                    </h2>
                    <p className="text-sm text-white/40">
                      Criado em {new Date(selectedPrompt.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={handleUsePrompt}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors"
                  >
                    Usar Prompt
                  </button>
                </div>

                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                  </div>
                ) : promptDetails ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Persona</h3>
                      <p className="text-white/80 bg-white/5 p-4 rounded-lg border border-white/10">
                        {promptDetails.persona}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Objetivo</h3>
                      <p className="text-white/80 bg-white/5 p-4 rounded-lg border border-white/10">
                        {promptDetails.objetivo}
                      </p>
                    </div>

                    {promptDetails.contextoNegocio && (
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Contexto do Negócio</h3>
                        <p className="text-white/80 bg-white/5 p-4 rounded-lg border border-white/10">
                          {promptDetails.contextoNegocio}
                        </p>
                      </div>
                    )}

                    {promptDetails.contexto && (
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Contexto</h3>
                        <p className="text-white/80 bg-white/5 p-4 rounded-lg border border-white/10">
                          {promptDetails.contexto}
                        </p>
                      </div>
                    )}

                    {promptDetails.regras && promptDetails.regras.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Regras</h3>
                        <ul className="space-y-2">
                          {promptDetails.regras.map((regra: string, index: number) => (
                            <li key={index} className="text-white/80 bg-white/5 p-3 rounded-lg border border-white/10 flex items-start">
                              <span className="text-emerald-400 mr-2">•</span>
                              <span>{regra}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p className="text-white/60">Selecione um prompt para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

