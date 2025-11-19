'use client';

import React, { useState } from 'react';
// FIX: Corrected import path for types.
import type { Fluxo } from '../types';

interface FluxoItemProps {
    fluxo: Fluxo;
    onUpdate: (id: string, updatedFluxo: Partial<Fluxo>) => void;
    onRemove: (id: string) => void;
}

export const FluxoItem: React.FC<FluxoItemProps> = ({ fluxo, onUpdate, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleChange = (field: keyof Fluxo, value: string | boolean) => {
        onUpdate(fluxo.id, { [field]: value });
    };

    const baseInputClasses = "w-full text-sm p-1 bg-white/5 border border-white/10 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500";

    return (
        <div className="border border-white/10 rounded-lg">
            <div className="bg-white/10 p-2 flex justify-between items-center">
                <input 
                    type="text"
                    value={fluxo.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className="bg-transparent font-semibold text-white w-full focus:outline-none"
                />
                <div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-white/60 hover:text-white">
                         <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button onClick={() => onRemove(fluxo.id)} className="p-1 text-red-400 hover:text-red-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="p-3 space-y-3 bg-white/5">
                     <div>
                        <label className="text-xs text-white/60">Tipo</label>
                        <input type="text" value={fluxo.tipoPrompt} onChange={(e) => handleChange('tipoPrompt', e.target.value)} className={baseInputClasses} />
                    </div>
                     <div>
                        <label className="text-xs text-white/60">Objetivo</label>
                        <input type="text" value={fluxo.objetivo} onChange={(e) => handleChange('objetivo', e.target.value)} className={baseInputClasses} />
                    </div>
                    <div>
                        <label className="text-xs text-white/60">Base de Conhecimento (RAG)</label>
                        <textarea value={fluxo.baseConhecimentoRAG} onChange={(e) => handleChange('baseConhecimentoRAG', e.target.value)} rows={2} className={baseInputClasses} />
                    </div>
                    <div>
                        <label className="text-xs text-white/60">Exemplos (Few-Shot)</label>
                        <textarea 
                            value={fluxo.fewShotExamples} 
                            onChange={(e) => handleChange('fewShotExamples', e.target.value)} 
                            rows={4} 
                            className={baseInputClasses}
                            placeholder="Usuário: ...&#10;Agente: ..."
                        />
                    </div>
                    <div className="flex items-center justify-between">
                         <label className="flex items-center space-x-2 text-sm text-white/80">
                             <input type="checkbox" checked={fluxo.reforcarCoT} onChange={(e) => handleChange('reforcarCoT', e.target.checked)} className="form-checkbox h-4 w-4 text-emerald-500 bg-white/5 border-white/10 rounded focus:ring-emerald-500" />
                             <span>Reforçar CoT</span>
                         </label>
                         <label className="flex items-center space-x-2 text-sm text-white/80">
                             <input type="checkbox" checked={fluxo.ativarGuardrails} onChange={(e) => handleChange('ativarGuardrails', e.target.checked)} className="form-checkbox h-4 w-4 text-emerald-500 bg-white/5 border-white/10 rounded focus:ring-emerald-500" />
                             <span>Guardrails</span>
                         </label>
                    </div>
                </div>
            )}
        </div>
    );
};