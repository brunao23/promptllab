import React from 'react';
import type { Ferramenta } from '../types';

interface FerramentaItemProps {
  ferramenta: Ferramenta;
  onUpdate: (id: string, field: 'nome' | 'descricao', value: string) => void;
  onRemove: (id: string) => void;
}

export const FerramentaItem: React.FC<FerramentaItemProps> = ({ ferramenta, onUpdate, onRemove }) => {
  const baseInputClasses = "w-full p-2 bg-white/5 border border-white/10 rounded-md text-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm";
  return (
    <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2 relative">
       <button 
        onClick={() => onRemove(ferramenta.id)} 
        className="absolute top-2 right-2 text-white/40 hover:text-red-400 transition-colors"
        title="Remover Ferramenta"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">Nome da Ferramenta</label>
        <input
            type="text"
            value={ferramenta.nome}
            onChange={(e) => onUpdate(ferramenta.id, 'nome', e.target.value)}
            className={baseInputClasses}
            placeholder="ex: buscar_pedido"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
        <textarea
          value={ferramenta.descricao}
          onChange={(e) => onUpdate(ferramenta.id, 'descricao', e.target.value)}
          rows={2}
          className={baseInputClasses}
          placeholder="ex: Busca os detalhes de um pedido pelo número de identificação."
        />
      </div>
    </div>
  );
};