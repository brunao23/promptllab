/**
 * 🔐 PAINEL MASTER DE ADMINISTRAÇÃO
 * Apenas brunocostaads23@gmail.com tem acesso
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  isAdmin, 
  isSuperAdmin, 
  listTenants, 
  createTenant, 
  updateTenant,
  listSubscriptions,
  updateSubscription,
  createSubscription,
  listUsers,
  getAdminStats
} from '../services/adminService';
import type { Tenant, UserWithSubscription } from '../services/adminService';

export const AdminPage: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tenants' | 'subscriptions'>('dashboard');
  
  // Dashboard
  const [stats, setStats] = useState<any>(null);
  
  // Users
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  
  // Tenants
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', slug: '', email: '', phone: '' });
  
  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isSuper = await isSuperAdmin();
        if (!isSuper) {
          alert('Acesso negado. Apenas administradores master podem acessar este painel.');
          router.push('/dashboard');
          return;
        }
        setIsAuthorized(true);
        await loadData();
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const statsData = await getAdminStats();
        setStats(statsData);
      } else if (activeTab === 'users') {
        const usersData = await listUsers();
        setUsers(usersData);
      } else if (activeTab === 'tenants') {
        const tenantsData = await listTenants();
        setTenants(tenantsData);
      } else if (activeTab === 'subscriptions') {
        const subsData = await listSubscriptions();
        setSubscriptions(subsData);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      alert(`Erro ao carregar dados: ${error.message}`);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [activeTab, isAuthorized]);

  const handleCreateTenant = async () => {
    try {
      if (!newTenant.name || !newTenant.slug) {
        alert('Nome e slug são obrigatórios');
        return;
      }

      await createTenant({
        name: newTenant.name,
        slug: newTenant.slug,
        email: newTenant.email || undefined,
        phone: newTenant.phone || undefined,
      });

      alert('Tenant criado com sucesso!');
      setShowCreateTenant(false);
      setNewTenant({ name: '', slug: '', email: '', phone: '' });
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar tenant:', error);
      alert(`Erro ao criar tenant: ${error.message}`);
    }
  };

  const handleUpdateSubscription = async (subscriptionId: string, updates: any) => {
    try {
      await updateSubscription(subscriptionId, updates);
      alert('Subscription atualizada com sucesso!');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar subscription:', error);
      alert(`Erro ao atualizar subscription: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/10 rounded-full mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-transparent border-t-emerald-400 border-r-green-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-white/80">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">🔐 Painel Master Admin</h1>
              <p className="text-sm text-white/60">Gerenciamento completo do sistema</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {(['dashboard', 'users', 'tenants', 'subscriptions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {tab === 'dashboard' && 'Dashboard'}
                {tab === 'users' && 'Usuários'}
                {tab === 'tenants' && 'Tenants'}
                {tab === 'subscriptions' && 'Assinaturas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Estatísticas Gerais</h2>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Total de Usuários</p>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Assinaturas Ativas</p>
                  <p className="text-3xl font-bold text-emerald-400">{stats.activeSubscriptions}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Trial Ativo</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.trialUsers}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Premium</p>
                  <p className="text-3xl font-bold text-emerald-400">{stats.premiumUsers}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Tenants</p>
                  <p className="text-3xl font-bold text-white">{stats.totalTenants}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Usuários</h2>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm text-white/80">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-white/80">{user.full_name || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {user.subscription ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.subscription.status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : user.subscription.status === 'trial'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {user.subscription.status}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                            Sem assinatura
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Tenants</h2>
              <button
                onClick={() => setShowCreateTenant(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Criar Tenant
              </button>
            </div>
            {showCreateTenant && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Criar Novo Tenant</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nome do Tenant"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                  <input
                    type="text"
                    placeholder="Slug (url-friendly)"
                    value={newTenant.slug}
                    onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                  <input
                    type="email"
                    placeholder="Email (opcional)"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                  <input
                    type="text"
                    placeholder="Telefone/WhatsApp (opcional)"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateTenant}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => setShowCreateTenant(false)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm text-white/80">{tenant.name}</td>
                      <td className="px-6 py-4 text-sm text-white/80 font-mono">{tenant.slug}</td>
                      <td className="px-6 py-4 text-sm text-white/80">{tenant.email || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tenant.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tenant.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => updateTenant(tenant.id, { is_active: !tenant.is_active }).then(() => loadData())}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {tenant.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Assinaturas</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Plano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm text-white/80">{sub.user?.email || sub.user_id}</td>
                      <td className="px-6 py-4 text-sm text-white/80">{sub.plan?.display_name || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sub.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : sub.status === 'trial'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleUpdateSubscription(sub.id, { 
                            status: sub.status === 'active' ? 'cancelled' : 'active' 
                          })}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {sub.status === 'active' ? 'Cancelar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

