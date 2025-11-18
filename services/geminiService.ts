
import { GoogleGenAI, Chat, GenerateContentResponse, Type, FunctionDeclaration } from '@google/genai';
import type { PromptData, FewShotExample, OptimizationPair } from '../types';
import { canUseTokens, incrementTokenUsage } from './subscriptionService';
import { estimateFullTokens } from '../utils/tokenEstimator';

// Helper function to get the API key and initialize the AI client
const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

const model = 'gemini-2.5-flash';

export const createFinalPrompt = async (data: PromptData): Promise<string> => {
    const ai = getAI();
    let basePromptInfo = `
# INFORMAÇÕES BASE PARA GERAÇÃO DO PROMPT MESTRE

## IDENTIDADE CENTRAL & EXPERTISE (PERSONA)
${data.persona}

## OBJETIVO PRINCIPAL
${data.objetivo}

## CONTEXTO DO NEGÓCIO
${data.contextoNegocio}

## CONTEXTO DA INTERAÇÃO
${data.contexto}
`;
    if (data.ferramentas.length > 0) {
        basePromptInfo += `\n## FERRAMENTAS DISPONÍVEIS (TOOLS)\n`;
        data.ferramentas.forEach(f => {
            basePromptInfo += `- **${f.nome}**: ${f.descricao}\n`;
        });
    }

    if (data.variaveisDinamicas.length > 0) {
        basePromptInfo += `\n## VARIÁVEIS DINÂMICAS\n`;
        data.variaveisDinamicas.forEach(v => {
            basePromptInfo += `- **{{${v.chave}}}**: (Valor de exemplo: ${v.valor})\n`;
        });
    }
    
    basePromptInfo += `
## REGRAS CRÍTICAS INVIOLÁVEIS
${data.regras.map(regra => `- ${regra}`).join('\n')}
`;

    if (data.exemplos.length > 0) {
        basePromptInfo += `\n## EXEMPLOS (FEW-SHOT LEARNING)\n`;
        data.exemplos.forEach(ex => {
            basePromptInfo += `### Exemplo:\n- **Usuário:** ${ex.user}\n- **Agente:** ${ex.agent}\n`;
        });
    }

    if (data.fluxos && data.fluxos.length > 0) {
         basePromptInfo += `\n## FLUXOS DE INTERAÇÃO ESPECÍFICOS\n`;
         data.fluxos.forEach(fluxo => {
             basePromptInfo += `### Fluxo: ${fluxo.nome} (${fluxo.tipoPrompt})\n- Objetivo: ${fluxo.objetivo}\n`;
             if (fluxo.baseConhecimentoRAG) basePromptInfo += `- Contexto/RAG: ${fluxo.baseConhecimentoRAG}\n`;
             if (fluxo.reforcarCoT) basePromptInfo += `- [REFORÇAR CHAIN-OF-THOUGHT NESTE FLUXO]\n`;
             if (fluxo.ativarGuardrails) basePromptInfo += `- [ATIVAR GUARDRAILS ESTRITOS NESTE FLUXO]\n`;
             if (fluxo.fewShotExamples) basePromptInfo += `- Exemplos do fluxo:\n${fluxo.fewShotExamples}\n`;
         });
    }

    // INSTRUÇÕES PARA O AGENTE FINAL (BASEADO NO `formatoSaida`)
    basePromptInfo += `
## FORMATO E ESTRUTURA DE RESPOSTA DO AGENTE
- **Formato Alvo do Agente:** ${data.formatoSaida.toUpperCase()}
- **Estrutura Esperada:** ${data.estruturaSaida}
`;

    if (['json', 'xml', 'yaml'].includes(data.formatoSaida)) {
      basePromptInfo += `
### RESTRIÇÕES ESTRITAS DE FORMATO DO AGENTE (${data.formatoSaida.toUpperCase()})
Para garantir a integridade técnica da resposta, as seguintes restrições SÃO OBRIGATÓRIAS para o Agente Final:
1. **SEM MARKDOWN NA RESPOSTA FINAL:** A resposta do agente NÃO DEVE conter blocos de código Markdown. Deve ser apenas o dado puro.
2. **SEM TEXTO CONVERSACIONAL:** A resposta deve começar imediatamente com o primeiro caractere válido do formato.
`;
    } else if (data.formatoSaida === 'text') {
        basePromptInfo += `
### RESTRIÇÕES DE FORMATO DO AGENTE (TEXTO PURO)
1. **LINGUAGEM NATURAL:** A resposta deve ser em texto corrido natural, focado no usuário final.
2. **SEM FORMATAÇÃO COMPLEXA:** Evite uso excessivo de Markdown. NUNCA use blocos de código para texto normal.
`;
    }

    // INSTRUÇÕES PARA O GERADOR DO PROMPT MESTRE (BASEADO NO `masterPromptFormat`)
    let expansionPrompt = `
Você é um especialista sênior em engenharia de prompts. Sua tarefa é pegar as informações base fornecidas e expandi-las em um "PROMPT MESTRE" detalhado e robusto.

**INFORMAÇÕES BASE:**
---
${basePromptInfo.trim()}
---

**REQUISITOS DO PROMPT MESTRE:**
1. **EXPANSÃO INTELIGENTE:** Use as informações base como núcleo. Expanda seções, adicione detalhes, explicações e exemplos consistentes com a persona.
2. **TAMANHO ALVO:** Aproximadamente **${data.promptSize}** caracteres.
3. **FORMATO DE SAÍDA DO PROMPT MESTRE:** O prompt mestre que VOCÊ vai gerar deve estar no formato **${data.masterPromptFormat.toUpperCase()}**.
`;

    if (data.masterPromptFormat === 'markdown') {
        expansionPrompt += `
**ESTRUTURA MARKDOWN ESPERADA:**
Use títulos Markdown (#, ##) para separar as seções (PERSONA, OBJETIVO, REGRAS, etc.).
Sua resposta deve ser APENAS o texto Markdown do prompt final.
`;
    } else if (data.masterPromptFormat === 'json') {
        expansionPrompt += `
**ESTRUTURA JSON ESPERADA:**
Sua resposta deve ser APENAS um objeto JSON válido. Sugestão de chaves: "persona", "objective", "context", "rules", "instructions", "examples". O conteúdo de cada valor pode ser texto detalhado (podendo usar markdown DENTRO das strings se necessário para quebras de linha, mas o formato geral DEVE ser JSON).
`;
    }

    // Verificar limite de tokens antes de fazer a chamada
    const estimatedTokens = estimateFullTokens(expansionPrompt, '');
    const tokenCheck = await canUseTokens(estimatedTokens);
    
    if (!tokenCheck.allowed) {
        throw new Error(tokenCheck.reason || 'Limite de tokens excedido');
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: expansionPrompt,
        config: data.masterPromptFormat === 'json' ? { responseMimeType: "application/json" } : undefined
    });
    
    // Incrementar uso de tokens após a chamada
    const actualTokens = estimateFullTokens(expansionPrompt, response.text);
    await incrementTokenUsage(actualTokens);
    
    return response.text;
};

let chatInstance: Chat | null = null;

export const startChat = (systemInstruction: string): void => {
    const ai = getAI();
    // Se o prompt mestre for JSON, tentamos extrair algo usável como instrução de sistema se possível,
    // ou usamos o JSON inteiro como string.
    let finalInstruction = systemInstruction;
    try {
        // Tenta parsear se parece JSON para talvez extrair campos específicos se necessário no futuro.
        // Por enquanto, passar o JSON stringificado como system prompt também funciona para muitos modelos.
        JSON.parse(systemInstruction);
    } catch (e) {
        // Não é JSON, continua como texto normal
    }

    chatInstance = ai.chats.create({
        model: model,
        config: {
            systemInstruction: finalInstruction
        }
    });
};

export const continueChat = async (message: string, promptContent?: string): Promise<string> => {
    if (!chatInstance) {
        throw new Error("Chat não iniciado. Selecione uma versão de prompt para começar.");
    }
    
    try {
        // Verificar limite de tokens antes de fazer a chamada
        const estimatedTokens = estimateFullTokens(message + (promptContent || ''), '');
        const tokenCheck = await canUseTokens(estimatedTokens);
        
        if (!tokenCheck.allowed) {
            throw new Error(tokenCheck.reason || 'Limite de tokens excedido');
        }

        const response: GenerateContentResponse = await chatInstance.sendMessage({ message });
        
        // Incrementar uso de tokens após a chamada
        const actualTokens = estimateFullTokens(message, response.text);
        await incrementTokenUsage(actualTokens);
        
        return response.text;
    } catch (error: any) {
        console.error("Error in chat:", error);
        // Se o erro já é uma mensagem de limite, re-lançar
        if (error.message && error.message.includes('Limite de tokens')) {
            throw error;
        }
        throw new Error(error.message || "Falha ao se comunicar com a API da Gemini no chat.");
    }
};

export const generateExamples = async (data: PromptData): Promise<Omit<FewShotExample, 'id'>[]> => {
    const ai = getAI();
    try {
        const generationContext = `
        **Persona do Agente:** ${data.persona}
        **Objetivo Principal:** ${data.objetivo}
        **Contexto do Negócio:** ${data.contextoNegocio}
        **Contexto da Interação:** ${data.contexto}
        **Regras:** ${data.regras.join(', ')}
        **Formato de Saída do Agente:** ${data.formatoSaida.toUpperCase()}
        `;

        let generationPrompt = `
        Com base no contexto, gere 2-3 exemplos de interações (usuário/agente).
        `;

        if (['json', 'xml', 'yaml'].includes(data.formatoSaida)) {
             generationPrompt += ` IMPORTANTE: A resposta do 'agent' nos exemplos deve ser EXATAMENTE no formato ${data.formatoSaida.toUpperCase()} solicitado.`;
        }
        
        generationPrompt += `
        **Contexto:**
        ---
        ${generationContext}
        ---
        Retorne os exemplos como um array JSON.
        `;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: generationPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            user: { type: Type.STRING },
                            agent: { type: Type.STRING }
                        },
                        required: ['user', 'agent']
                    }
                }
            }
        });

        return JSON.parse(response.text.trim()) as Omit<FewShotExample, 'id'>[];
    } catch (error) {
        console.error("Error generating examples:", error);
        throw new Error("Falha ao gerar exemplos.");
    }
};

export const optimizePrompt = async (currentPrompt: string, corrections: OptimizationPair[], instructions: string = ''): Promise<string> => {
    const ai = getAI();
    try {
        const correctionsSection = corrections.length > 0 ? corrections.map((c, i) => `
### Correção ${i + 1}
- **Consulta:** "${c.userQuery}"
- **Resposta Antiga (Ruim):** "${c.originalResponse}"
- **Resposta Nova (Ideal):** "${c.correctedResponse}"
`).join('\n') : 'Nenhuma correção específica de chat.';

        const optimizationPrompt = `
Você é um especialista em engenharia de prompts. Refatore o prompt abaixo com base no feedback.
MANTENHA O MESMO FORMATO (Markdown ou JSON) do prompt original.

**PROMPT ATUAL:**
---
${currentPrompt}
---

**FEEDBACK (CORREÇÕES):**
---
${correctionsSection}
---

**INSTRUÇÕES MANUAIS:**
---
${instructions.trim() || 'Nenhuma instrução adicional.'}
---

Reescreva o prompt para corrigir os problemas identificados. Retorne APENAS o novo prompt.
`;

        // Tenta detectar se o prompt atual é JSON para forçar a saída JSON na otimização também
        let isJson = false;
        try {
            JSON.parse(currentPrompt);
            isJson = true;
        } catch (e) {}

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: optimizationPrompt,
            config: isJson ? { responseMimeType: "application/json" } : undefined
        });

        return response.text;
    } catch (error) {
        console.error("Error optimizing prompt:", error);
        throw new Error("Falha na otimização.");
    }
};

export const explainPrompt = async (promptContent: string): Promise<string> => {
    const ai = getAI();
    const explanationRequest = `
Você é um especialista em engenharia de prompts e comunicação técnica. Sua tarefa é analisar o prompt de IA fornecido e gerar uma documentação clara, detalhada e pedagógica sobre ele. O público-alvo desta documentação são clientes e membros não-técnicos da equipe do projeto.

A documentação deve explicar:
1. **Objetivo Geral:** Qual é a principal função do agente de IA que usará este prompt?
2. **Persona e Tom de Voz:** Como o agente se comportará? Qual é sua personalidade?
3. **Principais Regras e Limitações:** Quais são as diretrizes mais importantes que o agente deve seguir?
4. **Entradas e Saídas:** Que tipo de informação o agente espera e como ele deve formatar suas respostas?
5. **Exemplos Práticos:** Se houver exemplos, explique o que eles demonstram.
6. **Fluxo de Conversa:** Descreva um exemplo de como uma conversa com este agente poderia acontecer.

Use formatação Markdown (títulos, listas, negrito) para tornar o documento fácil de ler e bem estruturado. A linguagem deve ser simples e evitar jargões técnicos sempre que possível.

**PROMPT PARA ANALISAR:**
---
${promptContent}
---

Retorne APENAS a documentação em Markdown.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: explanationRequest
        });
        return response.text;
    } catch (error) {
        console.error("Error explaining prompt:", error);
        throw new Error("Falha ao gerar a explicação do prompt.");
    }
};


// --- Document Analysis & Audio Assistant Services remain largely the same ---
// (Omitting them here for brevity as they didn't need changes for this specific request, 
// but they would be included in the full file content in a real scenario if I wasn't using the XML format efficiently)
// RE-INCLUDING FULL CONTENT TO BE SAFE as requested by the prompt format.

/**
 * Função auxiliar para retry com backoff exponencial
 */
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            
            // Verificar se é um erro que vale a pena tentar novamente
            const isRetryable = 
                error?.status === 503 || // Service Unavailable
                error?.status === 429 || // Too Many Requests
                error?.status === 500 || // Internal Server Error
                error?.status === 502 || // Bad Gateway
                error?.code === 503 ||
                error?.code === 429 ||
                error?.code === 500 ||
                error?.code === 502 ||
                error?.message?.includes('overloaded') ||
                error?.message?.includes('try again later') ||
                error?.message?.includes('rate limit') ||
                error?.message?.includes('UNAVAILABLE');
            
            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }
            
            // Calcular delay com backoff exponencial
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`⚠️ Tentativa ${attempt + 1}/${maxRetries + 1} falhou. Tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
};

export const analyzeDocument = async (fileBase64: string, mimeType: string, fileName?: string): Promise<Partial<PromptData>> => {
    const ai = getAI();

    // Para arquivos CSV, melhorar o prompt de análise
    const isCsv = mimeType === 'text/csv' || fileName?.toLowerCase().endsWith('.csv');
    
    const docPart = {
        inlineData: {
            data: fileBase64,
            mimeType: mimeType
        }
    };

    const extractionPrompt = isCsv 
        ? `
Analise este arquivo CSV e extraia informações relevantes para criar um prompt de IA.
Identifique padrões, estruturas de dados, contexto de negócio e regras de processamento.

Para arquivos CSV, foque em:
- Entender a estrutura e propósito dos dados
- Identificar campos importantes e suas relações
- Extrair contexto de negócio dos cabeçalhos e dados
- Identificar regras de validação ou processamento implícitas

Campos JSON esperados: persona, objetivo, contextoNegocio, contexto, regras (array de strings).
Retorne sempre um JSON válido, mesmo que alguns campos estejam vazios.
`
        : `
Analise o documento e extraia informações para um prompt de IA.
${fileName ? `Nome do arquivo: ${fileName}\n` : ''}
Campos JSON esperados: persona, objetivo, contextoNegocio, contexto, regras (array de strings).
Retorne sempre um JSON válido, mesmo que alguns campos estejam vazios.
`;

    try {
        const response = await retryWithBackoff(async () => {
            // Para CSV, usar uma abordagem mais tolerante com o schema
            const schema = isCsv
                ? {
                    type: Type.OBJECT,
                    properties: {
                        persona: { type: Type.STRING },
                        objetivo: { type: Type.STRING },
                        contextoNegocio: { type: Type.STRING },
                        contexto: { type: Type.STRING },
                        regras: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    // Campos não obrigatórios para CSV, permitindo análise parcial
                    required: []
                }
                : {
                    type: Type.OBJECT,
                    properties: {
                        persona: { type: Type.STRING },
                        objetivo: { type: Type.STRING },
                        contextoNegocio: { type: Type.STRING },
                        contexto: { type: Type.STRING },
                        regras: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['persona', 'objetivo', 'contextoNegocio', 'contexto', 'regras']
                };

            // Estimar tokens para o documento (aproximação)
            const estimatedDocTokens = estimateFullTokens(extractionPrompt, '');
            const tokenCheck = await canUseTokens(estimatedDocTokens);
            
            if (!tokenCheck.allowed) {
                throw new Error(tokenCheck.reason || 'Limite de tokens excedido');
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [docPart, { text: extractionPrompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
            
            // Incrementar uso de tokens após a chamada
            const actualTokens = estimateFullTokens(extractionPrompt, response.text);
            await incrementTokenUsage(actualTokens);
            
            return response;
        }, 3, 500); // 3 tentativas, começando com 500ms (reduzido de 2s para acelerar)
        
        // Verificar se a resposta tem texto
        if (!response || !response.text) {
            console.error("Resposta vazia ou inválida da API:", response);
            throw new Error("A API retornou uma resposta vazia. Tente novamente.");
        }
        
        const responseText = response.text.trim();
        
        if (!responseText || responseText === 'undefined' || responseText === 'null') {
            console.error("Texto da resposta está vazio ou inválido:", responseText);
            throw new Error("A API retornou dados inválidos. Tente novamente.");
        }
        
        // Tentar fazer parse do JSON
        try {
            const parsed = JSON.parse(responseText);
            
            // Garantir que todos os campos esperados existam (mesmo que vazios)
            const result: Partial<PromptData> = {
                persona: parsed.persona || '',
                objetivo: parsed.objetivo || '',
                contextoNegocio: parsed.contextoNegocio || '',
                contexto: parsed.contexto || '',
                regras: Array.isArray(parsed.regras) ? parsed.regras : []
            };
            
            return result;
        } catch (parseError: any) {
            console.error("Erro ao fazer parse do JSON:", parseError);
            console.error("Texto recebido:", responseText.substring(0, 500));
            
            // Tentar extrair JSON de uma string que pode estar envolvida em markdown ou outros caracteres
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        persona: parsed.persona || '',
                        objetivo: parsed.objetivo || '',
                        contextoNegocio: parsed.contextoNegocio || '',
                        contexto: parsed.contexto || '',
                        regras: Array.isArray(parsed.regras) ? parsed.regras : []
                    };
                }
            } catch (secondTryError) {
                console.error("Segunda tentativa de parse também falhou:", secondTryError);
            }
            
            throw new Error(`Erro ao processar a resposta da API${fileName ? ` para ${fileName}` : ''}. O formato retornado é inválido. Tente novamente.`);
        }
    } catch (error: any) {
        console.error("Error analyzing document:", error);
        
        // Se já é um erro formatado, apenas propagar
        if (error?.message && !error?.status && !error?.code) {
            throw error;
        }
        
        // Mensagens de erro mais específicas
        if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded') || error?.message?.includes('UNAVAILABLE')) {
            throw new Error("O serviço está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.");
        } else if (error?.status === 429 || error?.code === 429 || error?.message?.includes('rate limit')) {
            throw new Error("Muitas requisições. Por favor, aguarde alguns segundos antes de tentar novamente.");
        } else if (error?.status === 400 || error?.code === 400 || error?.message?.includes('400')) {
            throw new Error("Formato de arquivo não suportado ou inválido. Tente converter para PDF ou TXT.");
        } else if (error?.status === 401 || error?.code === 401) {
            throw new Error("Erro de autenticação. Verifique sua chave de API do Gemini.");
        } else if (error?.status === 413 || error?.code === 413) {
            throw new Error("Arquivo muito grande. Tente um arquivo menor ou divida o documento.");
        } else if (error?.message?.includes('JSON') || error?.message?.includes('parse')) {
            throw new Error("Erro ao processar a resposta da API. Tente novamente.");
        } else {
            throw new Error(error?.message || "Falha ao analisar o documento. Tente novamente mais tarde.");
        }
    }
};

const formUpdateTools: FunctionDeclaration[] = [
    { name: 'updatePersona', parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } },
    { name: 'updateObjetivo', parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } },
    { name: 'updateContextoNegocio', parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } },
    { name: 'updateContextoInteracao', parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } },
    // FIX: Corrected the type from a string literal 'string' to the enum Type.STRING for type safety and correctness.
    { name: 'addRegra', parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } },
    { name: 'addExemplo', parameters: { type: Type.OBJECT, properties: { user: { type: Type.STRING }, agent: { type: Type.STRING } }, required: ['user', 'agent'] } }
];

const assistantSystemInstruction = `Você é um assistente de preenchimento de formulário por voz. Transcreva o áudio do usuário e use as ferramentas para atualizar os campos. Responda com [TRANSCRIÇÃO: ...] seguido de uma confirmação curta.`;

export const processAudioCommand = async (audioBase64: string, audioMimeType: string): Promise<GenerateContentResponse> => {
    const ai = getAI();
    try {
        return await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [{ inlineData: { mimeType: audioMimeType, data: audioBase64 } }, { text: "Processe este comando." }] },
            config: {
                systemInstruction: assistantSystemInstruction,
                tools: [{ functionDeclarations: formUpdateTools }]
            }
        });
    } catch (error) {
        console.error("Error processing audio:", error);
        throw new Error("Falha ao processar áudio.");
    }
};