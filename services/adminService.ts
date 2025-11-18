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
    if (!session?.user) return false;

    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) return false;
    return data.role === 'super_admin';
  } catch (error) {
    console.error('❌ Erro ao verificar super admin:', error);
    return false;
  }
}

/**
 * Lista todos os tenants
 */
export async function listTenants(): Promise<Tenant[]> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

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
 * Lista todas as subscriptions
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
      .order('created_at', { ascending: false });

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
 * Lista usuários com suas subscriptions
 */
export async function listUsers(): Promise<UserWithSubscription[]> {
  try {
    // Buscar todos os profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    if (!profiles) return [];

    // Buscar subscriptions ativas para cada usuário
    const userIds = profiles.map(p => p.id);
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (subsError) {
      console.warn('⚠️ Erro ao buscar subscriptions:', subsError);
    }

    // Combinar dados
    return profiles.map(profile => {
      const subscription = subscriptions?.find(s => s.user_id === profile.id) || null;
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        subscription: subscription ? {
          id: subscription.id,
          plan_id: subscription.plan_id,
          status: subscription.status,
          trial_ends_at: subscription.trial_ends_at,
          subscription_ends_at: subscription.subscription_ends_at,
        } : null,
      };
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar usuários:', error);
    throw error;
  }
}

/**
 * Obtém estatísticas gerais
 */
export async function getAdminStats(): Promise<{
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  premiumUsers: number;
  totalTenants: number;
}> {
  try {
    const [profiles, subscriptions, tenants] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('status', { count: 'exact' }).eq('is_active', true),
      supabase.from('tenants').select('id', { count: 'exact', head: true }),
    ]);

    const totalUsers = profiles.count || 0;
    const activeSubscriptions = subscriptions.count || 0;
    const totalTenants = tenants.count || 0;

    const subsData = subscriptions.data || [];
    const trialUsers = subsData.filter(s => s.status === 'trial').length;
    const premiumUsers = subsData.filter(s => s.status === 'active').length;

    return {
      totalUsers,
      activeSubscriptions,
      trialUsers,
      premiumUsers,
      totalTenants,
    };
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw error;
  }
}

