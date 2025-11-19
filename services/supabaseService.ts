// Serviço para integração com Supabase
// Instale o cliente: npm install @supabase/supabase-js

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PromptData, PromptVersion, ChatMessage, FewShotExample, VariavelDinamica, Ferramenta, Fluxo, OptimizationPair, Workspace } from '../types';
import { 
  sanitizeText, 
  validatePromptText, 
  isValidUUID, 
  sanitizeObject,
  validateFileSize,
  validateFileType,
} from '../utils/security';

// Configuração do Supabase
// No Vite, use VITE_ prefixo para variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validação mais rigorosa das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ ERRO: Variáveis de ambiente do Supabase não configuradas!\n' +
    '⚠️ IMPORTANTE: Este projeto usa VITE (não Next.js), então você DEVE usar:\n' +
    '   - VITE_SUPABASE_URL (NÃO NEXT_PUBLIC_SUPABASE_URL!)\n' +
    '   - VITE_SUPABASE_ANON_KEY (NÃO NEXT_PUBLIC_SUPABASE_ANON_KEY!)\n' +
    'Configure na Vercel: Settings → Environment Variables\n' +
    `URL atual: ${supabaseUrl || 'VAZIO'}\n` +
    `Key atual: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'VAZIO'}\n` +
    '📖 Consulte: URGENTE_CORRIGIR_VARIAVEIS_VERCEL.md';
  
  console.error(errorMsg);
  
  // Em produção, não queremos quebrar a aplicação completamente
  // Mas vamos criar um cliente com valores vazios para que os erros apareçam claramente
  if (import.meta.env.PROD) {
    console.error('⚠️ Aplicação em produção sem configuração do Supabase!');
    console.error('⚠️ Verifique se as variáveis estão com prefixo VITE_ na Vercel!');
  }
}

// Criar cliente Supabase
// Mesmo sem variáveis válidas, criamos o cliente para que os erros sejam claros nas chamadas
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

// Verificar se as credenciais são válidas ao inicializar
if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase configurado:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
} else {
  console.warn('⚠️ Supabase não configurado corretamente. A autenticação pode falhar.');
}

// =====================================================
// AUTENTICAÇÃO
// =====================================================

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Registra um novo usuário
 */
export async function signUp(data: SignUpData) {
  // SEMPRE usar a URL de produção para o email de confirmação
  // Isso garante que o link do email sempre funcione, mesmo se o usuário
  // estiver testando em localhost ou em preview da Vercel
  const productionUrl = 'https://labprompt.com.br';
  const redirectTo = `${productionUrl}/auth/callback`;
  
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name || '',
        },
        // SEMPRE usar produção para email de confirmação
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error('❌ Erro ao registrar usuário:', error);
      throw error;
    }

    // Log de sucesso (sem informações sensíveis)
    if (authData?.user) {
      console.log('✅ Usuário registrado com sucesso:', {
        email: authData.user.email,
        id: authData.user.id,
        confirmed: !!authData.user.confirmed_at,
      });
    }

    return { data: authData, error: null };
  } catch (err: any) {
    console.error('❌ Erro ao registrar usuário:', err);
    return { data: null, error: err };
  }
}

/**
 * Faz login de um usuário existente
 * 🔒 SEGURANÇA: Verifica se o email foi confirmado antes de permitir login
 */
export async function signIn(data: SignInData) {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Não fazer console.error aqui para evitar poluir o console
      // O componente que chama deve tratar e exibir o erro
      throw error;
    }

    // 🔒 VALIDAÇÃO CRÍTICA: Verificar se o email foi confirmado
    if (authData?.user) {
      if (!authData.user.email_confirmed_at && !authData.user.confirmed_at) {
        // Fazer logout imediatamente para não deixar sessão ativa
        await supabase.auth.signOut();
        
        console.warn('⚠️ Tentativa de login com email não confirmado:', {
          email: authData.user.email,
          id: authData.user.id,
        });

        const emailNotConfirmedError = new Error('Email not confirmed');
        (emailNotConfirmedError as any).status = 401;
        throw emailNotConfirmedError;
      }

      console.log('✅ Login bem-sucedido:', {
        email: authData.user.email,
        id: authData.user.id,
        confirmed: true,
      });
    }

    return { data: authData, error: null };
  } catch (err: any) {
    // Apenas retornar erro, não fazer console.error aqui
    // O componente que chama deve tratar o erro
    return { data: null, error: err };
  }
}

/**
 * Reenvia email de confirmação
 */
export async function resendConfirmationEmail(email: string) {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: 'https://labprompt.com.br/auth/callback',
      },
    });

    if (error) {
      console.error('❌ Erro ao reenviar email de confirmação:', error);
      throw error;
    }

    console.log('✅ Email de confirmação reenviado com sucesso');
    return { data, error: null };
  } catch (err: any) {
    console.error('❌ Erro ao reenviar email de confirmação:', err);
    return { data: null, error: err };
  }
}

/**
 * Faz logout do usuário atual
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obtém o usuário atual
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Obtém o perfil do usuário atual
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // Se o perfil não existe (código PGRST116), retornar null em vez de lançar erro
    if (error.code === 'PGRST116') {
      console.log('⚠️ [getCurrentProfile] Perfil não encontrado para user_id:', user.id);
      return null;
    }
    console.error('❌ [getCurrentProfile] Erro ao buscar perfil:', error);
    throw error;
  }

  console.log('✅ [getCurrentProfile] Perfil encontrado:', { id: data?.id, full_name: data?.full_name });
  return data;
}

/**
 * Atualiza o perfil do usuário atual
 */
export async function updateProfile(updates: { full_name?: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  console.log('💾 [updateProfile] Atualizando perfil:', updates);

  // 🔒 VALIDAÇÃO DE SEGURANÇA - sanitizar dados
  const sanitizedUpdates: { full_name?: string } = {};
  if (updates.full_name !== undefined) {
    const sanitized = sanitizeText(updates.full_name.trim());
    if (sanitized.length > 0) {
      sanitizedUpdates.full_name = sanitized;
    } else {
      // Se o nome foi apagado completamente, definir como string vazia
      sanitizedUpdates.full_name = '';
    }
  }

  console.log('💾 [updateProfile] Updates sanitizados:', sanitizedUpdates);

  // Primeiro, buscar o perfil atual para garantir que existe
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ [updateProfile] Erro ao verificar perfil:', checkError);
    throw checkError;
  }

  // Se o perfil não existe, criar um novo
  if (!existingProfile) {
    console.log('⚠️ [updateProfile] Perfil não encontrado, criando novo perfil...');
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData?.session?.user?.email || '';
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: email,
        full_name: sanitizedUpdates.full_name || '',
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [updateProfile] Erro ao criar perfil:', createError);
      throw createError;
    }

    console.log('✅ [updateProfile] Perfil criado com sucesso');
    return newProfile;
  }

  // Atualizar perfil existente
  const { data, error } = await supabase
    .from('profiles')
    .update(sanitizedUpdates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('❌ [updateProfile] Erro ao atualizar perfil:', error);
    throw error;
  }

  console.log('✅ [updateProfile] Perfil atualizado com sucesso:', data);
  return data;
}

/**
 * Altera a senha do usuário atual
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  console.log('🔐 [changePassword] Alterando senha...');

  // Primeiro, verificar a senha atual fazendo login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (authError || !authData.user) {
    throw new Error('Senha atual incorreta');
  }

  // Se a senha atual está correta, atualizar para a nova senha
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error('❌ [changePassword] Erro ao atualizar senha:', updateError);
    throw updateError;
  }

  console.log('✅ [changePassword] Senha alterada com sucesso');
}

/**
 * Faz upload de avatar para Supabase Storage
 * @updated 2024-11-18 - Cache busting para Vercel
 */
export async function uploadAvatar(file: File): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  console.log('📤 [uploadAvatar] Fazendo upload do avatar...');

  // Validar tipo de arquivo
  if (!file.type.startsWith('image/')) {
    throw new Error('Apenas imagens são permitidas');
  }

  // Validar tamanho (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 5MB');
  }

  // Criar nome único para o arquivo
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Fazer upload para Supabase Storage
  // Tentar fazer upload - se o bucket não existir, criar automaticamente
  let { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Permitir sobrescrever se já existir
    });

  // Se o bucket não existir, dar mensagem clara ao usuário
  if (error && (error.message.includes('Bucket not found') || error.message.includes('not found') || error.message.includes('does not exist'))) {
    console.error('❌ [uploadAvatar] Bucket "avatars" não encontrado no Supabase Storage');
    throw new Error(
      'O bucket de armazenamento não foi configurado.\n\n' +
      'Por favor, crie o bucket "avatars" no Supabase Storage:\n' +
      '1. Acesse o Dashboard do Supabase\n' +
      '2. Vá para Storage → Create bucket\n' +
      '3. Nome: avatars\n' +
      '4. Público: Sim\n' +
      '5. Clique em Create\n\n' +
      'Após criar o bucket, tente novamente. Consulte o arquivo CRIAR_BUCKET_AVATARS.md para mais detalhes.'
    );
  } else if (error) {
    console.error('❌ [uploadAvatar] Erro ao fazer upload:', error);
    
    // Mensagens de erro mais específicas
    if (error.message.includes('File size exceeds') || error.message.includes('size')) {
      throw new Error('O arquivo é muito grande. O tamanho máximo permitido é 5MB.');
    } else if (error.message.includes('Invalid file type') || error.message.includes('file type')) {
      throw new Error('Tipo de arquivo inválido. Apenas imagens (PNG, JPG, GIF, WEBP) são permitidas.');
    } else if (error.message.includes('Unauthorized') || error.message.includes('permission') || error.message.includes('403')) {
      throw new Error('Erro de permissão. Verifique se o bucket "avatars" está configurado como público no Supabase Storage.');
    } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
      // Tentar novamente com nome diferente se o arquivo já existe
      const newFileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const newFilePath = `avatars/${newFileName}`;
      
      const retryResult = await supabase.storage
        .from('avatars')
        .upload(newFilePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (retryResult.error) {
        throw new Error(retryResult.error.message || 'Erro ao fazer upload da imagem. Tente novamente.');
      }
      
      // Usar o novo filePath para obter a URL pública
      const { data: { publicUrl: retryUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(newFilePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: retryUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ [uploadAvatar] Erro ao atualizar perfil:', updateError);
      }

      console.log('✅ [uploadAvatar] Avatar enviado com sucesso (retry):', retryUrl);
      return retryUrl;
    }
    
    throw new Error(error.message || 'Erro ao fazer upload da imagem. Tente novamente ou contate o suporte.');
  }

  // Obter URL pública da imagem
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Atualizar URL do avatar no perfil
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ [uploadAvatar] Erro ao atualizar perfil:', updateError);
    // Não jogar erro aqui, o upload foi bem-sucedido
  }

  console.log('✅ [uploadAvatar] Avatar enviado com sucesso:', publicUrl);
  return publicUrl;
}

// =====================================================
// PROMPTS
// =====================================================

/**
 * Cria um novo prompt
 */
export async function createPrompt(promptData: PromptData, title?: string, workspaceId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Se não fornecido, usar workspace padrão
  if (!workspaceId) {
    const defaultWorkspace = await getDefaultWorkspace();
    if (defaultWorkspace) {
      workspaceId = defaultWorkspace.id;
    }
  }

  // 🔒 VALIDAÇÃO E SANITIZAÇÃO DE DADOS
  const maxTitleLength = 200;
  const sanitizedTitle = title 
    ? sanitizeText(title.trim(), maxTitleLength) 
    : sanitizeText(promptData.persona.substring(0, 50), maxTitleLength);

  // Validar e sanitizar campos de texto
  const personaValidation = validatePromptText(promptData.persona, 10000);
  if (!personaValidation.valid) {
    throw new Error(personaValidation.error || 'Persona inválida');
  }

  const objetivoValidation = validatePromptText(promptData.objetivo, 5000);
  if (!objetivoValidation.valid) {
    throw new Error(objetivoValidation.error || 'Objetivo inválido');
  }

  const contextoNegocioValidation = validatePromptText(promptData.contextoNegocio || '', 10000);
  const contextoValidation = validatePromptText(promptData.contexto || '', 10000);

  // Sanitizar regras
  const sanitizedRegras = promptData.regras
    .map(regra => sanitizeText(regra.trim(), 1000))
    .filter(regra => regra.length > 0);

  // Validar formato de saída
  const validOutputFormats = ['text', 'markdown', 'json', 'xml', 'yaml'];
  const validMasterFormats = ['markdown', 'json'];
  
  if (!validOutputFormats.includes(promptData.formatoSaida)) {
    throw new Error('Formato de saída inválido');
  }

  if (!validMasterFormats.includes(promptData.masterPromptFormat)) {
    throw new Error('Formato do prompt mestre inválido');
  }

  // Validar tamanho do prompt
  if (promptData.promptSize < 500 || promptData.promptSize > 100000) {
    throw new Error('Tamanho do prompt deve estar entre 500 e 100000 caracteres');
  }

  // Primeiro, verificar se existe profile para este usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ [createPrompt] Erro ao verificar profile:', profileError);
    throw profileError;
  }

  if (!profile) {
    console.error('❌ [createPrompt] Profile não encontrado para user_id:', user.id);
    throw new Error('Perfil do usuário não encontrado. Por favor, faça logout e login novamente.');
  }

  console.log('✅ [createPrompt] Profile encontrado:', profile.id);

  console.log('💾 [createPrompt] Tentando salvar prompt no banco...', {
    user_id: profile.id, // Usar profile.id
    title: sanitizedTitle.substring(0, 50),
    hasPersona: !!personaValidation.sanitized,
    hasObjetivo: !!objetivoValidation.sanitized,
  });

  const { data, error } = await supabase
    .from('prompts')
    .insert({
      user_id: profile.id, // CRÍTICO: usar profile.id, não user.id diretamente
      workspace_id: workspaceId || null, // Adicionar workspace_id
      title: sanitizedTitle,
      persona: personaValidation.sanitized || '',
      objetivo: objetivoValidation.sanitized || '',
      contexto_negocio: contextoNegocioValidation.sanitized || '',
      contexto: contextoValidation.sanitized || '',
      regras: sanitizedRegras,
      formato_saida: promptData.formatoSaida,
      master_prompt_format: promptData.masterPromptFormat,
      estrutura_saida: sanitizeText(promptData.estruturaSaida || '', 5000),
      prompt_size: promptData.promptSize,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ ERRO ao salvar prompt no banco:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  console.log('✅ Prompt salvo com sucesso no banco:', data.id);

  // Criar relacionamentos (exemplos, variáveis, ferramentas, fluxos)
  const promptId = data.id;

  // Few-shot examples
  if (promptData.exemplos.length > 0) {
    const { error: examplesError } = await supabase.from('few_shot_examples').insert(
      promptData.exemplos.map((ex, index) => ({
        prompt_id: promptId,
        user_text: ex.user,
        agent_text: ex.agent,
        order_index: index,
      }))
    );
    if (examplesError) {
      console.error('❌ Erro ao salvar exemplos:', examplesError);
      throw examplesError;
    }
    console.log('✅ Exemplos salvos:', promptData.exemplos.length);
  }

  // Variáveis dinâmicas
  if (promptData.variaveisDinamicas.length > 0) {
    const { error: variaveisError } = await supabase.from('variaveis_dinamicas').insert(
      promptData.variaveisDinamicas.map((v, index) => ({
        prompt_id: promptId,
        chave: v.chave,
        valor: v.valor,
        order_index: index,
      }))
    );
    if (variaveisError) {
      console.error('❌ Erro ao salvar variáveis:', variaveisError);
      throw variaveisError;
    }
    console.log('✅ Variáveis salvas:', promptData.variaveisDinamicas.length);
  }

  // Ferramentas
  if (promptData.ferramentas.length > 0) {
    const { error: ferramentasError } = await supabase.from('ferramentas').insert(
      promptData.ferramentas.map((f, index) => ({
        prompt_id: promptId,
        nome: f.nome,
        descricao: f.descricao,
        order_index: index,
      }))
    );
    if (ferramentasError) {
      console.error('❌ Erro ao salvar ferramentas:', ferramentasError);
      throw ferramentasError;
    }
    console.log('✅ Ferramentas salvas:', promptData.ferramentas.length);
  }

  // Fluxos
  if (promptData.fluxos.length > 0) {
    const { error: fluxosError } = await supabase.from('fluxos').insert(
      promptData.fluxos.map((f, index) => ({
        prompt_id: promptId,
        nome: f.nome,
        tipo_prompt: f.tipoPrompt,
        objetivo: f.objetivo,
        base_conhecimento_rag: f.baseConhecimentoRAG,
        few_shot_examples: f.fewShotExamples,
        reforcar_cot: f.reforcarCoT,
        ativar_guardrails: f.ativarGuardrails,
        order_index: index,
      }))
    );
    if (fluxosError) {
      console.error('❌ Erro ao salvar fluxos:', fluxosError);
      throw fluxosError;
    }
    console.log('✅ Fluxos salvos:', promptData.fluxos.length);
  }

  return data;
}

/**
 * Obtém todos os prompts do usuário atual, opcionalmente filtrando por workspace
 */
export async function getUserPrompts(workspaceId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  console.log('🔍 [getUserPrompts] Buscando prompts para user_id:', user.id);

  // Primeiro, verificar se existe profile para este usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ [getUserPrompts] Erro ao verificar profile:', profileError);
    throw profileError;
  }

  if (!profile) {
    console.error('❌ [getUserPrompts] Profile não encontrado para user_id:', user.id);
    throw new Error('Perfil do usuário não encontrado');
  }

  console.log('✅ [getUserPrompts] Profile encontrado:', profile.id);

  // Agora buscar prompts usando o profile.id como user_id, opcionalmente filtrando por workspace
  let query = supabase
    .from('prompts')
    .select('*')
    .eq('user_id', profile.id); // CRÍTICO: usar profile.id, não user.id diretamente

  // Se workspace_id fornecido, filtrar por workspace
  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [getUserPrompts] Erro ao buscar prompts:', error);
    throw error;
  }

  // Filtrar por is_active manualmente (pode ser NULL ou false)
  const activePrompts = (data || []).filter(p => p.is_active !== false);
  
  console.log('✅ [getUserPrompts] Prompts encontrados:', {
    total: data?.length || 0,
    ativos: activePrompts.length,
    inativos: (data || []).length - activePrompts.length,
  });

  if (activePrompts.length > 0) {
    activePrompts.forEach((p, idx) => {
      console.log(`  [${idx}] ID: ${p.id}, Título: ${p.title || 'Sem título'}, Criado: ${p.created_at}`);
    });
  }

  return activePrompts;
}

/**
 * Deleta um prompt (soft delete - marca como inativo)
 */
export async function deletePrompt(promptId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptId)) {
    throw new Error('ID de prompt inválido');
  }

  console.log('🗑️ [deletePrompt] Deletando prompt:', promptId);

  // Primeiro, verificar se existe profile para este usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ [deletePrompt] Erro ao verificar profile:', profileError);
    throw profileError;
  }

  if (!profile) {
    throw new Error('Perfil do usuário não encontrado');
  }

  // Soft delete - marcar como inativo
  const { error } = await supabase
    .from('prompts')
    .update({ is_active: false })
    .eq('id', promptId)
    .eq('user_id', profile.id);

  if (error) {
    console.error('❌ [deletePrompt] Erro ao deletar prompt:', error);
    throw error;
  }

  console.log('✅ [deletePrompt] Prompt deletado com sucesso');
}

/**
 * Obtém um prompt específico com todos os relacionamentos
 */
export async function getPrompt(promptId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptId)) {
    throw new Error('ID de prompt inválido');
  }

  console.log('🔍 [getPrompt] Buscando prompt:', promptId, 'para user_id:', user.id);

  // Primeiro, verificar se existe profile para este usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ [getPrompt] Erro ao verificar profile:', profileError);
    throw profileError;
  }

  if (!profile) {
    console.error('❌ [getPrompt] Profile não encontrado para user_id:', user.id);
    throw new Error('Perfil do usuário não encontrado');
  }

  console.log('✅ [getPrompt] Profile encontrado:', profile.id);

  // Buscar prompt usando profile.id como user_id
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .eq('user_id', profile.id) // CRÍTICO: usar profile.id, não user.id diretamente
    .single();

  if (promptError) throw promptError;
  if (!prompt) throw new Error('Prompt não encontrado');

  // Buscar relacionamentos
  const [examples, variaveis, ferramentas, fluxos] = await Promise.all([
    supabase.from('few_shot_examples').select('*').eq('prompt_id', promptId).order('order_index'),
    supabase.from('variaveis_dinamicas').select('*').eq('prompt_id', promptId).order('order_index'),
    supabase.from('ferramentas').select('*').eq('prompt_id', promptId).order('order_index'),
    supabase.from('fluxos').select('*').eq('prompt_id', promptId).order('order_index'),
  ]);

  // Montar PromptData
  const promptData: PromptData = {
    persona: prompt.persona,
    objetivo: prompt.objetivo,
    contextoNegocio: prompt.contexto_negocio || '',
    contexto: prompt.contexto || '',
    regras: prompt.regras || [],
    exemplos: (examples.data || []).map(ex => ({
      id: ex.id,
      user: ex.user_text,
      agent: ex.agent_text,
    })),
    variaveisDinamicas: (variaveis.data || []).map(v => ({
      id: v.id,
      chave: v.chave,
      valor: v.valor,
    })),
    ferramentas: (ferramentas.data || []).map(f => ({
      id: f.id,
      nome: f.nome,
      descricao: f.descricao,
    })),
    formatoSaida: prompt.formato_saida as any,
    masterPromptFormat: prompt.master_prompt_format as 'markdown' | 'json',
    estruturaSaida: prompt.estrutura_saida || '',
    fluxos: (fluxos.data || []).map(f => ({
      id: f.id,
      nome: f.nome,
      tipoPrompt: f.tipo_prompt || '',
      objetivo: f.objetivo || '',
      baseConhecimentoRAG: f.base_conhecimento_rag || '',
      fewShotExamples: f.few_shot_examples || '',
      reforcarCoT: f.reforcar_cot || false,
      ativarGuardrails: f.ativar_guardrails || false,
    })),
    promptSize: prompt.prompt_size || 5000,
  };

  return { prompt, promptData };
}

// =====================================================
// VERSÕES DE PROMPTS
// =====================================================

/**
 * Cria uma nova versão de um prompt
 */
export async function createPromptVersion(
  promptId: string,
  versionData: {
    content: string;
    format: string;
    masterFormat: string;
    sourceData: PromptData;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptId)) {
    throw new Error('ID de prompt inválido');
  }

  // 🔒 VALIDAÇÃO E SANITIZAÇÃO - Conteúdo da versão
  const contentValidation = validatePromptText(versionData.content, 100000);
  if (!contentValidation.valid) {
    throw new Error(contentValidation.error || 'Conteúdo da versão inválido');
  }

  // Obter o número da próxima versão
  const { data: lastVersion } = await supabase
    .from('prompt_versions')
    .select('version_number')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1;

  console.log('💾 Tentando salvar versão no banco...', {
    prompt_id: promptId,
    version_number: nextVersionNumber,
    content_length: contentValidation.sanitized?.length || 0,
  });

  const { data, error } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: promptId,
      version_number: nextVersionNumber,
      content: contentValidation.sanitized || '',
      format: versionData.format,
      master_format: versionData.masterFormat,
      source_data: sanitizeObject(versionData.sourceData as any) as any,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ ERRO ao salvar versão no banco:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  console.log('✅ Versão salva com sucesso no banco:', data.id);

  // Converter para formato PromptVersion
  const promptVersion: PromptVersion = {
    id: data.id,
    version: data.version_number,
    content: data.content,
    format: data.format as any,
    masterFormat: data.master_format as 'markdown' | 'json',
    timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
    sourceData: data.source_data as PromptData,
  };

  return promptVersion;
}

/**
 * Obtém todas as versões de um prompt
 */
export async function getPromptVersions(promptId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptId)) {
    throw new Error('ID de prompt inválido');
  }

  console.log('🔍 [getPromptVersions] Buscando versões no banco para prompt_id:', promptId, 'user_id:', user.id);
  
  // Primeiro, verificar se existe profile para este usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ [getPromptVersions] Erro ao verificar profile:', profileError);
    throw profileError;
  }

  if (!profile) {
    console.error('❌ [getPromptVersions] Profile não encontrado para user_id:', user.id);
    throw new Error('Perfil do usuário não encontrado');
  }

  console.log('✅ [getPromptVersions] Profile encontrado:', profile.id);
  
  // Verificar se o prompt pertence ao usuário usando profile.id
  const { data: promptCheck, error: promptCheckError } = await supabase
    .from('prompts')
    .select('id')
    .eq('id', promptId)
    .eq('user_id', profile.id) // CRÍTICO: usar profile.id
    .single();

  if (promptCheckError) {
    console.error('❌ Erro ao verificar prompt:', promptCheckError);
    throw promptCheckError;
  }

  if (!promptCheck) {
    console.error('❌ Prompt não encontrado ou não pertence ao usuário');
    throw new Error('Prompt não encontrado ou você não tem permissão para acessá-lo');
  }

  // Agora buscar as versões
  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar versões:', error);
    throw error;
  }

  console.log('✅ Versões encontradas no banco:', data?.length || 0);

  if (!data || data.length === 0) {
    console.log('ℹ️ Nenhuma versão encontrada para este prompt');
    return [];
  }

  // Converter e validar cada versão
  const versions = (data || []).map((v: any) => {
    const version: PromptVersion = {
      id: v.id,
      version: v.version_number,
      content: v.content || '',
      format: v.format || 'markdown',
      masterFormat: (v.master_format || 'markdown') as 'markdown' | 'json',
      timestamp: v.created_at ? new Date(v.created_at).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
      sourceData: (v.source_data || {}) as PromptData,
    };
    
    console.log(`  ✓ Versão ${version.version} (ID: ${version.id}) - Conteúdo: ${version.content?.length || 0} chars`);
    
    return version;
  });

  console.log('✅ Versões convertidas com sucesso:', versions.length);
  return versions;
}

/**
 * Obtém uma versão específica do prompt por ID (público - para compartilhamento)
 */
export async function getPromptVersion(versionId: string): Promise<PromptVersion> {
  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(versionId)) {
    throw new Error('ID de versão inválido');
  }

  console.log('🔍 [getPromptVersion] Buscando versão pública:', versionId);

  // Buscar versão (sem autenticação necessária para compartilhamento público)
  const { data: version, error: versionError } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (versionError) {
    console.error('❌ [getPromptVersion] Erro ao buscar versão:', versionError);
    throw versionError;
  }

  if (!version) {
    throw new Error('Versão não encontrada');
  }

  // Buscar prompt relacionado para obter dados completos
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', version.prompt_id)
    .single();

  let promptData: PromptData;
  
  if (promptError || !prompt) {
    console.warn('⚠️ [getPromptVersion] Erro ao buscar prompt relacionado, usando dados mínimos:', promptError);
    // Usar dados mínimos se não encontrar o prompt
    promptData = {
      persona: '',
      objetivo: '',
      contextoNegocio: '',
      contexto: '',
      regras: [],
      exemplos: [],
      variaveisDinamicas: [],
      ferramentas: [],
      formatoSaida: 'text',
      masterPromptFormat: 'markdown',
      estruturaSaida: '',
      fluxos: [],
      promptSize: 5000,
    };
  } else {
    // Buscar relacionamentos do prompt se disponível
    const [examples, variaveis, ferramentas, fluxos] = await Promise.all([
      supabase.from('few_shot_examples').select('*').eq('prompt_id', prompt.id).order('order_index'),
      supabase.from('variaveis_dinamicas').select('*').eq('prompt_id', prompt.id).order('order_index'),
      supabase.from('ferramentas').select('*').eq('prompt_id', prompt.id).order('order_index'),
      supabase.from('fluxos').select('*').eq('prompt_id', prompt.id).order('order_index'),
    ]);

    promptData = {
      persona: prompt.persona || '',
      objetivo: prompt.objetivo || '',
      contextoNegocio: prompt.contexto_negocio || '',
      contexto: prompt.contexto || '',
      regras: prompt.regras || [],
      exemplos: (examples.data || []).map(ex => ({
        id: ex.id,
        user: ex.user_text,
        agent: ex.agent_text,
      })),
      variaveisDinamicas: (variaveis.data || []).map(v => ({
        id: v.id,
        chave: v.chave,
        valor: v.valor,
      })),
      ferramentas: (ferramentas.data || []).map(f => ({
        id: f.id,
        nome: f.nome,
        descricao: f.descricao,
      })),
      formatoSaida: prompt.formato_saida as any,
      masterPromptFormat: prompt.master_prompt_format as 'markdown' | 'json',
      estruturaSaida: prompt.estrutura_saida || '',
      fluxos: (fluxos.data || []).map(f => ({
        id: f.id,
        nome: f.nome,
        tipoPrompt: f.tipo_prompt,
        objetivo: f.objetivo,
        baseConhecimentoRAG: f.base_conhecimento_rag || '',
        fewShotExamples: f.few_shot_examples || '',
        reforcarCoT: f.reforcar_cot || false,
        ativarGuardrails: f.ativar_guardrails || false,
      })),
      promptSize: prompt.prompt_size || 5000,
    };
  }

  const result: PromptVersion = {
    id: version.id,
    version: version.version_number,
    content: version.content,
    format: (version.format || 'markdown') as any,
    masterFormat: (version.master_format || 'markdown') as 'markdown' | 'json',
    timestamp: version.created_at ? new Date(version.created_at).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
    sourceData: promptData,
  };

  console.log('✅ [getPromptVersion] Versão encontrada:', result.id);
  return result;
}

// =====================================================
// CHAT MESSAGES
// =====================================================

/**
 * Salva uma mensagem de chat
 */
export async function saveChatMessage(
  promptVersionId: string,
  message: Omit<ChatMessage, 'isEditing'>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptVersionId)) {
    throw new Error('ID de versão de prompt inválido');
  }

  // 🔒 VALIDAÇÃO E SANITIZAÇÃO - Mensagem
  if (!message.author || !['user', 'agent'].includes(message.author)) {
    throw new Error('Autor da mensagem inválido');
  }

  const textValidation = validatePromptText(message.text, 50000);
  if (!textValidation.valid) {
    throw new Error(textValidation.error || 'Texto da mensagem inválido');
  }

  // Obter a próxima ordem
  const { data: lastMessage } = await supabase
    .from('chat_messages')
    .select('order_index')
    .eq('prompt_version_id', promptVersionId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = lastMessage ? lastMessage.order_index + 1 : 0;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      prompt_version_id: promptVersionId,
      author: message.author,
      text: textValidation.sanitized || '',
      feedback: message.feedback,
      correction: message.correction ? sanitizeText(message.correction, 5000) : null,
      order_index: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ ERRO ao salvar mensagem de chat no banco:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }
  
  return data;
}

/**
 * Obtém todas as mensagens de uma versão de prompt
 */
export async function getChatMessages(promptVersionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptVersionId)) {
    throw new Error('ID de versão de prompt inválido');
  }

  console.log('🔍 [getChatMessages] Buscando mensagens de chat para versão:', promptVersionId, 'user_id:', user.id);
  
  // Primeiro, verificar se existe profile para este usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ [getChatMessages] Erro ao verificar profile:', profileError);
    throw profileError;
  }

  if (!profile) {
    console.error('❌ [getChatMessages] Profile não encontrado para user_id:', user.id);
    throw new Error('Perfil do usuário não encontrado');
  }

  console.log('✅ [getChatMessages] Profile encontrado:', profile.id);
  
  // Verificar se a versão pertence a um prompt do usuário usando profile.id
  const { data: versionCheck, error: versionCheckError } = await supabase
    .from('prompt_versions')
    .select('prompt_id, prompts!inner(user_id)')
    .eq('id', promptVersionId)
    .eq('prompts.user_id', profile.id) // CRÍTICO: usar profile.id
    .single();

  if (versionCheckError) {
    console.error('❌ Erro ao verificar versão:', versionCheckError);
    throw versionCheckError;
  }

  if (!versionCheck) {
    console.error('❌ Versão não encontrada ou não pertence ao usuário');
    throw new Error('Versão não encontrada ou você não tem permissão para acessá-la');
  }

  // Buscar mensagens
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('prompt_version_id', promptVersionId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    throw error;
  }

  console.log('✅ Mensagens encontradas no banco:', data?.length || 0);

  if (!data || data.length === 0) {
    console.log('ℹ️ Nenhuma mensagem encontrada para esta versão');
    return [];
  }

  // Converter e validar cada mensagem
  const messages = (data || []).map((m: any) => {
    const message: ChatMessage = {
      author: (m.author === 'user' || m.author === 'agent') ? m.author : 'user',
      text: m.text || '',
      feedback: m.feedback as 'correct' | 'incorrect' | undefined,
      isEditing: false,
      correction: m.correction || undefined,
    };
    
    console.log(`  ✓ ${message.author}: ${message.text.substring(0, 50)}...`);
    
    return message;
  });

  console.log('✅ Mensagens convertidas com sucesso:', messages.length);
  return messages;
}

// =====================================================
// OPTIMIZATION PAIRS
// =====================================================

/**
 * Salva um par de otimização
 */
export async function saveOptimizationPair(
  promptVersionId: string,
  pair: Omit<OptimizationPair, 'id'>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptVersionId)) {
    throw new Error('ID de versão de prompt inválido');
  }

  // 🔒 VALIDAÇÃO E SANITIZAÇÃO - Par de otimização
  const userQueryValidation = validatePromptText(pair.userQuery, 5000);
  const originalResponseValidation = validatePromptText(pair.originalResponse, 50000);
  const correctedResponseValidation = validatePromptText(pair.correctedResponse, 50000);

  if (!userQueryValidation.valid || !originalResponseValidation.valid || !correctedResponseValidation.valid) {
    throw new Error('Dados do par de otimização inválidos');
  }

  const { data, error } = await supabase
    .from('optimization_pairs')
    .insert({
      prompt_version_id: promptVersionId,
      user_query: userQueryValidation.sanitized || '',
      original_response: originalResponseValidation.sanitized || '',
      corrected_response: correctedResponseValidation.sanitized || '',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtém todos os pares de otimização de uma versão
 */
export async function getOptimizationPairs(promptVersionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptVersionId)) {
    throw new Error('ID de versão de prompt inválido');
  }

  const { data, error } = await supabase
    .from('optimization_pairs')
    .select(`
      *,
      prompt_versions!inner(
        prompts!inner(user_id)
      )
    `)
    .eq('prompt_versions.prompts.user_id', user.id)
    .eq('prompt_version_id', promptVersionId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    userQuery: p.user_query,
    originalResponse: p.original_response,
    correctedResponse: p.corrected_response,
  })) as OptimizationPair[];
}

// =====================================================
// DOCUMENTS
// =====================================================

/**
 * Salva um documento
 */
export async function saveDocument(document: {
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url?: string;
  content_text?: string;
  metadata?: Record<string, any>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      ...document,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtém todos os documentos do usuário
 */
export async function getUserDocuments() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// =====================================================
// WORKSPACES
// =====================================================

/**
 * Obtém todos os workspaces do usuário atual
 */
export async function getUserWorkspaces(): Promise<Workspace[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  console.log('🔍 [getUserWorkspaces] Buscando workspaces para user_id:', user.id);

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [getUserWorkspaces] Erro ao buscar workspaces:', error);
    throw error;
  }

  console.log('✅ [getUserWorkspaces] Workspaces encontrados:', data?.length || 0);
  return (data || []) as Workspace[];
}

/**
 * Obtém o workspace padrão do usuário
 */
export async function getDefaultWorkspace(): Promise<Workspace | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('is_default', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum workspace padrão encontrado, criar um
      return await createDefaultWorkspace();
    }
    console.error('❌ [getDefaultWorkspace] Erro ao buscar workspace padrão:', error);
    throw error;
  }

  return data as Workspace;
}

/**
 * Cria um workspace padrão para o usuário
 */
async function createDefaultWorkspace(): Promise<Workspace> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: user.id,
      name: 'Meu Workspace',
      description: 'Workspace padrão',
      is_active: true,
      is_default: true,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [createDefaultWorkspace] Erro ao criar workspace padrão:', error);
    throw error;
  }

  console.log('✅ [createDefaultWorkspace] Workspace padrão criado:', data.id);
  return data as Workspace;
}

/**
 * Cria um novo workspace
 */
export async function createWorkspace(name: string, description?: string): Promise<Workspace> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Sanitizar nome
  const sanitizedName = sanitizeText(name.trim(), 100);
  if (!sanitizedName || sanitizedName.length === 0) {
    throw new Error('Nome do workspace não pode estar vazio');
  }

  console.log('💾 [createWorkspace] Criando workspace:', sanitizedName);

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: user.id,
      name: sanitizedName,
      description: description ? sanitizeText(description.trim(), 500) : null,
      is_active: true,
      is_default: false, // Novo workspace não é padrão por padrão
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [createWorkspace] Erro ao criar workspace:', error);
    throw error;
  }

  console.log('✅ [createWorkspace] Workspace criado:', data.id);
  return data as Workspace;
}

/**
 * Atualiza um workspace
 */
export async function updateWorkspace(workspaceId: string, updates: { name?: string; description?: string }): Promise<Workspace> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Validação de UUID
  if (!isValidUUID(workspaceId)) {
    throw new Error('ID de workspace inválido');
  }

  // Sanitizar dados
  const sanitizedUpdates: any = {};
  if (updates.name !== undefined) {
    const sanitizedName = sanitizeText(updates.name.trim(), 100);
    if (!sanitizedName || sanitizedName.length === 0) {
      throw new Error('Nome do workspace não pode estar vazio');
    }
    sanitizedUpdates.name = sanitizedName;
  }
  if (updates.description !== undefined) {
    sanitizedUpdates.description = updates.description ? sanitizeText(updates.description.trim(), 500) : null;
  }

  sanitizedUpdates.updated_at = new Date().toISOString();

  console.log('💾 [updateWorkspace] Atualizando workspace:', workspaceId);

  const { data, error } = await supabase
    .from('workspaces')
    .update(sanitizedUpdates)
    .eq('id', workspaceId)
    .eq('user_id', user.id) // Garantir que o workspace pertence ao usuário
    .select()
    .single();

  if (error) {
    console.error('❌ [updateWorkspace] Erro ao atualizar workspace:', error);
    throw error;
  }

  console.log('✅ [updateWorkspace] Workspace atualizado:', data.id);
  return data as Workspace;
}

/**
 * Define um workspace como padrão
 */
export async function setDefaultWorkspace(workspaceId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Validação de UUID
  if (!isValidUUID(workspaceId)) {
    throw new Error('ID de workspace inválido');
  }

  console.log('💾 [setDefaultWorkspace] Definindo workspace como padrão:', workspaceId);

  // Primeiro, desmarcar todos os outros workspaces padrão
  const { error: unsetError } = await supabase
    .from('workspaces')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .eq('is_default', true);

  if (unsetError) {
    console.error('❌ [setDefaultWorkspace] Erro ao desmarcar workspaces padrão:', unsetError);
    throw unsetError;
  }

  // Depois, marcar o workspace selecionado como padrão
  const { error: setError } = await supabase
    .from('workspaces')
    .update({ is_default: true })
    .eq('id', workspaceId)
    .eq('user_id', user.id); // Garantir que o workspace pertence ao usuário

  if (setError) {
    console.error('❌ [setDefaultWorkspace] Erro ao definir workspace como padrão:', setError);
    throw setError;
  }

  console.log('✅ [setDefaultWorkspace] Workspace definido como padrão:', workspaceId);
}

/**
 * Deleta um workspace (soft delete - marca como inativo)
 */
export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Validação de UUID
  if (!isValidUUID(workspaceId)) {
    throw new Error('ID de workspace inválido');
  }

  // Verificar se é o workspace padrão
  const { data: workspace, error: fetchError } = await supabase
    .from('workspaces')
    .select('is_default')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error('❌ [deleteWorkspace] Erro ao buscar workspace:', fetchError);
    throw fetchError;
  }

  if (workspace?.is_default) {
    throw new Error('Não é possível deletar o workspace padrão. Crie outro workspace e defina-o como padrão primeiro.');
  }

  console.log('🗑️ [deleteWorkspace] Deletando workspace:', workspaceId);

  // Soft delete - marcar como inativo
  const { error } = await supabase
    .from('workspaces')
    .update({ is_active: false })
    .eq('id', workspaceId)
    .eq('user_id', user.id); // Garantir que o workspace pertence ao usuário

  if (error) {
    console.error('❌ [deleteWorkspace] Erro ao deletar workspace:', error);
    throw error;
  }

  console.log('✅ [deleteWorkspace] Workspace deletado:', workspaceId);
}

