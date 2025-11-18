import React from 'react';
import type { VariavelDinamica } from '../types';

interface VariavelDinamicaItemProps {
  variavel: VariavelDinamica;
  onUpdate: (id: string, field: 'chave' | 'valor', value: string) => void;
  onRemove: (id: string) => void;
}

export const VariavelDinamicaItem: React.FC<VariavelDinamicaItemProps> = ({ variavel, onUpdate, onRemove }) => {
  const baseInputClasses = "w-full p-2 bg-white/5 border border-white/10 rounded-md text-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  return (
    <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2 relative">
       <button 
        onClick={() => onRemove(variavel.id)} 
        className="absolute top-2 right-2 text-white/40 hover:text-red-400 transition-colors"
        title="Remover Variável"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/60 mb-1">Chave</label>
          <input
            type="text"
            value={variavel.chave}
            onChange={(e) => onUpdate(variavel.id, 'chave', e.target.value)}
            className={baseInputClasses}
            placeholder="ex: NOME_CLIENTE"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/60 mb-1">Valor</label>
           <input
            type="text"
            value={variavel.valor}
            onChange={(e) => onUpdate(variavel.id, 'valor', e.target.value)}
            className={baseInputClasses}
            placeholder="ex: João"
          />
        </div>
      </div>
    </div>
  );
};