import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

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
    console.log('🔑 [API Gemini] Iniciando análise de documento...');
    
    const body = await request.json();
    const { fileBase64, mimeType, fileName } = body;
    
    if (!fileBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'fileBase64 e mimeType são obrigatórios' },
        { status: 400 }
      );
    }

    // Obter API Key do sistema
    const apiKey = getSystemApiKey();
    console.log('✅ [API Gemini] Usando API Key do sistema para análise de documento');
    
    // Inicializar cliente Gemini
    const ai = new GoogleGenAI({ apiKey });
    
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

    console.log('🚀 [API Gemini] Analisando documento com Gemini...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [docPart, { text: extractionPrompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    
    if (!response.text) {
      return NextResponse.json(
        { error: 'Resposta vazia do modelo Gemini ao extrair dados' },
        { status: 500 }
      );
    }
    
    const responseText = response.text.trim();
    
    // Tentar fazer parse do JSON
    try {
      const parsed = JSON.parse(responseText);
      
      // Garantir que todos os campos esperados existam (mesmo que vazios)
      const result = {
        persona: parsed.persona || '',
        objetivo: parsed.objetivo || '',
        contextoNegocio: parsed.contextoNegocio || '',
        contexto: parsed.contexto || '',
        regras: Array.isArray(parsed.regras) ? parsed.regras : []
      };
      
      console.log('✅ [API Gemini] Documento analisado com sucesso!');
      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (parseError: any) {
      console.error('❌ [API Gemini] Erro ao fazer parse do JSON:', parseError);
      console.error('❌ [API Gemini] Texto recebido:', responseText.substring(0, 500));
      
      // Tentar extrair JSON de uma string que pode estar envolvida em markdown ou outros caracteres
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            success: true,
            data: {
              persona: parsed.persona || '',
              objetivo: parsed.objetivo || '',
              contextoNegocio: parsed.contextoNegocio || '',
              contexto: parsed.contexto || '',
              regras: Array.isArray(parsed.regras) ? parsed.regras : []
            },
          });
        }
      } catch (secondTryError) {
        console.error('❌ [API Gemini] Segunda tentativa de parse também falhou:', secondTryError);
      }
      
      return NextResponse.json(
        { error: `Erro ao processar a resposta da API${fileName ? ` para ${fileName}` : ''}. O formato retornado é inválido.` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ [API Gemini] Erro ao analisar documento:', error);
    
    // Mensagens de erro mais específicas
    if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded') || error?.message?.includes('UNAVAILABLE')) {
      return NextResponse.json(
        { error: 'O serviço está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.' },
        { status: 503 }
      );
    } else if (error?.status === 429 || error?.code === 429 || error?.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Muitas requisições. Por favor, aguarde alguns segundos antes de tentar novamente.' },
        { status: 429 }
      );
    } else if (error?.status === 400 || error?.code === 400 || error?.message?.includes('400')) {
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado ou inválido. Tente converter para PDF ou TXT.' },
        { status: 400 }
      );
    } else if (error?.status === 401 || error?.code === 401) {
      return NextResponse.json(
        { error: 'Erro de autenticação. Verifique a chave de API do Gemini no servidor.' },
        { status: 401 }
      );
    } else if (error?.status === 413 || error?.code === 413) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tente um arquivo menor ou divida o documento.' },
        { status: 413 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Erro ao analisar documento' },
      { status: 500 }
    );
  }
}

