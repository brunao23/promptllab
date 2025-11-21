/**
 * 🔐 SERVIÇO DE ASSINATURAS E LIMITAÇÕES
 * Gerencia subscriptions, plans e limitações do SaaS
 */

import { getSupabaseClient } from './supabaseService';
import { isSuperAdmin } from './adminService';

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  max_prompt_versions: number;
  max_tokens_per_month: number;
  can_share_chat: boolean;
  trial_days: number | null;
  price_monthly: number | null;
  price_yearly: number | null;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  tenant_id: string | null;
  plan_id: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  is_active: boolean;
  plan?: Plan;
}

const ADMIN_PLAN: Plan = {
  id: 'admin-master-plan',
  name: 'admin_master',
  display_name: '🔐 Admin Master',
  description: 'Acesso total e ilimitado para administradores',
  max_prompt_versions: -1,  // -1 = ilimitado
  max_tokens_per_month: -1,  // -1 = ilimitado
  can_share_chat: true,
  trial_days: null,
  price_monthly: null,
  price_yearly: null,
  is_active: true,
};

function buildAdminSubscription(userId: string): Subscription {
  return {
    id: `admin-subscription-${userId}`,
    user_id: userId,
    tenant_id: null,
    plan_id: ADMIN_PLAN.id,
    trial_started_at: null,
    trial_ends_at: null,
    subscription_started_at: new Date().toISOString(),
    subscription_ends_at: null,
    status: 'active',
    is_active: true,
    plan: ADMIN_PLAN,
  };
}

export interface UsageTracking {
  id: string;
  user_id: string;
  subscription_id: string | null;
  usage_type: string;
  model_used: string | null;
  tokens_used: number;
  requests_count: number;
  usage_month: number;
  usage_year: number;
  created_at: string;
}

/**
 * Obtém o tenant_id do usuário atual através da subscription
 */
export async function getCurrentUserTenantId(): Promise<string | null> {
  try {
    const subscription = await getCurrentSubscription();
    return subscription?.tenant_id || null;
  } catch (error) {
    console.error('❌ Erro ao obter tenant_id do usuário:', error);
    return null;
  }
}

/**
 * Obtém a assinatura ativa do usuário atual
 */
export async function getCurrentSubscription(): Promise<Subscription | null> {
  try {
    const supabase = await getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('⚠️ [getCurrentSubscription] Nenhuma sessão ativa');
      return null;
    }

    console.log('🔍 [getCurrentSubscription] Buscando subscription para usuário:', session.user.id);
    console.log('🔍 [getCurrentSubscription] Email do usuário:', session.user.email);

    // 🔐 VERIFICAÇÃO DIRETA: Admin Master por email (fallback rápido)
    const userEmail = session.user.email?.toLowerCase().trim();
    if (userEmail === 'brunocostaads23@gmail.com') {
      console.log('👑 [getCurrentSubscription] 🔥 ADMIN MASTER DETECTADO POR EMAIL - CONCEDENDO PLANO ILIMITADO 🔥');
      return buildAdminSubscription(session.user.id);
    }

    // Verificação normal de admin
    const adminOverride = await isSuperAdmin();
    if (adminOverride) {
      console.log('👑 [getCurrentSubscription] Admin master detectado via isSuperAdmin - concedendo plano ilimitado');
      return buildAdminSubscription(session.user.id);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('⚠️ [getCurrentSubscription] Nenhuma assinatura encontrada para o usuário. Verifique se o trigger está criando subscriptions automaticamente.');
        console.log('💡 [getCurrentSubscription] O trigger `on_auth_user_created` deve criar uma subscription automaticamente quando um usuário se registra.');
        return null;
      }
      console.error('❌ [getCurrentSubscription] Erro ao buscar subscription:', error);
      throw error;
    }

    console.log('✅ [getCurrentSubscription] Subscription encontrada:', {
      id: data.id,
      status: data.status,
      plan: data.plan?.display_name || 'Sem plano',
      trial_ends_at: data.trial_ends_at
    });

    return data as Subscription;
  } catch (error: any) {
    console.error('❌ [getCurrentSubscription] Erro ao buscar subscription:', error);
    return null;
  }
}

/**
 * Verifica se o usuário pode compartilhar chat
 */
export async function canShareChat(): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) {
      return {
        allowed: false,
        reason: 'Nenhuma assinatura ativa encontrada. Por favor, entre em contato com o suporte.',
      };
    }

    if (!subscription.plan?.can_share_chat) {
      return {
        allowed: false,
        reason: 'Compartilhamento de chat não disponível no plano Trial. Faça upgrade para acessar este recurso.',
      };
    }

    return { allowed: true };
  } catch (error: any) {
    console.error('❌ Erro ao verificar compartilhamento:', error);
    return {
      allowed: false,
      reason: 'Erro ao verificar permissão. Tente novamente.',
    };
  }
}

/**
 * Verifica se o usuário tem acesso a um recurso específico
 */
export async function checkAccess(feature: 'share_chat' | 'create_version' | 'use_tokens'): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient();
    if (await isSuperAdmin()) {
      return true;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data, error } = await supabase.rpc('check_user_access', {
      p_user_id: session.user.id,
      p_feature: feature,
    });

    if (error) {
      console.error('❌ Erro ao verificar acesso:', error);
      return false;
    }

    return data === true;
  } catch (error: any) {
    console.error('❌ Erro ao verificar acesso:', error);
    return false;
  }
}

/**
 * Registra uso de tokens
 */
export async function trackTokenUsage(
  tokensUsed: number,
  usageType: 'prompt_generation' | 'chat' | 'document_analysis',
  modelUsed: string,
  promptId?: string,
  versionId?: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient();
    if (await isSuperAdmin()) {
      return true;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('❌ Usuário não autenticado para registrar uso');
      return false;
    }

    const { error } = await supabase.rpc('track_token_usage', {
      p_user_id: session.user.id,
      p_tokens_used: tokensUsed,
      p_usage_type: usageType,
      p_model_used: modelUsed,
      p_prompt_id: promptId || null,
      p_version_id: versionId || null,
    });

    if (error) {
      console.error('❌ Erro ao registrar uso de tokens:', error);
      return false;
    }

    console.log(`✅ Uso registrado: ${tokensUsed} tokens (${usageType})`);
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao registrar uso de tokens:', error);
    return false;
  }
}

/**
 * Obtém o uso de tokens do mês atual
 */
export async function getCurrentMonthUsage(): Promise<{
  tokensUsed: number;
  tokensLimit: number;
  percentage: number;
}> {
  try {
    const supabase = await getSupabaseClient();
    const subscription = await getCurrentSubscription();
    if (!subscription) {
      return { tokensUsed: 0, tokensLimit: 1000000, percentage: 0 };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { tokensUsed: 0, tokensLimit: subscription.plan?.max_tokens_per_month || 1000000, percentage: 0 };
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('tokens_used')
      .eq('user_id', session.user.id)
      .eq('usage_year', year)
      .eq('usage_month', month);

    if (error) {
      console.error('❌ Erro ao buscar uso:', error);
      return { tokensUsed: 0, tokensLimit: subscription.plan?.max_tokens_per_month || 1000000, percentage: 0 };
    }

    const tokensUsed = data?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0;
    const tokensLimit = subscription.plan?.max_tokens_per_month || 1000000;
    const percentage = tokensLimit > 0 ? Math.round((tokensUsed / tokensLimit) * 100) : 0;

    return { tokensUsed, tokensLimit, percentage };
  } catch (error: any) {
    console.error('❌ Erro ao buscar uso do mês:', error);
    return { tokensUsed: 0, tokensLimit: 1000000, percentage: 0 };
  }
}

/**
 * Conta versões de prompt criadas no mês atual
 */
export async function getCurrentMonthVersions(): Promise<{
  versionsCount: number;
  versionsLimit: number;
  canCreateMore: boolean;
}> {
  try {
    const supabase = await getSupabaseClient();
    const subscription = await getCurrentSubscription();
    if (!subscription) {
      return { versionsCount: 0, versionsLimit: 4, canCreateMore: true };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { versionsCount: 0, versionsLimit: subscription.plan?.max_prompt_versions || 4, canCreateMore: true };
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('id')
      .eq('user_id', session.user.id);

    if (promptsError || !prompts?.length) {
      return { versionsCount: 0, versionsLimit: subscription.plan?.max_prompt_versions || 4, canCreateMore: true };
    }

    const promptIds = prompts.map(p => p.id);

    const { data: versions, error } = await supabase
      .from('prompt_versions')
      .select('id')
      .in('prompt_id', promptIds)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.error('❌ Erro ao contar versões:', error);
      return { versionsCount: 0, versionsLimit: subscription.plan?.max_prompt_versions || 4, canCreateMore: true };
    }

    const versionsCount = versions?.length || 0;
    const versionsLimit = subscription.plan?.max_prompt_versions || 4;
    const canCreateMore = versionsLimit === -1 || versionsCount < versionsLimit;

    return { versionsCount, versionsLimit, canCreateMore };
  } catch (error: any) {
    console.error('❌ Erro ao contar versões:', error);
    return { versionsCount: 0, versionsLimit: 4, canCreateMore: true };
  }
}

/**
 * Verifica se o trial ainda está ativo
 */
export async function isTrialActive(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return false;

  if (subscription.status !== 'trial') return false;

  if (!subscription.trial_ends_at) return false;

  const trialEndsAt = new Date(subscription.trial_ends_at);
  return trialEndsAt > new Date();
}

/**
 * Obtém informações do plano atual
 */
export async function getCurrentPlanInfo(): Promise<{
  planName: string;
  displayName: string;
  isTrial: boolean;
  trialDaysLeft: number | null;
  canShareChat: boolean;
  maxVersions: number;
  maxTokens: number;
} | null> {
  console.log('🔍 [getCurrentPlanInfo] Buscando informações do plano...');
  const subscription = await getCurrentSubscription();
  
  if (!subscription || !subscription.plan) {
    console.warn('⚠️ [getCurrentPlanInfo] Nenhuma subscription ou plano encontrado.');
    console.log('💡 [getCurrentPlanInfo] Verifique se o trigger `create_master_admin()` está criando subscriptions corretamente.');
    return null;
  }
  
  console.log('📋 [getCurrentPlanInfo] Subscription encontrada:', {
    status: subscription.status,
    plan_name: subscription.plan.name,
    display_name: subscription.plan.display_name,
    trial_ends_at: subscription.trial_ends_at,
    max_versions: subscription.plan.max_prompt_versions,
    max_tokens: subscription.plan.max_tokens_per_month,
  });

  const isTrial = subscription.status === 'trial';
  let trialDaysLeft: number | null = null;

  if (isTrial && subscription.trial_ends_at) {
    const trialEndsAt = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diff = trialEndsAt.getTime() - now.getTime();
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    planName: subscription.plan.name,
    displayName: subscription.plan.display_name,
    isTrial,
    trialDaysLeft,
    canShareChat: subscription.plan.can_share_chat,
    maxVersions: subscription.plan.max_prompt_versions,
    maxTokens: subscription.plan.max_tokens_per_month,
  };
}

/**
 * Verifica se o usuário pode usar tokens (usado pelo geminiService)
 */
export async function canUseTokens(tokensToUse: number): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) {
      return {
        allowed: false,
        reason: 'Nenhuma assinatura ativa encontrada. Por favor, entre em contato com o suporte.',
      };
    }

    // Se o plano não tem limite (-1), permitir sempre
    if (subscription.plan?.max_tokens_per_month === -1) {
      return { allowed: true };
    }

    const usage = await getCurrentMonthUsage();
    
    if (usage.tokensLimit === -1) {
      return { allowed: true };
    }

    const tokensAfterUsage = usage.tokensUsed + tokensToUse;

    if (tokensAfterUsage > usage.tokensLimit) {
      const remaining = Math.max(0, usage.tokensLimit - usage.tokensUsed);
      return {
        allowed: false,
        reason: `Limite de tokens excedido. Você tem ${remaining.toLocaleString('pt-BR')} tokens restantes este mês. Upgrade seu plano para continuar.`,
      };
    }

    return { allowed: true };
  } catch (error: any) {
    console.error('❌ Erro ao verificar tokens:', error);
    return {
      allowed: false,
      reason: 'Erro ao verificar limite de tokens. Tente novamente.',
    };
  }
}

/**
 * Incrementa o uso de tokens (usado pelo geminiService)
 */
export async function incrementTokenUsage(
  tokensUsed: number,
  usageType: 'prompt_generation' | 'chat' | 'document_analysis' = 'prompt_generation',
  modelUsed: string = 'gemini-2.5-flash',
  promptId?: string,
  versionId?: string
): Promise<boolean> {
  return trackTokenUsage(tokensUsed, usageType, modelUsed, promptId, versionId);
}

/**
 * Tipo para limites do usuário
 */
export interface UserLimits {
  canCreateVersion: boolean;
  canShareChat: boolean;
  versionsCount: number;
  versionsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  trialDaysLeft: number | null;
}

/**
 * Verifica limites do usuário
 */
export async function checkUserLimits(): Promise<UserLimits> {
  const [planInfo, versionsInfo, usageInfo] = await Promise.all([
    getCurrentPlanInfo(),
    getCurrentMonthVersions(),
    getCurrentMonthUsage()
  ]);

  return {
    canCreateVersion: versionsInfo.canCreateMore,
    canShareChat: planInfo?.canShareChat || false,
    versionsCount: versionsInfo.versionsCount,
    versionsLimit: versionsInfo.versionsLimit,
    tokensUsed: usageInfo.tokensUsed,
    tokensLimit: usageInfo.tokensLimit,
    trialDaysLeft: planInfo?.trialDaysLeft || null
  };
}

/**
 * Verifica se o usuário pode criar uma nova versão
 */
export async function canCreateVersion(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const canAccess = await checkAccess('create_version');
  if (!canAccess) {
    const versionsInfo = await getCurrentMonthVersions();
    return {
      allowed: false,
      reason: `Limite de versões atingido! Você já criou ${versionsInfo.versionsCount} de ${versionsInfo.versionsLimit} versões permitidas no seu plano este mês. Upgrade para Premium para criar versões ilimitadas.`
    };
  }
  return { allowed: true };
}

/**
 * Incrementa o contador de versões (não precisa fazer nada no banco, é apenas para UI)
 */
export async function incrementVersionCount(): Promise<void> {
  // A contagem é feita automaticamente pelo banco quando uma versão é criada
  // Esta função existe apenas para manter compatibilidade com o código existente
  console.log('📊 [incrementVersionCount] Contador de versões será atualizado automaticamente na próxima criação.');
}
