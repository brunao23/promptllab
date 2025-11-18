import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentProfile, supabase, updateProfile, changePassword, uploadAvatar } from '../services/supabaseService';
import { ensureAvatarsBucket } from '../services/bucketService';
import { validateName, validatePassword, sanitizeText } from '../utils/security';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    // Evitar recarregamento desnecessário se já foi carregado
    if (loadedOnceRef.current) {
      return;
    }
    
    loadProfile().then(() => {
      loadedOnceRef.current = true;
    });
  }, []);

  const loadProfile = async () => {
    // Evitar recarregamento se já está carregando ou já carregou recentemente
    if (isLoading && loadedOnceRef.current) {
      return;
    }
    
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setFormData({
          fullName: '',
          email: session.user.email || '',
        });
        
        const profile = await getCurrentProfile();
        if (profile) {
          setFormData(prev => ({
            ...prev,
            fullName: profile.full_name || '',
          }));
          
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      setError('Erro ao carregar dados do perfil');
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

      // Validar nome
      const nameValidation = validateName(sanitizeText(formData.fullName.trim()));
      if (!nameValidation.valid) {
        setError(nameValidation.error || 'Nome inválido');
        setIsSaving(false);
        return;
      }

      const updatedProfile = await updateProfile({
        full_name: nameValidation.sanitized || '',
      });

      // Atualizar estado local imediatamente com o perfil retornado
      if (updatedProfile) {
        setFormData(prev => ({
          ...prev,
          fullName: updatedProfile.full_name || nameValidation.sanitized || '',
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
        setError(passwordValidation.error || 'Senha inválida');
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
              onClick={() => navigate('/dashboard')}
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
        </div>
      </div>
    </div>
  );
};

