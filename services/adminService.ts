/**
 * 🔐 SERVIÇO DE ADMINISTRAÇÃO
 * Gerencia tenants, subscriptions e usuários admin
 */

import { supabase } from './supabaseService';

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('⚠️ [isSuperAdmin] Nenhuma sessão ativa');
      return false;
    }

    console.log('🔍 [isSuperAdmin] Verificando admin para user_id:', session.user.id);
    console.log('🔍 [isSuperAdmin] Email do usuário:', session.user.email);

    // Verificar por email também (fallback)
    const userEmail = session.user.email;
    if (userEmail === 'brunocostaads23@gmail.com') {
      console.log('✅ [isSuperAdmin] Email corresponde ao admin master - verificando na tabela...');
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('role, email, is_active')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle();

    console.log('📋 [isSuperAdmin] Resultado da query:', { data, error });

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [isSuperAdmin] Erro na query:', error);
      // Se não encontrar na tabela mas o email for o admin master, retornar true (fallback)
      if (userEmail === 'brunocostaads23@gmail.com') {
        console.warn('⚠️ [isSuperAdmin] Admin não encontrado na tabela, mas email é admin master. Criando registro...');
        // Tentar criar o registro de admin
        try {
          const { error: insertError } = await supabase
            .from('admin_users')
            .insert({
              user_id: session.user.id,
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
          }
        } catch (createError) {
          console.error('❌ [isSuperAdmin] Erro ao criar registro de admin:', createError);
        }
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
    return false;
  }
}

/**
 * Lista todos os tenants (Limitado aos 50 mais recentes para performance)
 */
export async function listTenants(): Promise<Tenant[]> {
  try {
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
 */
export async function createUserWithPremium(userData: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ userId: string; message: string }> {
  try {
    console.log('🔐 [Admin] Criando usuário com premium:', userData.email);

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirmar email (admin criou)
      user_metadata: {
        full_name: userData.fullName,
      },
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado corretamente');
    }

    const userId = authData.user.id;
    console.log('✅ Usuário criado no Auth:', userId);

    // 2. Criar perfil (caso não seja criado automaticamente)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.fullName,
      });

    if (profileError) {
      console.warn('⚠️ Erro ao criar perfil (pode já existir):', profileError);
    }

    // 3. Buscar plano Premium
    const { data: premiumPlan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('name', 'premium')
      .single();

    if (planError || !premiumPlan) {
      console.error('❌ Plano premium não encontrado:', planError);
      throw new Error('Plano premium não encontrado no banco de dados');
    }

    console.log('✅ Plano premium encontrado:', premiumPlan.id);

    // 4. Criar subscription premium
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: premiumPlan.id,
        status: 'active',
        is_active: true,
        subscription_started_at: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.error('❌ Erro ao criar subscription:', subscriptionError);
      throw new Error(`Erro ao criar subscription premium: ${subscriptionError.message}`);
    }

    console.log('✅ Subscription premium criada para:', userId);

    return {
      userId,
      message: `Usuário ${userData.email} criado com sucesso e subscription premium ativada!`,
    };
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário com premium:', error);
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

