'use client';

import React, { useState } from 'react';

interface PasteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (text: string) => void;
}

export const PasteModal: React.FC<PasteModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [text, setText] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (text.trim()) {
            onConfirm(text);
            setText('');
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-black/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl w-full max-w-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight">Colar Prompt Existente</h3>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-sm text-white/60 mb-3">Cole abaixo o texto do prompt que você deseja testar ou otimizar.</p>
                <label htmlFor="paste-prompt-textarea" className="sr-only">Cole o texto do prompt aqui</label>
                <textarea
                    id="paste-prompt-textarea"
                    className="w-full h-64 p-4 bg-white/5 text-white/80 border border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="Cole seu prompt aqui..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    autoFocus
                    aria-label="Campo para colar o texto do prompt"
                />
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors font-medium">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!text.trim()}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <span>Carregar Prompt</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
