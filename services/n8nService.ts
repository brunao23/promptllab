import type { N8nWorkflow, N8nNode } from '../types';

interface N8nApiConfig {
    url: string;
    apiKey: string;
}

// Helper para padronizar as chamadas fetch
const n8nFetch = async (endpoint: string, config: N8nApiConfig, options: RequestInit = {}) => {
    // Garante que a URL não tenha barras duplas
    const apiUrl = `${config.url.replace(/\/$/, '')}/api/v1${endpoint}`;
    
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
    };

    // Logs para debug
    console.log('🔵 [N8N Service] Iniciando requisição:', {
        endpoint,
        method: options.method || 'GET',
        url: apiUrl,
        hasApiKey: !!config.apiKey,
        apiKeyLength: config.apiKey?.length || 0
    });

    try {
        const response = await fetch(apiUrl, { ...options, headers });
        
        console.log('🟢 [N8N Service] Resposta recebida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            let errorMessage = `Erro na API do n8n: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorMessage;
                console.error('🔴 [N8N Service] Erro na resposta:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody
                });
            } catch (e) {
                console.error('🔴 [N8N Service] Erro ao parsear resposta de erro:', e);
            }
            throw new Error(errorMessage);
        }
        
        if (response.status === 204) { // No Content
            return null;
        }

        const data = await response.json();
        console.log('✅ [N8N Service] Requisição bem-sucedida:', {
            endpoint,
            dataSize: JSON.stringify(data).length,
            hasData: !!data
        });
        return data;
    } catch (error: any) {
        console.error('🔴 [N8N Service] Erro na requisição:', {
            endpoint,
            url: apiUrl,
            method: options.method || 'GET',
            errorType: error?.constructor?.name,
            errorMessage: error?.message,
            errorStack: error?.stack,
            error: error
        });

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            // Detecta o domínio atual para dar instruções mais específicas
            const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'este site';
            const errorDetails = {
                message: 'Erro de CORS (Cross-Origin Resource Sharing)',
                currentOrigin: currentOrigin,
                n8nUrl: config.url,
                apiUrl: apiUrl,
                solution: `Configure o CORS no seu N8N para permitir requisições de: ${currentOrigin}`
            };
            
            console.error('🚨 [N8N Service] ERRO DE CORS DETECTADO:', errorDetails);
            
            throw new Error(
                `❌ Erro de CORS: A instância N8N em "${config.url}" não está permitindo requisições de "${currentOrigin}".\n\n` +
                `📋 SOLUÇÃO:\n` +
                `1. Acesse seu servidor/container onde o N8N está rodando\n` +
                `2. Adicione a variável de ambiente:\n` +
                `   N8N_CORS_ALLOW_ORIGIN=${currentOrigin}\n\n` +
                `   Ou para permitir todos os domínios (menos seguro):\n` +
                `   N8N_CORS_ALLOW_ORIGIN=*\n\n` +
                `3. Reinicie o N8N após adicionar a variável\n\n` +
                `💡 Se estiver usando Docker, adicione no docker-compose.yml ou use:\n` +
                `   docker run -e N8N_CORS_ALLOW_ORIGIN=${currentOrigin} ...`
            );
        }
        throw error;
    }
};

export const fetchWorkflows = async (config: N8nApiConfig): Promise<N8nWorkflow[]> => {
    console.log('📋 [N8N Service] Buscando workflows...');
    try {
        const response = await n8nFetch('/workflows', config);
        const workflows = response.data || [];
        console.log('✅ [N8N Service] Workflows encontrados:', {
            count: workflows.length,
            workflows: workflows.map((w: any) => ({ id: w.id, name: w.name, active: w.active }))
        });
        return workflows;
    } catch (error) {
        console.error('❌ [N8N Service] Erro ao buscar workflows:', error);
        throw error;
    }
};

// n8n não tem um endpoint para buscar nós de um workflow, então buscamos o workflow inteiro
export const fetchWorkflowDetails = async (config: N8nApiConfig, workflowId: string): Promise<{ nodes: N8nNode[] }> => {
    console.log('📋 [N8N Service] Buscando detalhes do workflow:', { workflowId });
    try {
        const response = await n8nFetch(`/workflows/${workflowId}`, config);
        const nodes = response.nodes || [];
        console.log('✅ [N8N Service] Detalhes do workflow encontrados:', {
            workflowId,
            nodeCount: nodes.length,
            nodeTypes: nodes.map((n: any) => n.type)
        });
        return response; // A resposta da API já contém a estrutura com os nós
    } catch (error) {
        console.error('❌ [N8N Service] Erro ao buscar detalhes do workflow:', { workflowId, error });
        throw error;
    }
};

// Função auxiliar para atualizar um valor em um objeto usando uma chave aninhada
const setNestedValue = (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    let current = obj;
    
    // Processa arrays como messages[0].content
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
        
        if (arrayMatch) {
            const arrayKey = arrayMatch[1];
            const arrayIndex = parseInt(arrayMatch[2], 10);
            
            if (!current[arrayKey]) {
                current[arrayKey] = [];
            }
            if (!current[arrayKey][arrayIndex]) {
                current[arrayKey][arrayIndex] = {};
            }
            current = current[arrayKey][arrayIndex];
        } else {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
    }
    
    // Define o valor final
    const lastKey = keys[keys.length - 1];
    const lastArrayMatch = lastKey.match(/^(.+)\[(\d+)\]$/);
    
    if (lastArrayMatch) {
        const arrayKey = lastArrayMatch[1];
        const arrayIndex = parseInt(lastArrayMatch[2], 10);
        if (!current[arrayKey]) {
            current[arrayKey] = [];
        }
        current[arrayKey][arrayIndex] = value;
    } else {
        current[lastKey] = value;
    }
};

export const updateNodeParameter = async (
    config: N8nApiConfig,
    workflowId: string,
    nodeId: string,
    parameterKey: string,
    promptContent: string
): Promise<void> => {
    console.log('📝 [N8N Service] Atualizando parâmetro do node:', {
        workflowId,
        nodeId,
        parameterKey,
        promptContentLength: promptContent.length
    });
    
    // 1. Obter o estado atual do workflow
    const workflow = await n8nFetch(`/workflows/${workflowId}`, config);

    // 2. Encontrar e modificar o nó
    const nodeIndex = workflow.nodes.findIndex((n: N8nNode) => n.id === nodeId);
    if (nodeIndex === -1) {
        throw new Error(`Nó com ID "${nodeId}" não encontrado no workflow.`);
    }

    // Cria uma cópia profunda para evitar mutação direta
    const updatedWorkflow = JSON.parse(JSON.stringify(workflow));
    
    // Atualiza o parâmetro (suporta chaves aninhadas como "options.prompt" ou "messages[0].content")
    if (parameterKey.includes('.') || parameterKey.includes('[')) {
        // Chave aninhada - usa função auxiliar
        setNestedValue(updatedWorkflow.nodes[nodeIndex].parameters, parameterKey, promptContent);
    } else {
        // Chave simples no nível raiz
        updatedWorkflow.nodes[nodeIndex].parameters[parameterKey] = promptContent;
    }

    // 3. Enviar o workflow modificado de volta via PUT
    try {
        await n8nFetch(`/workflows/${workflowId}`, config, {
            method: 'PUT',
            body: JSON.stringify(updatedWorkflow),
        });
        console.log('✅ [N8N Service] Parâmetro atualizado com sucesso:', {
            workflowId,
            nodeId,
            parameterKey
        });
    } catch (error) {
        console.error('❌ [N8N Service] Erro ao atualizar parâmetro:', {
            workflowId,
            nodeId,
            parameterKey,
            error
        });
        throw error;
    }
};