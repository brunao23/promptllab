import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';
import { getCurrentSubscription } from '../services/subscriptionService';

export const DiagnosticPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<{
    hasSession: boolean;
    userId: string | null;
    hasSubscription: boolean;
    subscriptionData: any;
    error: string | null;
  }>({
    hasSession: false,
    userId: null,
    hasSubscription: false,
    subscriptionData: null,
    error: null,
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // Verificar sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setDiagnostics(prev => ({ ...prev, error: `Erro de sessão: ${sessionError.message}` }));
          return;
        }

        if (!session?.user) {
          setDiagnostics(prev => ({ ...prev, error: 'Nenhuma sessão ativa' }));
          return;
        }

        const userId = session.user.id;
        console.log('🔍 [DiagnosticPanel] User ID:', userId);

        // Verificar subscription diretamente
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*, plan:plans(*)')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          console.error('❌ [DiagnosticPanel] Erro ao buscar subscription:', subscriptionError);
          setDiagnostics(prev => ({
            ...prev,
            hasSession: true,
            userId,
            error: `Erro ao buscar subscription: ${subscriptionError.message}`,
          }));
          return;
        }

        console.log('📋 [DiagnosticPanel] Subscription data:', subscriptionData);

        setDiagnostics({
          hasSession: true,
          userId,
          hasSubscription: !!subscriptionData,
          subscriptionData,
          error: null,
        });
      } catch (error: any) {
        console.error('❌ [DiagnosticPanel] Erro nos diagnósticos:', error);
        setDiagnostics(prev => ({
          ...prev,
          error: error.message || 'Erro desconhecido',
        }));
      }
    };

    runDiagnostics();
  }, []);

  if (!diagnostics.hasSession) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
        <p className="text-red-400 font-semibold">⚠️ Nenhuma sessão ativa</p>
        <p className="text-red-300 text-sm mt-1">{diagnostics.error}</p>
      </div>
    );
  }

  if (diagnostics.error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
        <p className="text-red-400 font-semibold">❌ Erro nos Diagnósticos</p>
        <p className="text-red-300 text-sm mt-1">{diagnostics.error}</p>
        <p className="text-white/60 text-xs mt-2">User ID: {diagnostics.userId}</p>
      </div>
    );
  }

  if (!diagnostics.hasSubscription) {
    return (
      <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-4">
        <p className="text-amber-400 font-semibold">⚠️ Nenhuma Subscription Encontrada</p>
        <p className="text-white/80 text-sm mt-2">
          Você não possui uma subscription ativa. Isso pode acontecer se:
        </p>
        <ul className="text-white/60 text-xs mt-2 list-disc list-inside space-y-1">
          <li>O trigger `on_auth_user_created` não foi executado</li>
          <li>A subscription foi deletada ou desativada</li>
          <li>Você precisa criar uma subscription manualmente</li>
        </ul>
        <p className="text-white/60 text-xs mt-3">
          <strong>Solução:</strong> Execute o script <code className="bg-white/10 px-1 rounded">VERIFICAR_SUBSCRIPTIONS.sql</code> no Supabase SQL Editor.
        </p>
        <p className="text-white/60 text-xs mt-1">
          User ID: <code className="bg-white/10 px-1 rounded">{diagnostics.userId}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 mb-4">
      <p className="text-emerald-400 font-semibold">✅ Subscription Encontrada</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-white/80">
          <strong>Status:</strong> {diagnostics.subscriptionData?.status || 'N/A'}
        </p>
        <p className="text-white/80">
          <strong>Plano:</strong> {diagnostics.subscriptionData?.plan?.display_name || 'N/A'}
        </p>
        {diagnostics.subscriptionData?.trial_ends_at && (
          <p className="text-white/80">
            <strong>Trial termina em:</strong>{' '}
            {new Date(diagnostics.subscriptionData.trial_ends_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    </div>
  );
};

