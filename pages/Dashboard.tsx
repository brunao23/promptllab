import React from 'react';
import { Header } from '../components/Header';
import { PromptManager } from '../components/PromptManager';

export const Dashboard: React.FC = () => {
  return (
    <div className="bg-slate-900 h-screen w-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-grow overflow-hidden">
        <PromptManager />
      </div>
    </div>
  );
};

