'use client';

import React, { useState, useEffect } from 'react';
import { 
  getUserWorkspaces, 
  createWorkspace, 
  updateWorkspace, 
  setDefaultWorkspace, 
  deleteWorkspace,
  getDefaultWorkspace
} from '../services/supabaseService';
import type { Workspace } from '../types';

interface WorkspaceManagerProps {
  currentWorkspaceId: string | null;
  onWorkspaceChange: (workspaceId: string) => void;
  onWorkspaceCreated?: () => void;
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ 
  currentWorkspaceId, 
  onWorkspaceChange,
  onWorkspaceCreated 
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      const loadedWorkspaces = await getUserWorkspaces();
      setWorkspaces(loadedWorkspaces);
      
      // Se não há workspace selecionado, selecionar o padrão
      if (!currentWorkspaceId && loadedWorkspaces.length > 0) {
        const defaultWorkspace = loadedWorkspaces.find(w => w.is_default) || loadedWorkspaces[0];
        if (defaultWorkspace) {
          onWorkspaceChange(defaultWorkspace.id);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar workspaces:', err);
      setError(err.message || 'Erro ao carregar workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      setError('Nome do workspace não pode estar vazio');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      const newWorkspace = await createWorkspace(newWorkspaceName.trim());
      
      // Atualizar lista
      await loadWorkspaces();
      
      // Selecionar novo workspace
      onWorkspaceChange(newWorkspace.id);
      
      // Definir como padrão
      await setDefaultWorkspace(newWorkspace.id);
      
      // Fechar modal e limpar
      setShowCreateModal(false);
      setNewWorkspaceName('');
      
      if (onWorkspaceCreated) {
        onWorkspaceCreated();
      }
    } catch (err: any) {
      console.error('Erro ao criar workspace:', err);
      setError(err.message || 'Erro ao criar workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameWorkspace = async (workspaceId: string) => {
    if (!renameValue.trim()) {
      setError('Nome do workspace não pode estar vazio');
      return;
    }

    try {
      setError(null);
      await updateWorkspace(workspaceId, { name: renameValue.trim() });
      await loadWorkspaces();
      setIsRenaming(null);
      setRenameValue('');
    } catch (err: any) {
      console.error('Erro ao renomear workspace:', err);
      setError(err.message || 'Erro ao renomear workspace');
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este workspace? Os prompts dentro dele permanecerão, mas não estarão associados a um workspace.')) {
      return;
    }

    try {
      setError(null);
      await deleteWorkspace(workspaceId);
      
      // Se o workspace deletado era o atual, selecionar outro
      if (currentWorkspaceId === workspaceId) {
        const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
        if (remainingWorkspaces.length > 0) {
          const defaultWorkspace = remainingWorkspaces.find(w => w.is_default) || remainingWorkspaces[0];
          if (defaultWorkspace) {
            onWorkspaceChange(defaultWorkspace.id);
          }
        }
      }
      
      await loadWorkspaces();
    } catch (err: any) {
      console.error('Erro ao deletar workspace:', err);
      setError(err.message || 'Erro ao deletar workspace');
      alert(err.message || 'Erro ao deletar workspace');
    }
  };

  const handleSetDefault = async (workspaceId: string) => {
    try {
      setError(null);
      await setDefaultWorkspace(workspaceId);
      await loadWorkspaces();
    } catch (err: any) {
      console.error('Erro ao definir workspace como padrão:', err);
      setError(err.message || 'Erro ao definir workspace como padrão');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Workspaces</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Novo</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className={`p-3 rounded-lg border transition-all ${
              currentWorkspaceId === workspace.id
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            {isRenaming === workspace.id ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameWorkspace(workspace.id);
                    } else if (e.key === 'Escape') {
                      setIsRenaming(null);
                      setRenameValue('');
                    }
                  }}
                  className="flex-1 px-2 py-1 bg-black/50 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  onClick={() => handleRenameWorkspace(workspace.id)}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsRenaming(null);
                    setRenameValue('');
                  }}
                  className="p-1 text-white/40 hover:text-white/60"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <button
                      onClick={() => onWorkspaceChange(workspace.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white truncate">{workspace.name}</span>
                        {workspace.is_default && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            Padrão
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    {!workspace.is_default && (
                      <button
                        onClick={() => handleSetDefault(workspace.id)}
                        className="p-1 text-white/40 hover:text-emerald-400 transition-colors"
                        title="Definir como padrão"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setRenameValue(workspace.name);
                        setIsRenaming(workspace.id);
                      }}
                      className="p-1 text-white/40 hover:text-white/60 transition-colors"
                      title="Renomear"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {!workspace.is_default && (
                      <button
                        onClick={() => handleDeleteWorkspace(workspace.id)}
                        className="p-1 text-white/40 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {workspace.description && (
                  <p className="text-xs text-white/40 truncate">{workspace.description}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Criar Workspace */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-black/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Criar Novo Workspace</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">Nome do Workspace</label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateWorkspace();
                  } else if (e.key === 'Escape') {
                    setShowCreateModal(false);
                    setNewWorkspaceName('');
                  }
                }}
                placeholder="Ex: Projeto Cliente XYZ"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateWorkspace}
                disabled={isCreating || !newWorkspaceName.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold rounded-lg transition-colors"
              >
                {isCreating ? 'Criando...' : 'Criar'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceName('');
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

