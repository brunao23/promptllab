import React, { useEffect, useState } from 'react';
import { getCurrentPlanInfo, getCurrentMonthUsage, getCurrentMonthVersions } from '../services/subscriptionService';

export const SubscriptionInfo: React.FC = () => {
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    displayName: string;
    isTrial: boolean;
    trialDaysLeft: number | null;
    canShareChat: boolean;
    maxVersions: number;
    maxTokens: number;
  } | null>(null);
  const [usage, setUsage] = useState<{
    tokensUsed: number;
    tokensLimit: number;
    percentage: number;
  } | null>(null);
  const [versions, setVersions] = useState<{
    versionsCount: number;
    versionsLimit: number;
    canCreateMore: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      try {
        console.log('🔍 [SubscriptionInfo] Carregando informações da assinatura...');
        const [plan, tokenUsage, versionInfo] = await Promise.all([
          getCurrentPlanInfo(),
          getCurrentMonthUsage(),
          getCurrentMonthVersions(),
        ]);
        console.log('📋 [SubscriptionInfo] Plano:', plan);
        console.log('📊 [SubscriptionInfo] Uso:', tokenUsage);
        console.log('📝 [SubscriptionInfo] Versões:', versionInfo);
        
        setPlanInfo(plan);
        setUsage(tokenUsage);
        setVersions(versionInfo);
        
        if (!plan) {
          console.warn('⚠️ [SubscriptionInfo] Nenhuma informação de plano encontrada. Usando valores padrão do trial.');
          console.warn('💡 [SubscriptionInfo] Execute o script CORRIGIR_SAAS_COMPLETO.sql no Supabase SQL Editor.');
        }
      } catch (error: any) {
        console.error('❌ [SubscriptionInfo] Erro ao carregar informações da assinatura:', error);
        console.error('❌ [SubscriptionInfo] Erro detalhado:', error.message, error.stack);
        // Mesmo com erro, definir como não carregando para mostrar fallback
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptionInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Se não há informações, mostrar card com informações padrão do trial
  if (!planInfo || !usage || !versions) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-white font-bold text-base">Trial Grátis</h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-400 text-xs font-bold">
                TRIAL
              </span>
            </div>
            <p className="text-emerald-400 text-sm font-medium mt-1">
              ⏰ 7 dias restantes
            </p>
          </div>
        </div>

        {/* Tokens Usage */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-xs">Tokens do Mês</span>
            <span className="text-white/80 text-xs font-medium">
              0 / 1.000.000 tokens/mês
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="h-2 rounded-full transition-all bg-emerald-500" style={{ width: '0%' }}></div>
          </div>
        </div>

        {/* Versions Usage */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-xs">Versões do Mês</span>
            <span className="text-white/80 text-xs font-medium">
              0 / Máx. 4 versões/mês
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="h-2 rounded-full transition-all bg-emerald-500" style={{ width: '0%' }}></div>
          </div>
        </div>

        {/* Features */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">Compartilhar Chat</span>
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const tokensLimitText =
    planInfo.maxTokens === -1
      ? 'Ilimitado'
      : `${planInfo.maxTokens.toLocaleString('pt-BR')} tokens/mês`;
  const versionsLimitText =
    planInfo.maxVersions === -1 ? 'Ilimitado' : `Máx. ${planInfo.maxVersions} versões/mês`;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-white/10 shadow-xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-white/10 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1 flex-wrap">
            <h3 className="text-white font-bold text-sm sm:text-base truncate">{planInfo.displayName}</h3>
            {planInfo.isTrial && (
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-400 text-xs font-bold">
                TRIAL
              </span>
            )}
          </div>
          {planInfo.isTrial && planInfo.trialDaysLeft !== null && (
            <p className="text-emerald-400 text-xs sm:text-sm font-medium mt-1">
              ⏰ {planInfo.trialDaysLeft} {planInfo.trialDaysLeft === 1 ? 'dia' : 'dias'} restantes
            </p>
          )}
          {!planInfo.isTrial && (
            <p className="text-white/60 text-xs mt-1">Plano ativo</p>
          )}
        </div>
        {!planInfo.isTrial && (
          <a
            href="https://wa.me/5511999999999?text=Olá! Gostaria de fazer upgrade do meu plano."
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 underline whitespace-nowrap flex-shrink-0"
          >
            Upgrade
          </a>
        )}
      </div>

      {/* Tokens Usage */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/60 text-xs">Tokens do Mês</span>
          <span className="text-white/80 text-xs font-medium">
            {usage.tokensUsed.toLocaleString('pt-BR')} / {tokensLimitText}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usage.percentage >= 90
                ? 'bg-red-500'
                : usage.percentage >= 70
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(usage.percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Versions Usage */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/60 text-xs">Versões do Mês</span>
          <span className="text-white/80 text-xs font-medium">
            {versions.versionsCount} / {versionsLimitText}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              !versions.canCreateMore
                ? 'bg-red-500'
                : versions.versionsCount / (planInfo.maxVersions || 1) >= 0.75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{
              width: `${
                planInfo.maxVersions === -1
                  ? 0
                  : Math.min((versions.versionsCount / planInfo.maxVersions) * 100, 100)
              }%`,
            }}
          ></div>
        </div>
        {!versions.canCreateMore && planInfo.maxVersions !== -1 && (
          <p className="text-red-400 text-xs mt-1">
            Limite atingido. Faça upgrade para criar mais versões.
          </p>
        )}
      </div>

      {/* Features */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs">Compartilhar Chat</span>
          {planInfo.canShareChat ? (
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

