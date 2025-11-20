'use client';

import { Suspense } from 'react';
import { PromptManager } from '@/components/PromptManager';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Carregando...</div>}>
      <PromptManager />
    </Suspense>
  );
}

