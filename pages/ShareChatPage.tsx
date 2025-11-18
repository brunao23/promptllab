import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getPromptVersion } from '../services/supabaseService';
import { startChat, continueChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { jsPDF } from 'jspdf';

export const ShareChatPage: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [promptContent, setPromptContent] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('Agente');
  const [editingText, setEditingText] = useState('');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        
        // Extrair nome do agente da persona (se possível)
        if (version.sourceData?.persona) {
          const personaText = version.sourceData.persona;
          const personaMatch = personaText.match(/(?:eu sou (?:a|o)?|meu nome é|sou (?:a|o)?|chamo-me|me chamo)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)/i);
          if (personaMatch && personaMatch[1]) {
            setAgentName(personaMatch[1]);
          } else {
            // Tentar extrair do conteúdo do prompt como fallback
            const contentMatch = version.content.match(/(?:eu sou (?:a|o)?|meu nome é|sou (?:a|o)?|chamo-me|me chamo)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)/i);
            if (contentMatch && contentMatch[1]) {
              setAgentName(contentMatch[1]);
            }
          }
        } else {
          // Tentar extrair do conteúdo do prompt diretamente
          const contentMatch = version.content.match(/(?:eu sou (?:a|o)?|meu nome é|sou (?:a|o)?|chamo-me|me chamo)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)/i);
          if (contentMatch && contentMatch[1]) {
            setAgentName(contentMatch[1]);
          }
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

  // Scroll para o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFeedback = (index: number, feedback: 'correct' | 'incorrect') => {
    const currentMessage = messages[index];
    if (currentMessage.feedback === feedback) {
      setMessages(prev => prev.map((msg, i) => 
        i === index ? { ...msg, feedback: undefined, isEditing: false } : msg
      ));
      return;
    }

    if (feedback === 'incorrect') {
      setMessages(prev => prev.map((msg, i) => 
        i === index ? { ...msg, feedback: 'incorrect', isEditing: true } : msg
      ));
      setEditingText(currentMessage.text);
    } else {
      setMessages(prev => prev.map((msg, i) => 
        i === index ? { ...msg, feedback: 'correct', isEditing: false } : msg
      ));
    }
  };

  const handleSaveCorrection = (index: number) => {
    if (editingText.trim()) {
      setMessages(prev => prev.map((msg, i) => 
        i === index ? { ...msg, correction: editingText.trim(), isEditing: false } : msg
      ));
      setEditingText('');
    }
  };

  // Função para limpar e normalizar texto
  const cleanTextForPDF = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\{\{\s*\$now\s*\}\}/gi, new Date().toLocaleString('pt-BR'))
      .replace(/\{\{[^}]*\}\}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Função para gerar PDF do chat
  const handleDownloadChat = (format: 'txt' | 'pdf') => {
    if (messages.length === 0) return;

    const toolName = 'LaBPrompT';
    const header = `Histórico de Chat - Cliente`;
    const timestamp = `Exportado em: ${new Date().toLocaleString('pt-BR')}`;
    const versionInfo = versionId ? `Versão ID: ${versionId.substring(0, 8)}...` : '';

    if (format === 'txt') {
      const chatParts: string[] = [];
      
      chatParts.push(toolName);
      chatParts.push(header);
      chatParts.push('');
      chatParts.push(`Agente: ${agentName}`);
      chatParts.push(versionInfo);
      chatParts.push(timestamp);
      chatParts.push('');
      chatParts.push('='.repeat(50));
      chatParts.push('');

      messages.forEach((msg, index) => {
        const author = msg.author === 'user' ? 'Cliente' : agentName;
        const text = cleanTextForPDF(msg.text);
        
        chatParts.push(`${author}: ${text}`);
        
        // Adicionar feedback e correções
        if (msg.feedback === 'incorrect' && msg.correction) {
          chatParts.push(`[FEEDBACK: Resposta marcada como incorreta]`);
          chatParts.push(`[Resposta Original]: ${text}`);
          chatParts.push(`[Correção Sugerida pelo Cliente]: ${cleanTextForPDF(msg.correction)}`);
        } else if (msg.feedback === 'correct') {
          chatParts.push(`[FEEDBACK: Resposta marcada como correta ✓]`);
        }
        
        chatParts.push('');
      });

      const fullContent = chatParts.join('\n');
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historico_chat_cliente_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      let y = 20;
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFont('helvetica', 'normal');

      // Logo/Nome da ferramenta
      doc.setFontSize(24);
      doc.setTextColor(16, 185, 129);
      doc.text(toolName, margin, y);
      y += 10;

      // Linha divisória
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Cabeçalho
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(header, margin, y);
      y += 8;

      // Informações
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Agente: ${cleanTextForPDF(agentName)}`, margin, y);
      y += 6;
      if (versionInfo) {
        doc.text(versionInfo, margin, y);
        y += 6;
      }
      
      // Timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(timestamp, margin, y);
      y += 12;

      // Linha divisória
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Mensagens do chat
      doc.setFontSize(11);

      messages.forEach((msg, index) => {
        const isUser = msg.author === 'user';
        const text = cleanTextForPDF(msg.text);
        const bubbleWidth = pageWidth * 0.7;
        
        // Mensagem conversacional
        const lines = doc.splitTextToSize(text, bubbleWidth - 20);
        const lineHeight = 6;
        const padding = 8;
        const labelHeight = 5;
        let bubbleHeight = (lines.length * lineHeight) + (padding * 2) + labelHeight;
        
        // Se houver correção, adicionar espaço
        if (msg.feedback === 'incorrect' && msg.correction) {
          const correctionLines = doc.splitTextToSize(
            `[Correção]: ${cleanTextForPDF(msg.correction)}`,
            bubbleWidth - 20
          );
          bubbleHeight += (correctionLines.length * 4) + 8;
        }
        
        if (y + bubbleHeight > pageHeight - margin) {
          doc.addPage();
          y = 20;
        }

        const x = isUser ? pageWidth - bubbleWidth - margin : margin;
        
        // Cores
        const userColor = [16, 185, 129];
        const agentColor = [60, 60, 60];
        
        // Desenhar balão
        doc.setFillColor(isUser ? userColor[0] : agentColor[0], isUser ? userColor[1] : agentColor[1], isUser ? userColor[2] : agentColor[2]);
        doc.setDrawColor(isUser ? userColor[0] : agentColor[0], isUser ? userColor[1] : agentColor[1], isUser ? userColor[2] : agentColor[2]);
        doc.roundedRect(x, y, bubbleWidth, bubbleHeight, 3, 3, 'FD');
        
        // Label do autor
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255, 80);
        const authorLabel = isUser ? 'Cliente' : agentName;
        doc.text(authorLabel, x + padding, y + padding + labelHeight);
        
        // Texto da mensagem
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(lines, x + padding, y + padding + labelHeight + lineHeight);
        
        let textY = y + padding + labelHeight + lineHeight + (lines.length * lineHeight) + 4;
        
        // Feedback e correção
        if (msg.feedback === 'incorrect' && msg.correction) {
          doc.setFontSize(9);
          doc.setTextColor(255, 100, 100);
          doc.text('[Feedback: Incorreto]', x + padding, textY);
          textY += 6;
          
          const correctionText = cleanTextForPDF(msg.correction);
          const correctionLines = doc.splitTextToSize(`Correção: ${correctionText}`, bubbleWidth - 20);
          doc.setTextColor(100, 255, 100);
          doc.text(correctionLines, x + padding, textY);
        } else if (msg.feedback === 'correct') {
          doc.setFontSize(9);
          doc.setTextColor(100, 255, 100);
          doc.text('[Feedback: Correto ✓]', x + padding, textY);
        }
        
        y += bubbleHeight + 8;
      });

      doc.save(`historico_chat_cliente_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    
    setIsDownloadOpen(false);
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
          {messages.length > 0 && (
            <div className="relative" ref={downloadRef}>
              <button
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Baixar</span>
              </button>
              {isDownloadOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-black/90 border border-white/20 rounded-lg shadow-xl z-10 backdrop-blur-sm">
                  <button
                    onClick={() => handleDownloadChat('txt')}
                    className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    Baixar TXT
                  </button>
                  <button
                    onClick={() => handleDownloadChat('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    Baixar PDF
                  </button>
                </div>
              )}
            </div>
          )}
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
                className={`flex flex-col ${msg.author === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.author === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/10 text-white/80'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.correction && msg.feedback === 'incorrect' ? msg.correction : msg.text}
                  </p>
                  {msg.correction && msg.feedback === 'incorrect' && (
                    <p className="text-xs text-white/60 mt-2 line-through italic">
                      Resposta original: {msg.text.substring(0, 100)}...
                    </p>
                  )}
                </div>
                
                {/* Feedback e edição para mensagens do agente */}
                {msg.author === 'agent' && (
                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() => handleFeedback(index, 'correct')}
                      title="Resposta correta"
                      className={`p-1.5 rounded-full transition-colors ${
                        msg.feedback === 'correct'
                          ? 'bg-green-500/30 text-green-400'
                          : 'text-white/40 hover:text-green-400 hover:bg-white/10'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleFeedback(index, 'incorrect')}
                      title="Resposta incorreta"
                      className={`p-1.5 rounded-full transition-colors ${
                        msg.feedback === 'incorrect'
                          ? 'bg-red-500/30 text-red-400'
                          : 'text-white/40 hover:text-red-400 hover:bg-white/10'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Área de edição para correções */}
                {msg.author === 'agent' && msg.feedback === 'incorrect' && msg.isEditing && (
                  <div className="mt-3 w-full max-w-[80%]">
                    <label className="block text-xs text-white/60 mb-2">
                      Corrija a resposta do agente:
                    </label>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      rows={3}
                      placeholder="Digite a resposta correta..."
                    />
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleSaveCorrection(index)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
                      >
                        Salvar Correção
                      </button>
                      <button
                        onClick={() => setMessages(prev => prev.map((m, i) => 
                          i === index ? { ...m, isEditing: false } : m
                        ))}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Exibir correção salva */}
                {msg.author === 'agent' && msg.feedback === 'incorrect' && msg.correction && !msg.isEditing && (
                  <div className="mt-2 p-3 bg-emerald-900/20 border border-emerald-700/50 rounded-lg max-w-[80%]">
                    <p className="text-xs text-emerald-300 mb-1">✓ Correção salva</p>
                    <p className="text-sm text-white/80">{msg.correction}</p>
                  </div>
                )}
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
          <div ref={messagesEndRef} />
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

