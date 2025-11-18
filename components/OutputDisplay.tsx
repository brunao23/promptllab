
import React, { useState } from 'react';
// FIX: Corrected import path for types.
import type { PromptVersion, OutputFormat } from '../types';

interface OutputDisplayProps {
  version: PromptVersion | null;
  isLoading: boolean;
  error: string | null;
  isValidated: boolean;
  onValidate: (id: string) => void;
  onExplain: (content: string) => void;
}

const fileExtensions: Record<OutputFormat, string> = {
    json: 'json',
    markdown: 'md',
    text: 'txt',
    xml: 'xml',
    yaml: 'yaml',
};

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ version, isLoading, error, isValidated, onValidate, onExplain }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [shareLink, setShareLink] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [canShareChat, setCanShareChat] = useState(false);
  const [planInfo, setPlanInfo] = useState<any>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const canShare = await checkAccess('share_chat');
      setCanShareChat(canShare);
      const info = await getCurrentPlanInfo();
      setPlanInfo(info);
    };
    checkPermissions();
  }, []);

  // Debug: Log quando version muda
  React.useEffect(() => {
    console.log('📄 [OutputDisplay] Versão recebida:', {
      hasVersion: !!version,
      hasId: !!version?.id,
      hasContent: !!version?.content,
      contentLength: version?.content?.length || 0,
    });
  }, [version]);

  // O prompt sempre é texto/markdown, independentemente do formato de saída alvo.
  const formattedContent = version?.content || '';

  const charCount = formattedContent.length;
  const tokenCount = Math.round(charCount / 4);

  const handleCopy = () => {
    if (!formattedContent) return;
    navigator.clipboard.writeText(formattedContent).then(() => {
      setCopySuccess('Copiado!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
      setCopySuccess('Falha.');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleDownload = () => {
    if (!version || !formattedContent) return;
    const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    // Sempre baixa como .md ou .txt pois é o PROMPT, não a saída final.
    link.href = url;
    link.download = `prompt_v${version.version}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!version) return;
    
    // Importar função de verificação dinamicamente para evitar dependência circular
    const { canShareChat } = await import('../services/subscriptionService');
    const shareCheck = await canShareChat();
    
    if (!shareCheck.allowed) {
      alert(shareCheck.reason || 'Compartilhamento não disponível no seu plano');
      return;
    }
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/chat/${version.id}`;
    setShareLink(shareUrl);
    setShowShareModal(true);
  };

  const handleCopyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopySuccess('Link copiado!');
      setTimeout(() => {
        setCopySuccess('');
        setShowShareModal(false);
      }, 2000);
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center z-10">
          <svg className="animate-spin h-10 w-10 text-emerald-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-lg text-white/80">Gerando prompt...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="m-4 text-red-400 p-4 bg-red-900 bg-opacity-50 rounded-md">
          <h3 className="font-bold">Erro na Operação</h3>
          <p>{error}</p>
        </div>
      );
    }
    if (!version) {
        return <div className="flex items-center justify-center h-full text-white/40">Aguardando a geração do prompt...</div>
    }
    return (
      <>
      <div className="flex justify-between items-center border-b border-white/10 p-3 flex-shrink-0">
          <div className="flex items-center space-x-4">
              <div>
                  <h2 className="text-lg font-bold text-emerald-400">
                    Versão {version.version} 
                    <span className="text-xs font-normal text-white/60 ml-2 px-2 py-0.5 bg-white/10 rounded-full">
                      Alvo: {version.format.toUpperCase()}
                    </span>
                  </h2>
                  <p className="text-xs text-white/40">{version.timestamp}</p>
              </div>
              {isValidated ? (
                 <div className="flex items-center space-x-2 bg-green-500/10 text-green-400 text-sm font-semibold px-3 py-1 rounded-full">
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a.75.75 0 00-1.06-1.06L9 10.94l-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l3.75-3.75z" clipRule="evenodd" /></svg>
                    <span>Prompt Validado</span>
                 </div>
              ) : (
                <button onClick={() => onValidate(version.id)} className="bg-green-600/80 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg transition text-sm">Validar Prompt</button>
              )}
          </div>
          <div className="flex items-center space-x-3">
              <div className="text-right">
                  <p className="text-sm font-medium text-white/80">{charCount.toLocaleString('pt-BR')} <span className="text-xs text-white/40">chars</span></p>
                  <p className="text-sm font-medium text-white/80">~{tokenCount.toLocaleString('pt-BR')} <span className="text-xs text-white/40">tokens</span></p>
              </div>
              <button onClick={() => onExplain(formattedContent)} disabled={!formattedContent} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-lg transition text-sm">Explicar</button>
              <button onClick={handleCopy} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-lg transition text-sm">{copySuccess || 'Copiar'}</button>
              <button onClick={handleDownload} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-lg transition text-sm">Baixar</button>
              <button 
                onClick={canShareChat ? handleShare : () => alert('Compartilhar chat não está disponível no plano Trial. Upgrade para Premium para acessar este recurso.')} 
                disabled={!version || !canShareChat} 
                className={`${canShareChat ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-white/10 text-white/40 cursor-not-allowed'} text-white font-bold py-2 px-3 rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1`}
                title={!canShareChat ? 'Compartilhar chat não disponível no Trial. Upgrade para Premium.' : 'Compartilhar chat'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Compartilhar</span>
              </button>
          </div>
      </div>
      
      {/* Modal de Compartilhamento */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div className="bg-black/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl w-full max-w-md border border-white/10 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Compartilhar Chat</h3>
              <button onClick={() => setShowShareModal(false)} className="text-white/60 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Compartilhe este link para que clientes testem o chat com esta versão do prompt:
            </p>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm"
              />
              <button
                onClick={handleCopyShareLink}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition text-sm"
              >
                {copySuccess ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-3">
              <p className="text-emerald-300 text-xs">
                💡 <strong>Dica:</strong> O link abrirá uma nova aba com o chat conversacional. O cliente poderá interagir com o agente usando esta versão do prompt.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex-grow p-4 overflow-auto font-mono">
          <pre className="text-sm text-white/80 whitespace-pre-wrap break-all">
              <code>{formattedContent}</code>
          </pre>
      </div>
      </>
    )
  }

  return (
    <div className="bg-white/5 rounded-lg h-full flex flex-col relative">
      {renderContent()}
    </div>
  );
};
