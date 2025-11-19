'use client';

import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface AssistantPanelProps {
    messages: ChatMessage[];
    isRecording: boolean;
    onToggleRecording: () => void;
    isAssistantLoading: boolean;
    error: string | null;
    isApiKeySelected: boolean;
    onSelectKey: () => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ 
    messages, 
    isRecording, 
    onToggleRecording,
    isAssistantLoading,
    error,
    isApiKeySelected,
    onSelectKey
}) => {
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    if (!isApiKeySelected) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                <svg className="w-16 h-16 text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-6 0H7a2 2 0 01-2-2V9a2 2 0 012-2h2m-6 0V7a2 2 0 012-2h2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6" /></svg>
                <h3 className="text-lg font-semibold text-white/80">Requer Chave de API</h3>
                <p className="text-sm text-white/60 mt-2 max-w-sm">
                    Para usar o assistente de IA por voz, é necessário selecionar uma chave de API para cobrir os custos de uso.
                </p>
                <button 
                    onClick={onSelectKey}
                    className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Selecionar Chave de API
                </button>
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-white/40 hover:text-white/60 underline">
                    Saiba mais sobre o faturamento
                </a>
                {error && <p className="text-sm text-red-400 text-center mt-4">{error}</p>}
            </div>
        );
    }

    return (
        <div className="p-4 h-full flex flex-col space-y-4">
             <div>
                <h3 className="text-lg font-semibold text-white/80">Assistente</h3>
                <p className="text-sm text-white/60 mt-1">Use a voz para preencher o formulário à esquerda.</p>
            </div>
            <div className="flex-grow bg-white/5 rounded-lg p-2 flex flex-col space-y-2 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-3 py-2 max-w-xs lg:max-w-md ${
                            msg.author === 'user' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/80'
                        }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 {messages.length === 0 && !isRecording && !isAssistantLoading && (
                    <div className="flex-grow flex items-center justify-center text-white/40 text-center px-4">
                       Pressione o microfone para gravar um comando e preencher o formulário.
                    </div>
                 )}
                 {isAssistantLoading && (
                    <div className="flex justify-start">
                        <div className="rounded-lg px-3 py-2 bg-white/10 text-white/80">
                           <span className="animate-pulse">Processando...</span>
                        </div>
                   </div>
                 )}
                <div ref={messagesEndRef} />
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            
            <div className="flex flex-col space-y-2 items-center pt-2">
                 <button
                    onClick={onToggleRecording}
                    disabled={isAssistantLoading}
                    className={`p-4 rounded-full transition-colors disabled:bg-white/20 disabled:cursor-not-allowed ${
                        isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
                <p className="text-xs text-white/60 h-4">
                    {isAssistantLoading ? "Processando áudio..." : (isRecording ? "Gravando... Pressione para parar." : "Pressione para gravar.")}
                </p>
            </div>
        </div>
    );
};