'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCurrentProfile, updateProfile, changePassword, uploadAvatar } from '../services/supabaseService';
import { ensureAvatarsBucket } from '../services/bucketService';
import { validateName, validatePassword, sanitizeText } from '../utils/security';
import { 
  getUserApiKeys, 
  saveUserApiKey, 
  deleteUserApiKey, 
  validateGeminiApiKey, 
  validateOpenAIApiKey,
  type ApiProvider,
  type UserApiKey 
} from '../services/apiKeyService';

export const SettingsPage: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const loadedOnceRef = React.useRef(false);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({
    provider: 'gemini' as ApiProvider,
    apiKey: '',
    isGlobal: false,
  });

  useEffect(() => {
    // Evitar recarregamento desnecessário se já foi carregado
    if (loadedOnceRef.current) {
      return;
    }
    
    loadProfile().then(() => {
      loadedOnceRef.current = true;
    });
    loadApiKeys();
  }, []);
  
  const loadApiKeys = async () => {
    try {
      setIsLoadingApiKeys(true);
      const keys = await getUserApiKeys();
      setApiKeys(keys);
    } catch (error: any) {
      console.error('Erro ao carregar API Keys:', error);
      setError('Erro ao carregar API Keys');
    } finally {
      setIsLoadingApiKeys(false);
    }
  };
  
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKeyForm.apiKey.trim()) {
      setError('Por favor, insira uma API Key');
      return;
    }
    
    try {
      setIsSavingApiKey(true);
      setIsValidatingApiKey(true);
      setError(null);
      setSuccess(null);
      
      // Validar API Key antes de salvar
      let isValid = false;
      if (apiKeyForm.provider === 'gemini') {
        isValid = await validateGeminiApiKey(apiKeyForm.apiKey.trim());
      } else if (apiKeyForm.provider === 'openai') {
        isValid = await validateOpenAIApiKey(apiKeyForm.apiKey.trim());
      }
      
      if (!isValid) {
        setError(`API Key inválida para ${apiKeyForm.provider === 'gemini' ? 'Gemini' : 'OpenAI'}. Verifique se a chave está correta.`);
        setIsValidatingApiKey(false);
        setIsSavingApiKey(false);
        return;
      }
      
      setIsValidatingApiKey(false);
      
      // Salvar API Key
      await saveUserApiKey(apiKeyForm.provider, apiKeyForm.apiKey.trim(), apiKeyForm.isGlobal);
      
      setSuccess(`API Key do ${apiKeyForm.provider === 'gemini' ? 'Gemini' : 'OpenAI'} salva com sucesso!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Limpar formulário
      setApiKeyForm({
        provider: 'gemini',
        apiKey: '',
        isGlobal: false,
      });
      
      // Recarregar lista
      await loadApiKeys();
    } catch (error: any) {
      console.error('Erro ao salvar API Key:', error);
      setError(error.message || 'Erro ao salvar API Key');
    } finally {
      setIsSavingApiKey(false);
      setIsValidatingApiKey(false);
    }
  };
  
  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta API Key?')) {
      return;
    }
    
    try {
      await deleteUserApiKey(id);
      setSuccess('API Key removida com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      await loadApiKeys();
    } catch (error: any) {
      console.error('Erro ao deletar API Key:', error);
      setError(error.message || 'Erro ao remover API Key');
    }
  };

  const loadProfile = async () => {
    // Evitar recarregamento se já está carregando ou já carregou recentemente
    if (isLoading && loadedOnceRef.current) {
      return;
    }
    
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getCurrentProfile();
        
        // Atualizar formData com todos os dados de uma vez
        if (profile) {
          setFormData({
            fullName: profile.full_name || '',
            email: session.user.email || profile.email || '',
          });
          
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          } else {
            setAvatarPreview(null);
          }
        } else {
          // Se não houver perfil, pelo menos definir email
          setFormData({
            fullName: '',
            email: session.user.email || '',
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      setError('Erro ao carregar dados do perfil');
      // Mesmo com erro, manter dados atuais se houver
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && formData.email) {
        // Não sobrescrever se já temos dados
        console.log('⚠️ Mantendo dados atuais após erro');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas imagens');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB');
      return;
    }

    setAvatarFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    try {
      setIsUploadingAvatar(true);
      setError(null);
      setSuccess(null);
      
      const avatarUrl = await uploadAvatar(avatarFile);
      setAvatarPreview(avatarUrl);
      setAvatarFile(null); // Limpar arquivo após upload
      setSuccess('Avatar atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      await loadProfile(); // Recarregar perfil para atualizar
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      const errorMessage = error.message || 'Erro ao fazer upload do avatar';
      
      // Se o erro menciona bucket, tentar criar automaticamente
      if (errorMessage.includes('bucket') || errorMessage.includes('Bucket')) {
        try {
          console.log('⚠️ Tentando criar bucket automaticamente...');
          setError('Criando bucket automaticamente... Aguarde...');
          
          // Tentar criar o bucket
          const result = await ensureAvatarsBucket();
          
          if (result.success) {
            setError(null);
            setSuccess('Bucket verificado! Tentando fazer upload novamente...');
            
            // Tentar upload novamente após criar o bucket
            setTimeout(async () => {
              try {
                const retryUrl = await uploadAvatar(avatarFile!);
                setAvatarPreview(retryUrl);
                setAvatarFile(null);
                setSuccess('Avatar atualizado com sucesso!');
                setTimeout(() => setSuccess(null), 3000);
                await loadProfile();
              } catch (retryError: any) {
                setError(retryError.message || 'Erro ao fazer upload após criar bucket. Tente novamente.');
              } finally {
                setIsUploadingAvatar(false);
              }
            }, 2000);
            return;
          } else {
            setError(
              'Não foi possível criar o bucket automaticamente.\n\n' +
              result.message + '\n\n' +
              'Por favor, crie o bucket "avatars" manualmente no Supabase Storage:\n' +
              '1. Acesse https://app.supabase.com\n' +
              '2. Vá para Storage → Create bucket\n' +
              '3. Nome: avatars\n' +
              '4. Público: Sim\n' +
              '5. Clique em Create\n\n' +
              'Consulte INSTRUCOES_BUCKET_AVATARS.md para mais detalhes.'
            );
          }
        } catch (createError: any) {
          setError(
            errorMessage + 
            '\n\n📋 Não foi possível criar o bucket automaticamente. Por favor, crie manualmente seguindo as instruções em INSTRUCOES_BUCKET_AVATARS.md'
          );
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Validar e sanitizar nome
      const sanitizedName = sanitizeText(formData.fullName.trim());
      const nameValidation = validateName(sanitizedName);
      
      if (!nameValidation.valid) {
        setError(nameValidation.error || 'Nome inválido');
        setIsSaving(false);
        return;
      }

      // Se a validação passou, usar o nome sanitizado
      const nameToSave = sanitizedName || '';

      console.log('💾 Salvando nome:', nameToSave);

      const updatedProfile = await updateProfile({
        full_name: nameToSave,
      });

      console.log('✅ Perfil retornado após update:', updatedProfile);

      // Atualizar estado local imediatamente com o perfil retornado
      if (updatedProfile) {
        const savedName = updatedProfile.full_name || nameToSave;
        console.log('📝 Atualizando estado local com nome:', savedName);
        setFormData(prev => ({
          ...prev,
          fullName: savedName,
        }));
      } else {
        // Fallback: usar o nome sanitizado mesmo sem perfil retornado
        console.log('⚠️ Perfil não retornado, usando nome sanitizado:', nameToSave);
        setFormData(prev => ({
          ...prev,
          fullName: nameToSave,
        }));
      }

      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recarregar perfil completo após um pequeno delay para garantir sincronização
      setTimeout(async () => {
        await loadProfile();
      }, 500);
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      setError(error.message || 'Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsChangingPassword(true);
      setError(null);
      setSuccess(null);

      // Validar senhas
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('As senhas não coincidem');
        setIsChangingPassword(false);
        return;
      }

      const passwordValidation = validatePassword(passwordData.newPassword);
      if (!passwordValidation.valid) {
        setError(passwordValidation.errors.join(', ') || 'Senha inválida');
        setIsChangingPassword(false);
        return;
      }

      await changePassword(passwordData.currentPassword, passwordData.newPassword);

      setSuccess('Senha alterada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setError(error.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/10 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 border-r-emerald-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-white font-medium text-lg">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
              title="Voltar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
              <p className="text-white/60">Gerencie sua conta e preferências</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Foto de Perfil</h2>
            
            <div className="flex items-center space-x-6 mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-2xl shadow-lg shadow-amber-500/30 overflow-hidden border-2 border-white/20">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  formData.fullName?.charAt(0).toUpperCase() || formData.email?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              
              <div className="flex-1">
                <label className="block mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <span className="inline-block px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg cursor-pointer transition-colors border border-white/10">
                    Escolher Imagem
                  </span>
                </label>
                <p className="text-xs text-white/40 mt-2">PNG, JPG ou GIF (máx. 5MB)</p>
              </div>
            </div>

            {avatarFile && (
              <button
                onClick={handleUploadAvatar}
                disabled={isUploadingAvatar}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingAvatar ? 'Enviando...' : 'Salvar Avatar'}
              </button>
            )}
          </div>

          {/* Profile Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Informações do Perfil</h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-not-allowed"
                />
                <p className="text-xs text-white/40 mt-1">O email não pode ser alterado</p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>

          {/* Password Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Alterar Senha</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Digite a nova senha novamente"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
          </div>

          {/* API Keys Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">API Keys</h2>
            <p className="text-sm text-white/60 mb-6">
              Configure suas próprias API Keys para usar quando a API do sistema estiver indisponível ou quando você quiser usar sua própria chave.
            </p>
            
            {/* Formulário para adicionar API Key */}
            <form onSubmit={handleSaveApiKey} className="mb-6 space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <label htmlFor="api-provider-select" className="block text-sm font-medium text-white/80 mb-2">
                  Provedor
                </label>
                <select
                  id="api-provider-select"
                  value={apiKeyForm.provider}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, provider: e.target.value as ApiProvider })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  aria-label="Selecione o provedor de API"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKeyForm.apiKey}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, apiKey: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 font-mono text-sm"
                  placeholder={apiKeyForm.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                />
                <p className="text-xs text-white/40 mt-1">
                  {apiKeyForm.provider === 'gemini' 
                    ? 'Obtenha sua chave em: https://aistudio.google.com/app/apikey'
                    : 'Obtenha sua chave em: https://platform.openai.com/api-keys'
                  }
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isGlobal"
                  checked={apiKeyForm.isGlobal}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, isGlobal: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                />
                <label htmlFor="isGlobal" className="text-sm text-white/80">
                  Usar globalmente quando a API do sistema falhar
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingApiKey || isValidatingApiKey || !apiKeyForm.apiKey.trim()}
                className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidatingApiKey ? 'Validando...' : isSavingApiKey ? 'Salvando...' : 'Salvar API Key'}
              </button>
            </form>

            {/* Lista de API Keys */}
            {isLoadingApiKeys ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-white/10 rounded-full border-t-emerald-400 animate-spin"></div>
                <p className="text-white/60 mt-4">Carregando API Keys...</p>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <p>Nenhuma API Key configurada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm font-semibold">
                          {key.provider === 'gemini' ? 'Gemini' : 'OpenAI'}
                        </span>
                        {key.is_active && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            Ativa
                          </span>
                        )}
                        {key.is_global && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            Global
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 font-mono">
                        {key.api_key.substring(0, 10)}...{key.api_key.substring(key.api_key.length - 4)}
                      </p>
                      {key.usage_count > 0 && (
                        <p className="text-xs text-white/60 mt-1">
                          Usada {key.usage_count} vez(es) • {key.total_tokens_used.toLocaleString()} tokens
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

