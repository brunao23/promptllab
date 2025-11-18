import React, { useEffect, useState } from 'react';
import { getCurrentPlanInfo } from '../services/subscriptionService';

export const TrialBanner: React.FC = () => {
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    displayName: string;
    isTrial: boolean;
    trialDaysLeft: number | null;
    canShareChat: boolean;
    maxVersions: number;
    maxTokens: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlanInfo = async () => {
      try {
        const info = await getCurrentPlanInfo();
        setPlanInfo(info);
      } catch (error) {
        console.error('Erro ao carregar informações do plano:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlanInfo();
  }, []);

  if (isLoading || !planInfo) {
    return null;
  }

  // Mostrar banner apenas durante o trial
  if (!planInfo.isTrial || !planInfo.trialDaysLeft) {
    return null;
  }

  const daysLeft = planInfo.trialDaysLeft;
  const isWarning = daysLeft <= 3;
  const isCritical = daysLeft === 1;

  return (
    <div
      className={`w-full px-4 py-3 mb-4 rounded-lg border ${
        isCritical
          ? 'bg-red-500/20 border-red-500/50'
          : isWarning
          ? 'bg-amber-500/20 border-amber-500/50'
          : 'bg-emerald-500/20 border-emerald-500/50'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          {isCritical ? (
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : isWarning ? (
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          )}
          <div>
            <p
              className={`font-semibold ${
                isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isCritical
                ? '⚠️ Último dia do seu trial grátis!'
                : isWarning
                ? `⏰ Seu trial grátis expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`
                : `🎉 Você está no trial grátis! ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} restantes`}
            </p>
            <p className="text-white/60 text-sm mt-1">
              {planInfo.displayName} • Teste completo da plataforma
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/5511999999999?text=Olá! Gostaria de fazer upgrade do meu plano."
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          Fazer Upgrade
        </a>
      </div>
    </div>
  );
};

