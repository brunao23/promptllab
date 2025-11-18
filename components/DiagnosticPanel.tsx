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

        if (subscriptionError) {
          // Se for erro de política RLS (recursão infinita), mostrar erro específico
          if (subscriptionError.message?.includes('infinite recursion') || 
              subscriptionError.message?.includes('recursion') ||
              subscriptionError.code === '42P17') {
            console.error('❌ [DiagnosticPanel] Erro de recursão infinita nas políticas RLS:', subscriptionError);
            setDiagnostics(prev => ({
              ...prev,
              hasSession: true,
              userId,
              error: `Erro ao buscar subscription: infinite recursion detected in policy for relation "admin_users". Execute o script CORRIGIR_RLS_ADMIN_USERS.sql no Supabase SQL Editor para corrigir.`,
            }));
            return;
          }
          
          // Outros erros (exceto "não encontrado")
          if (subscriptionError.code !== 'PGRST116') {
            console.error('❌ [DiagnosticPanel] Erro ao buscar subscription:', subscriptionError);
            setDiagnostics(prev => ({
              ...prev,
              hasSession: true,
              userId,
              error: `Erro ao buscar subscription: ${subscriptionError.message}`,
            }));
            return;
          }
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
    const isRLSError = diagnostics.error.includes('infinite recursion');
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-red-400 font-semibold mb-2">❌ Erro nos Diagnósticos</p>
            <p className="text-red-300 text-sm mb-2">{diagnostics.error}</p>
            {isRLSError && (
              <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/80 text-xs font-semibold mb-2">🔧 Como corrigir:</p>
                <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
                  <li>Acesse o Supabase Dashboard: https://supabase.com/dashboard</li>
                  <li>Vá em SQL Editor → New query</li>
                  <li>Copie o conteúdo do arquivo <code className="bg-white/10 px-1 rounded">CORRIGIR_RLS_ADMIN_USERS.sql</code></li>
                  <li>Cole e execute (Ctrl+Enter ou Cmd+Enter)</li>
                  <li>Recarregue esta página</li>
                </ol>
              </div>
            )}
            <p className="text-white/40 text-xs mt-3">User ID: <code className="bg-white/10 px-1 rounded">{diagnostics.userId}</code></p>
          </div>
        </div>
      </div>
    );
  }

  if (!diagnostics.hasSubscription) {
    return (
      <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-amber-400 font-semibold mb-2">⚠️ Nenhuma Subscription Encontrada</p>
            <p className="text-white/80 text-sm mb-2">
              Você não possui uma subscription ativa. Isso pode acontecer se:
            </p>
            <ul className="text-white/60 text-xs mb-3 list-disc list-inside space-y-1">
              <li>O trigger `on_auth_user_created` não foi executado</li>
              <li>A subscription foi deletada ou desativada</li>
              <li>Você precisa criar uma subscription manualmente</li>
            </ul>
            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/80 text-xs font-semibold mb-2">🔧 Solução:</p>
              <p className="text-white/60 text-xs mb-2">
                Execute o script <code className="bg-white/10 px-1 rounded">VERIFICAR_SUBSCRIPTIONS.sql</code> ou <code className="bg-white/10 px-1 rounded">CORRIGIR_SAAS_COMPLETO.sql</code> no Supabase SQL Editor.
              </p>
            </div>
            <p className="text-white/40 text-xs mt-3">
              User ID: <code className="bg-white/10 px-1 rounded">{diagnostics.userId}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se está tudo OK, não mostrar (ou mostrar apenas em modo debug)
  // Retornar null para não ocupar espaço quando tudo está funcionando
  return null;
  
  // Se quiser mostrar mesmo quando está OK (modo debug), descomente abaixo:
  /*
  return (
    <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 mb-4">
      <div className="flex items-start space-x-3">
        <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-emerald-400 font-semibold mb-2">✅ Subscription Encontrada</p>
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
      </div>
    </div>
  );
  */
};

