import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPromptVersion } from '../services/supabaseService';
import { startChat, continueChat } from '../services/geminiService';
import type { ChatMessage } from '../types';

export const ShareChatPage: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [promptContent, setPromptContent] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('Agente');

  useEffect(() => {
    const loadVersion = async () => {
      if (!versionId) {
        setError('ID da versão não fornecido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Buscar versão do prompt
        const version = await getPromptVersion(versionId);
        
        if (!version || !version.content) {
          setError('Versão do prompt não encontrada ou inválida');
          setIsLoading(false);
          return;
        }

        setPromptContent(version.content);
        
        // Extrair nome do agente do prompt (se possível)
        const personaMatch = version.content.match(/(?:eu sou (?:a|o)?|meu nome é|sou (?:a|o)?|chamo-me|me chamo)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)/i);
        if (personaMatch && personaMatch[1]) {
          setAgentName(personaMatch[1]);
        }

        // Inicializar chat
        await startChat(version.content);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Erro ao carregar versão:', err);
        setError(err.message || 'Erro ao carregar o chat. Verifique se o link está correto.');
        setIsLoading(false);
      }
    };

    loadVersion();
  }, [versionId]);

  const handleSend = async () => {
    if (!input.trim() || isSending || !promptContent) return;

    const userMessage: ChatMessage = { author: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await continueChat(input.trim(), promptContent);
      const agentMessage: ChatMessage = { author: 'agent', text: response };
      setMessages(prev => [...prev, agentMessage]);
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      const errorMessage: ChatMessage = { 
        author: 'agent', 
        text: `Erro: ${err.message || 'Não foi possível processar sua mensagem. Tente novamente.'}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-emerald-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white/80">Carregando chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-6">
            <p className="text-red-300 font-medium mb-2">⚠️ Erro</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-sm border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">LaBPrompT</h1>
              <p className="text-white/60 text-xs">Chat com {agentName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-white/80 text-lg mb-2">Olá! 👋</p>
              <p className="text-white/60 text-sm">Comece a conversar com {agentName}</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.author === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/10 text-white/80'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isSending}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

