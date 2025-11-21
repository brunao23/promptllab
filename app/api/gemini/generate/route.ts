import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { PromptData } from '@/types';

// Função para obter a API Key do sistema (servidor)
function getSystemApiKey(): string {
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
    '';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor. Configure na Vercel: Settings → Environment Variables → GEMINI_API_KEY');
  }
  
  return apiKey;
}

export async function POST(request: Request) {
  try {
    console.log('🔑 [API Gemini] Iniciando geração de prompt...');
    
    // Obter dados do corpo da requisição
    const data: PromptData = await request.json();
    
    // Validar campos obrigatórios
    if (!data.persona || !data.persona.trim()) {
      return NextResponse.json(
        { error: 'Campo "Persona" é obrigatório' },
        { status: 400 }
      );
    }
    if (!data.objetivo || !data.objetivo.trim()) {
      return NextResponse.json(
        { error: 'Campo "Objetivo" é obrigatório' },
        { status: 400 }
      );
    }
    if (!data.contextoNegocio || !data.contextoNegocio.trim()) {
      return NextResponse.json(
        { error: 'Campo "Contexto do Negócio" é obrigatório' },
        { status: 400 }
      );
    }
    if (!data.contexto || !data.contexto.trim()) {
      return NextResponse.json(
        { error: 'Campo "Contexto da Interação" é obrigatório' },
        { status: 400 }
      );
    }

    // Obter API Key do sistema
    const apiKey = getSystemApiKey();
    console.log('✅ [API Gemini] Usando API Key do sistema (comprimento:', apiKey.length, ')');
    
    // Inicializar cliente Gemini
    const ai = new GoogleGenAI({ apiKey });
    
    // Construir prompt base
    let basePromptInfo = `
# INFORMAÇÕES BASE PARA GERAÇÃO DO PROMPT MESTRE

## IDENTIDADE CENTRAL & EXPERTISE (PERSONA)
${data.persona.trim()}

## OBJETIVO PRINCIPAL
${data.objetivo.trim()}

## CONTEXTO DO NEGÓCIO
${data.contextoNegocio.trim()}

## CONTEXTO DA INTERAÇÃO
${data.contexto.trim()}
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

    // INSTRUÇÕES PARA O AGENTE FINAL
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

    // INSTRUÇÕES PARA O GERADOR DO PROMPT MESTRE
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
**ESTRUTURA MARKDOWN ESPERADA (CRÍTICO - DEVE SER MARKDOWN 100% COM HIERARQUIA):**

O prompt mestre DEVE seguir uma hierarquia Markdown completa e bem estruturada:

1. **TÍTULOS COM HIERARQUIA:**
   - Use # (H1) apenas para o título principal do prompt
   - Use ## (H2) para seções principais (PERSONA, OBJETIVO, CONTEXTO, REGRAS, etc.)
   - Use ### (H3) para subseções dentro de cada seção principal
   - Use #### (H4) para sub-subseções quando necessário
   - Use ##### (H5) para detalhamentos finos quando necessário

2. **FORMATAÇÃO:**
   - Use **negrito** para destacar conceitos importantes
   - Use *itálico* para ênfase
   - Use código inline (backtick) para nomes de variáveis, funções ou termos técnicos
   - Use listas ordenadas (1., 2., 3.) para instruções sequenciais
   - Use listas não ordenadas (- ou *) para itens relacionados
   - Use > para citações ou blocos de destaque quando apropriado
   - Use blocos de código (três backticks) quando necessário

3. **ESTRUTURA ESPERADA:**
   - Título principal com #
   - Seções principais com ##
   - Subseções com ###
   - Conteúdo formatado com listas, negrito, itálico e código inline
   - Organização hierárquica clara para facilitar leitura por LLMs

Sua resposta deve ser APENAS o texto Markdown do prompt final, SEM explicações ou comentários adicionais.
`;
    } else if (data.masterPromptFormat === 'json') {
      expansionPrompt += `
**ESTRUTURA JSON ESPERADA (CRÍTICO - DEVE SER JSON 100% ESTRUTURADO):**

O prompt mestre DEVE ser um objeto JSON válido, bem formatado e estruturado:

1. **FORMATAÇÃO OBRIGATÓRIA:**
   - Use indentação de 2 espaços para cada nível
   - Use quebras de linha após cada chave/valor
   - Use vírgulas apropriadas (não vírgula final)
   - Use aspas duplas para todas as strings
   - Use arrays para listas de itens
   - Use objetos aninhados para estruturas hierárquicas

2. **ESTRUTURA SUGERIDA:**
   {
     "persona": {
       "identity": "...",
       "expertise": "...",
       "tone": "..."
     },
     "objective": {
       "primary": "...",
       "secondary": ["...", "..."]
     },
     "context": {
       "business": "...",
       "interaction": "..."
     },
     "rules": [
       "Regra 1: ...",
       "Regra 2: ..."
     ],
     "instructions": {
       "format": "...",
       "style": "...",
       "examples": ["...", "..."]
     }
   }

3. **REQUISITOS CRÍTICOS:**
   - O JSON DEVE ser válido e bem formatado (passar em JSON.parse())
   - Use indentação consistente (2 espaços por nível)
   - Strings podem conter quebras de linha \\n quando necessário
   - Strings podem conter markdown DENTRO delas se apropriado
   - Estruture de forma hierárquica para facilitar leitura por LLMs

4. **NÃO FAÇA:**
   - Não retorne JSON em um bloco de código markdown (três backticks json)
   - Não adicione explicações antes ou depois do JSON
   - Não use formatação compacta (tudo em uma linha)
   - Não use aspas simples para strings

Sua resposta deve ser APENAS o objeto JSON válido, SEM blocos de código markdown, SEM explicações, APENAS o JSON puro e bem formatado.
`;
    }

    // Gerar prompt
    console.log('🚀 [API Gemini] Gerando prompt com Gemini...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: expansionPrompt,
      config: data.masterPromptFormat === 'json' ? { responseMimeType: "application/json" } : undefined
    });
    
    if (!response.text) {
      return NextResponse.json(
        { error: 'Resposta vazia do modelo Gemini' },
        { status: 500 }
      );
    }
    
    let finalText = response.text.trim();
    
    // Se for JSON, garantir que está bem formatado
    if (data.masterPromptFormat === 'json') {
      try {
        // Remover blocos de código markdown se houver
        finalText = finalText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        finalText = finalText.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        
        // Fazer parse para validar e reformatar
        const parsed = JSON.parse(finalText);
        // Reformatar com indentação de 2 espaços
        finalText = JSON.stringify(parsed, null, 2);
      } catch (e) {
        console.warn('⚠️ [API Gemini] Erro ao formatar JSON, retornando texto original:', e);
        // Se falhar o parse, tentar extrair JSON do texto
        const jsonMatch = finalText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            finalText = JSON.stringify(parsed, null, 2);
          } catch (e2) {
            console.error('❌ [API Gemini] Erro ao extrair JSON:', e2);
          }
        }
      }
    }
    
    console.log('✅ [API Gemini] Prompt gerado com sucesso!');
    
    return NextResponse.json({
      success: true,
      prompt: finalText,
    });
  } catch (error: any) {
    console.error('❌ [API Gemini] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar prompt' },
      { status: 500 }
    );
  }
}

