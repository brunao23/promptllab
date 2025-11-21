/**
 * 🔐 SERVIÇO DE ADMINISTRAÇÃO
 * Gerencia tenants, subscriptions e usuários admin
 */

import { getSupabaseClient } from './supabaseService';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'super_admin';
  can_manage_tenants: boolean;
  can_manage_subscriptions: boolean;
  can_view_analytics: boolean;
  is_active: boolean;
}

export interface UserWithSubscription {
  id: string;
  email: string;
  full_name: string | null;
  subscription: {
    id: string;
    plan_id: string;
    status: string;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
  } | null;
}

/**
 * Verifica se o usuário atual é admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) return false;
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar admin:', error);
    return false;
  }
}

/**
 * Verifica se o usuário atual é super admin (master)
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('⚠️ [isSuperAdmin] Nenhuma sessão ativa');
      return false;
    }

    const userEmail = session.user.email?.toLowerCase().trim();
    const userId = session.user.id;

    console.log('🔍 [isSuperAdmin] Verificando admin para user_id:', userId);
    console.log('🔍 [isSuperAdmin] Email do usuário:', userEmail);

    // PRIMEIRO: Verificar se o email é o admin master (fallback rápido)
    if (userEmail === 'brunocostaads23@gmail.com') {
      console.log('✅ [isSuperAdmin] Email corresponde ao admin master - verificando na tabela...');
      
      // Verificar na tabela primeiro
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role, email, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (adminData && adminData.role === 'super_admin') {
        console.log('✅ [isSuperAdmin] Admin encontrado na tabela com role super_admin');
        return true;
      }

      // Se não encontrou na tabela, tentar criar o registro
      if (!adminData || adminError) {
        console.warn('⚠️ [isSuperAdmin] Admin não encontrado na tabela, mas email é admin master. Criando registro...');
        try {
          const { error: insertError } = await supabase
            .from('admin_users')
            .insert({
              user_id: userId,
              email: userEmail,
              role: 'super_admin',
              can_manage_tenants: true,
              can_manage_subscriptions: true,
              can_view_analytics: true,
              is_active: true,
            });
          
          if (!insertError) {
            console.log('✅ [isSuperAdmin] Registro de admin criado automaticamente');
            return true;
          } else {
            console.warn('⚠️ [isSuperAdmin] Erro ao criar registro (pode já existir):', insertError);
            // Mesmo com erro de inserção, se o email for o admin master, retornar true
            return true;
          }
        } catch (createError) {
          console.error('❌ [isSuperAdmin] Erro ao criar registro de admin:', createError);
          // Mesmo com erro, se o email for o admin master, retornar true como fallback
          return true;
        }
      }
    }

    // SEGUNDO: Verificar na tabela admin_users
    const { data, error } = await supabase
      .from('admin_users')
      .select('role, email, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('📋 [isSuperAdmin] Resultado da query:', { data, error });

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [isSuperAdmin] Erro na query:', error);
      // Se o email for o admin master, retornar true mesmo com erro
      if (userEmail === 'brunocostaads23@gmail.com') {
        console.log('✅ [isSuperAdmin] Erro na query, mas email é admin master (fallback)');
        return true;
      }
      return false;
    }

    if (!data) {
      console.warn('⚠️ [isSuperAdmin] Nenhum registro de admin encontrado');
      // Fallback: se o email for o admin master, retornar true
      if (userEmail === 'brunocostaads23@gmail.com') {
        console.log('✅ [isSuperAdmin] Email corresponde ao admin master (fallback)');
        return true;
      }
      return false;
    }

    const isSuper = data.role === 'super_admin';
    console.log('✅ [isSuperAdmin] Resultado:', isSuper, 'Role:', data.role);
    return isSuper;
  } catch (error: any) {
    console.error('❌ [isSuperAdmin] Erro ao verificar super admin:', error);
    console.error('❌ [isSuperAdmin] Stack:', error.stack);
    
    // Em caso de erro, verificar se o email é o admin master como último recurso
    try {
      const supabase = await getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email?.toLowerCase().trim();
      if (userEmail === 'brunocostaads23@gmail.com') {
        console.log('✅ [isSuperAdmin] Erro capturado, mas email é admin master (fallback final)');
        return true;
      }
    } catch (fallbackError) {
      console.error('❌ [isSuperAdmin] Erro no fallback:', fallbackError);
    }
    
    return false;
  }
}

/**
 * Lista todos os tenants (Limitado aos 50 mais recentes para performance)
 */
export async function listTenants(): Promise<Tenant[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('❌ Erro ao listar tenants:', error);
    throw error;
  }
}

/**
 * Cria um novo tenant
 */
export async function createTenant(tenantData: {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
}): Promise<Tenant> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        name: tenantData.name,
        slug: tenantData.slug,
        email: tenantData.email || null,
        phone: tenantData.phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('❌ Erro ao criar tenant:', error);
    throw error;
  }
}

/**
 * Atualiza um tenant
 */
export async function updateTenant(
  tenantId: string,
  updates: Partial<Tenant>
): Promise<Tenant> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar tenant:', error);
    throw error;
  }
}

/**
 * Lista todas as subscriptions (Limitado as 50 mais recentes)
 */
export async function listSubscriptions(): Promise<any[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*),
        user:profiles(id, email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('❌ Erro ao listar subscriptions:', error);
    throw error;
  }
}

/**
 * Atualiza uma subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: {
    plan_id?: string;
    status?: 'trial' | 'active' | 'cancelled' | 'expired';
    trial_ends_at?: string;
    subscription_ends_at?: string;
    is_active?: boolean;
  }
): Promise<any> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select(`
        *,
        plan:plans(*)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar subscription:', error);
    throw error;
  }
}

/**
 * Cria uma subscription para um usuário
 */
export async function createSubscription(
  userId: string,
  planId: string,
  tenantId?: string
): Promise<any> {
  try {
    const supabase = await getSupabaseClient();
    const plan = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (plan.error) throw plan.error;

    const subscriptionData: any = {
      user_id: userId,
      plan_id: planId,
      status: 'active',
      is_active: true,
    };

    if (plan.data?.trial_days) {
      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.data.trial_days);

      subscriptionData.status = 'trial';
      subscriptionData.trial_started_at = now.toISOString();
      subscriptionData.trial_ends_at = trialEndsAt.toISOString();
    } else {
      subscriptionData.subscription_started_at = new Date().toISOString();
    }

    if (tenantId) {
      subscriptionData.tenant_id = tenantId;
    }

    // Desativar outras subscriptions do usuário
    await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select(`
        *,
        plan:plans(*)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('❌ Erro ao criar subscription:', error);
    throw error;
  }
}

/**
 * Lista usuários com suas subscriptions (Otimizado com JOIN e Limite)
 */
export async function listUsers(): Promise<UserWithSubscription[]> {
  try {
    const supabase = await getSupabaseClient();
    // Query otimizada: Busca profiles e subscriptions em uma única requisição
    // Limitado a 50 usuários mais recentes para evitar sobrecarga
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        email, 
        full_name,
        subscriptions (
          id,
          plan_id,
          status,
          trial_ends_at,
          subscription_ends_at,
          is_active
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (!profiles) return [];

    // Mapear para o formato esperado pela interface
    return profiles.map((profile: any) => {
      // Encontrar a subscription ativa, se houver
      const activeSubscription = profile.subscriptions?.find((s: any) => s.is_active === true) || null;

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        subscription: activeSubscription ? {
          id: activeSubscription.id,
          plan_id: activeSubscription.plan_id,
          status: activeSubscription.status,
          trial_ends_at: activeSubscription.trial_ends_at,
          subscription_ends_at: activeSubscription.subscription_ends_at,
        } : null,
      };
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar usuários:', error);
    throw error;
  }
}

/**
 * Cria um novo usuário com subscription premium (ADMIN ONLY)
 * Usa API Route para ter acesso ao Service Role Key
 */
export async function createUserWithPremium(userData: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ userId: string; message: string }> {
  try {
    console.log('🔐 [Admin] Criando usuário com premium via API:', userData.email);

    // Obter token de autenticação do admin
    const supabase = await getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Sessão de admin não encontrada');
    }

    // Chamar API Route que tem acesso ao Service Role
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar usuário');
    }

    console.log('✅ [Admin] Usuário criado com sucesso:', result.userId);

    return {
      userId: result.userId,
      message: result.message,
    };
  } catch (error: any) {
    console.error('❌ [Admin] Erro ao criar usuário com premium:', error);
    throw error;
  }
}

/**
 * Altera o plano de um usuário (trial → premium ou premium → trial)
 */
export async function changeUserPlan(
  userId: string,
  newPlanType: 'trial' | 'premium'
): Promise<{ message: string }> {
  try {
    const supabase = await getSupabaseClient();
    console.log(`🔄 [Admin] Alterando plano do usuário ${userId} para ${newPlanType}`);

    // 1. Buscar o plano desejado
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, trial_days')
      .eq('name', newPlanType)
      .single();

    if (planError || !plan) {
      throw new Error(`Plano ${newPlanType} não encontrado`);
    }

    // 2. Desativar subscriptions antigas
    await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId);

    // 3. Criar nova subscription
    const subscriptionData: any = {
      user_id: userId,
      plan_id: plan.id,
      is_active: true,
    };

    if (newPlanType === 'trial' && plan.trial_days) {
      // Criar trial
      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.trial_days);

      subscriptionData.status = 'trial';
      subscriptionData.trial_started_at = now.toISOString();
      subscriptionData.trial_ends_at = trialEndsAt.toISOString();
    } else {
      // Criar premium
      subscriptionData.status = 'active';
      subscriptionData.subscription_started_at = new Date().toISOString();
    }

    const { error: createError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData);

    if (createError) {
      throw new Error(`Erro ao criar nova subscription: ${createError.message}`);
    }

    console.log(`✅ Plano alterado para ${newPlanType}`);

    return {
      message: `Plano alterado para ${newPlanType === 'premium' ? 'Premium' : 'Trial'} com sucesso!`,
    };
  } catch (error: any) {
    console.error('❌ Erro ao alterar plano:', error);
    throw error;
  }
}

/**
 * Obtém estatísticas gerais (Otimizado com COUNT)
 */
export async function getAdminStats(): Promise<{
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  premiumUsers: number;
  totalTenants: number;
}> {
  try {
    const supabase = await getSupabaseClient();
    // Executa queries de contagem em paralelo sem baixar os dados
    const [
      { count: totalUsers },
      { count: activeSubscriptions },
      { count: trialUsers },
      { count: premiumUsers },
      { count: totalTenants }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('status', 'trial'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('status', 'active'),
      supabase.from('tenants').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      trialUsers: trialUsers || 0,
      premiumUsers: premiumUsers || 0,
      totalTenants: totalTenants || 0,
    };
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw error;
  }
}

