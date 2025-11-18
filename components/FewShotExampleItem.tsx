import React from 'react';
// FIX: Corrected import path for types.
import type { FewShotExample } from '../types';

interface FewShotExampleItemProps {
  example: FewShotExample;
  onUpdate: (id: string, field: 'user' | 'agent', value: string) => void;
  onRemove: (id: string) => void;
}

export const FewShotExampleItem: React.FC<FewShotExampleItemProps> = ({ example, onUpdate, onRemove }) => {
  const baseInputClasses = "w-full p-2 bg-white/5 border border-white/10 rounded-md text-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  return (
    <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2 relative">
       <button 
        onClick={() => onRemove(example.id)} 
        className="absolute top-2 right-2 text-white/40 hover:text-red-400 transition-colors"
        title="Remover Exemplo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">Usuário:</label>
        <textarea
          value={example.user}
          onChange={(e) => onUpdate(example.id, 'user', e.target.value)}
          rows={2}
          className={baseInputClasses}
          placeholder="Ex: Qual o preço do plano Pro?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Agente:</label>
        <textarea
          value={example.agent}
          onChange={(e) => onUpdate(example.id, 'agent', e.target.value)}
          rows={3}
          className={baseInputClasses}
          placeholder="Ex: O plano Pro custa $29/mês e inclui todos os recursos avançados."
        />
      </div>
    </div>
  );
};