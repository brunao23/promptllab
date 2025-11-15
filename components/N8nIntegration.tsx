import React, { useState, useEffect } from 'react';
import type { N8nWorkflow, N8nNode } from '../types';
import { fetchWorkflows, fetchWorkflowDetails, updateNodeParameter } from '../services/n8nService';

interface N8nConfig {
    url: string;
    apiKey: string;
}

interface N8nIntegrationProps {
    config: N8nConfig;
    setConfig: React.Dispatch<React.SetStateAction<N8nConfig>>;
    promptContent: string;
}

export const N8nIntegration: React.FC<N8nIntegrationProps> = ({ config, setConfig, promptContent }) => {
    const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
    const [nodes, setNodes] = useState<N8nNode[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState('');
    const [nodeParameters, setNodeParameters] = useState<string[]>([]);
    const [selectedParameterKey, setSelectedParameterKey] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleConfigChange = (field: keyof N8nConfig, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const resetSelections = () => {
        setWorkflows([]);
        setSelectedWorkflowId('');
        setNodes([]);
        setSelectedNodeId('');
        setNodeParameters([]);
        setSelectedParameterKey('');
    };

    const handleConnect = async () => {
        console.log('🔵 [N8N Integration] Iniciando conexão...', {
            url: config.url,
            hasApiKey: !!config.apiKey,
            apiKeyLength: config.apiKey?.length || 0
        });

        if (!config.url || !config.apiKey) {
            const errorMsg = "URL da instância e Chave de API são obrigatórios.";
            console.error('❌ [N8N Integration]', errorMsg);
            setError(errorMsg);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        resetSelections();
        
        try {
            console.log('🔄 [N8N Integration] Buscando workflows...');
            const fetchedWorkflows = await fetchWorkflows(config);
            console.log('✅ [N8N Integration] Workflows recebidos:', {
                count: fetchedWorkflows.length,
                workflows: fetchedWorkflows
            });
            
            setWorkflows(fetchedWorkflows);
            const successMsg = `✅ Conectado com sucesso! ${fetchedWorkflows.length} workflow(s) encontrado(s).`;
            console.log('✅ [N8N Integration]', successMsg);
            setSuccessMessage(successMsg);
        } catch (e: any) {
            // Preserva a mensagem de erro detalhada
            const errorMessage = e.message || "Falha ao conectar com a API do n8n.";
            console.error('❌ [N8N Integration] Erro ao conectar:', {
                error: e,
                errorMessage,
                url: config.url,
                currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
                errorStack: e?.stack
            });
            
            setError(errorMessage);
            
            // Se for erro de CORS, mostra mensagem adicional
            if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
                console.error('🚨 [N8N Integration] Erro de CORS detectado:', {
                    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
                    n8nUrl: config.url,
                    error: e,
                    errorType: e?.constructor?.name
                });
            }
        } finally {
            setIsLoading(false);
            console.log('🔄 [N8N Integration] Conexão finalizada');
        }
    };

    useEffect(() => {
        if (!selectedWorkflowId) {
            setNodes([]);
            setSelectedNodeId('');
            return;
        }
        const fetchNodes = async () => {
            console.log('🔵 [N8N Integration] Buscando nodes do workflow:', { workflowId: selectedWorkflowId });
            setIsLoading(true);
            setError(null);
            try {
                const workflowDetails = await fetchWorkflowDetails(config, selectedWorkflowId);
                const nodes = workflowDetails.nodes || [];
                console.log('✅ [N8N Integration] Nodes encontrados:', {
                    workflowId: selectedWorkflowId,
                    count: nodes.length,
                    nodes: nodes.map((n: any) => ({ id: n.id, name: n.name, type: n.type }))
                });
                // Mostra TODOS os nodes - o usuário pode escolher qualquer um
                // Nodes de IA são comuns: gemini, openAi, anthropic, mistral, etc.
                setNodes(nodes);
            } catch (e: any) {
                const errorMsg = e.message || "Falha ao buscar os nós do workflow.";
                console.error('❌ [N8N Integration] Erro ao buscar nodes:', {
                    workflowId: selectedWorkflowId,
                    error: e,
                    errorMessage: errorMsg
                });
                setError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNodes();
    }, [selectedWorkflowId, config]);

    // Função para buscar campos de prompt em objetos aninhados (movida para fora do useEffect)
    const findPromptFields = React.useCallback((obj: any, prefix: string = '', depth: number = 0): string[] => {
        const fields: string[] = [];
        if (depth > 3) return fields; // Limita profundidade para evitar loops
        
        if (!obj || typeof obj !== 'object') return fields;
        
        // Campos comuns que contêm prompts
        const promptFieldNames = [
            'prompt', 'systemMessage', 'systemPrompt', 'instruction', 'instructions',
            'message', 'messages', 'content', 'text', 'input', 'query',
            'system', 'assistant', 'user', 'context'
        ];
        
        for (const key in obj) {
            const fullPath = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];
            
            // Se o nome do campo sugere que é um prompt
            if (promptFieldNames.some(name => key.toLowerCase().includes(name.toLowerCase()))) {
                if (typeof value === 'string' || (typeof value === 'object' && value !== null)) {
                    fields.push(fullPath);
                }
            }
            
            // Se for um objeto, busca recursivamente
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                fields.push(...findPromptFields(value, fullPath, depth + 1));
            }
            
            // Se for um array de objetos (como messages), busca no primeiro item
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                fields.push(...findPromptFields(value[0], `${fullPath}[0]`, depth + 1));
            }
            
            // Também adiciona campos string simples do nível raiz
            if (depth === 0 && typeof value === 'string' && value.length > 0) {
                if (!fields.includes(fullPath)) {
                    fields.push(fullPath);
                }
            }
        }
        
        return fields;
    }, []);

    useEffect(() => {
        if (!selectedNodeId) {
            setNodeParameters([]);
            setSelectedParameterKey('');
            return;
        }
        const selectedNode = nodes.find(n => n.id === selectedNodeId);
        if (selectedNode) {
            console.log('🔵 [N8N Integration] Buscando campos de prompt do node:', {
                nodeId: selectedNodeId,
                nodeName: selectedNode.name,
                nodeType: selectedNode.type,
                parameters: selectedNode.parameters
            });
            
            // Busca campos de prompt em toda a estrutura de parâmetros
            const promptFields = findPromptFields(selectedNode.parameters);
            
            // Remove duplicatas e ordena
            const uniqueFields = [...new Set(promptFields)].sort();
            
            console.log('✅ [N8N Integration] Campos de prompt encontrados:', {
                nodeId: selectedNodeId,
                count: uniqueFields.length,
                fields: uniqueFields
            });
            
            setNodeParameters(uniqueFields);
        }
    }, [selectedNodeId, nodes, findPromptFields]);

    const handleUpdateNode = async () => {
        console.log('🔵 [N8N Integration] Iniciando atualização do node...', {
            workflowId: selectedWorkflowId,
            nodeId: selectedNodeId,
            parameterKey: selectedParameterKey,
            promptContentLength: promptContent.length
        });

        if (!selectedWorkflowId || !selectedNodeId || !selectedParameterKey) {
            const errorMsg = "Selecione um workflow, um nó e um campo para atualizar.";
            console.error('❌ [N8N Integration]', errorMsg);
            setError(errorMsg);
            return;
        }
        
        setIsUpdating(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            await updateNodeParameter(config, selectedWorkflowId, selectedNodeId, selectedParameterKey, promptContent);
            const nodeName = nodes.find(n => n.id === selectedNodeId)?.name;
            const successMsg = `Nó "${nodeName}" atualizado com sucesso!`;
            console.log('✅ [N8N Integration]', successMsg);
            setSuccessMessage(successMsg);
        } catch (e: any) {
            const errorMsg = e.message || "Falha ao atualizar o nó no n8n.";
            console.error('❌ [N8N Integration] Erro ao atualizar node:', {
                workflowId: selectedWorkflowId,
                nodeId: selectedNodeId,
                parameterKey: selectedParameterKey,
                error: e,
                errorMessage: errorMsg
            });
            setError(errorMsg);
        } finally {
            setIsUpdating(false);
        }
    };

    const baseInputClasses = "w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50";
    const canUpdate = !!promptContent && !!selectedWorkflowId && !!selectedNodeId && !!selectedParameterKey && !isUpdating;

    return (
        <div className="space-y-4">
            <div className="bg-yellow-900/50 border border-yellow-700/80 rounded-lg p-4 text-yellow-200">
                <h4 className="font-bold flex items-center mb-2">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.242-1.21 2.878 0l5.394 10.332c.636 1.21-.213 2.719-1.439 2.719H4.302c-1.226 0-2.075-1.509-1.439-2.719L8.257 3.099zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    ⚠️ Ação Necessária: Configure o CORS no N8N
                </h4>
                <p className="text-xs mt-2 mb-3">Para conectar, sua instância N8N precisa permitir requisições deste site. O domínio atual é:</p>
                <code className="block bg-slate-900/50 p-2 rounded-md text-xs font-mono my-2 break-all text-cyan-300">
                    {typeof window !== 'undefined' ? window.location.origin : 'Não disponível'}
                </code>
                
                <div className="bg-slate-900/30 p-3 rounded-md mt-3">
                    <p className="text-xs font-semibold mb-2">📋 Como configurar:</p>
                    <ol className="text-xs space-y-1 ml-4 list-decimal">
                        <li>Acesse seu servidor/container onde o N8N está rodando</li>
                        <li>Adicione a variável de ambiente:</li>
                    </ol>
                    <code className="block bg-slate-900/70 p-2 rounded-md text-xs font-mono my-2 break-all">
                        N8N_CORS_ALLOW_ORIGIN={typeof window !== 'undefined' ? window.location.origin : '*'}
                    </code>
                    <p className="text-xs mt-2 mb-2">Ou para permitir todos os domínios (menos seguro):</p>
                    <code className="block bg-slate-900/70 p-2 rounded-md text-xs font-mono mb-2 break-all">
                        N8N_CORS_ALLOW_ORIGIN=*
                    </code>
                    <ol className="text-xs space-y-1 ml-4 list-decimal" start={3}>
                        <li>Reinicie o N8N após adicionar a variável</li>
                    </ol>
                </div>
                
                <div className="bg-slate-900/30 p-3 rounded-md mt-3">
                    <p className="text-xs font-semibold mb-2">🐳 Docker (docker-compose.yml):</p>
                    <code className="block bg-slate-900/70 p-2 rounded-md text-xs font-mono break-all">
                        environment:<br/>
                        &nbsp;&nbsp;- N8N_CORS_ALLOW_ORIGIN={typeof window !== 'undefined' ? window.location.origin : '*'}
                    </code>
                </div>
                
                <div className="mt-3 pt-2 border-t border-yellow-700/50">
                    <a href="https://docs.n8n.io/hosting/configuration/environment-variables/cors-and-security/" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline font-semibold">
                        📖 Documentação oficial do N8N sobre CORS
                    </a>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">URL da Instância n8n</label>
                <input
                    type="text"
                    value={config.url}
                    onChange={e => handleConfigChange('url', e.target.value)}
                    placeholder="https://suainstancia.n8n.cloud"
                    className={baseInputClasses}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Chave de API do n8n</label>
                <input
                    type="password"
                    value={config.apiKey}
                    onChange={e => handleConfigChange('apiKey', e.target.value)}
                    className={baseInputClasses}
                />
            </div>
            <button
                onClick={handleConnect}
                disabled={isLoading || !config.url || !config.apiKey}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center text-sm"
            >
                {isLoading ? 'Conectando...' : 'Conectar e Buscar Workflows'}
            </button>

            {workflows.length > 0 && (
                <>
                    <div className="space-y-2 pt-2 border-t border-slate-700/50">
                        <label className="block text-sm font-medium text-slate-300">1. Selecione o Workflow</label>
                        <select value={selectedWorkflowId} onChange={e => setSelectedWorkflowId(e.target.value)} className={baseInputClasses}>
                            <option value="">-- Escolha um workflow --</option>
                            {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                        </select>
                    </div>
                    {nodes.length > 0 ? (
                        <>
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    2. Selecione o Nó ({nodes.length} {nodes.length === 1 ? 'nó encontrado' : 'nós encontrados'})
                                </label>
                                <select value={selectedNodeId} onChange={e => setSelectedNodeId(e.target.value)} className={baseInputClasses}>
                                    <option value="">-- Escolha um nó --</option>
                                    {nodes.map(node => (
                                        <option key={node.id} value={node.id}>
                                            {node.name} ({node.type})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">
                                    Dica: Procure por nodes de IA como Gemini, OpenAI, Anthropic, ou qualquer node que aceite prompts.
                                </p>
                            </div>
                            {selectedNodeId && (
                                <>
                                    {nodeParameters.length > 0 ? (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                                3. Selecione o Campo do Prompt ({nodeParameters.length} {nodeParameters.length === 1 ? 'campo' : 'campos'} disponível{nodeParameters.length > 1 ? 'eis' : ''})
                                            </label>
                                            <select value={selectedParameterKey} onChange={e => setSelectedParameterKey(e.target.value)} className={baseInputClasses}>
                                                <option value="">-- Escolha um campo --</option>
                                                {nodeParameters.map(param => (
                                                    <option key={param} value={param}>
                                                        {param}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Campos encontrados automaticamente. Se o campo que você procura não aparecer, pode estar em um objeto aninhado.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-yellow-200 text-sm">
                                            <p className="font-semibold mb-1">⚠️ Nenhum campo de prompt encontrado</p>
                                            <p className="text-xs">
                                                Não encontramos campos de prompt neste node. Isso pode acontecer se:
                                            </p>
                                            <ul className="text-xs mt-1 ml-4 list-disc">
                                                <li>O node ainda não foi configurado</li>
                                                <li>Os prompts estão em uma estrutura muito aninhada</li>
                                                <li>Este node não usa prompts de texto</li>
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-slate-300 text-sm text-center">
                            Nenhum node encontrado neste workflow.
                        </div>
                    )}
                    <button
                        onClick={handleUpdateNode}
                        disabled={!canUpdate}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         {isUpdating ? 'Enviando...' : 'Enviar Prompt para o n8n'}
                    </button>
                </>
            )}

            {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-red-200 mt-2">
                    <p className="text-sm font-semibold mb-2">❌ Erro ao conectar:</p>
                    <pre className="text-xs whitespace-pre-wrap break-words font-mono overflow-auto max-h-60">
                        {error}
                    </pre>
                </div>
            )}
            {successMessage && <p className="text-sm text-green-400 text-center mt-2">{successMessage}</p>}
        </div>
    );
};