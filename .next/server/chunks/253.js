exports.id=253,exports.ids=[253],exports.modules={39727:()=>{},47990:()=>{},49824:(a,b,c)=>{"use strict";c.d(b,{IG:()=>t,KR:()=>o,BE:()=>k,CB:()=>r,DF:()=>p,K8:()=>q,Rc:()=>w,Z4:()=>n});var d=c(36678),e=c(65812);function f(a){return a&&"string"==typeof a?Math.ceil(a.length/4):0}function g(a,b){return f(a)+f(b)}var h=c(82822);let i=async()=>{let a=await (0,h.dD)("gemini"),b=!1;if(a)b=!0;else if(!(a="undefined"!=typeof process&&process.env?.GEMINI_API_KEY||"undefined"!=typeof process&&process.env?.API_KEY||""))throw Error("API_KEY n\xe3o configurada. Configure sua pr\xf3pria API Key nas Configura\xe7\xf5es ou configure a GEMINI_API_KEY do sistema.");return{ai:new d.M4({apiKey:a}),usingUserKey:b,apiKey:a}},j="gemini-2.5-flash",k=async a=>{if(!a.persona||!a.persona.trim())throw Error('Campo "Persona" \xe9 obrigat\xf3rio');if(!a.objetivo||!a.objetivo.trim())throw Error('Campo "Objetivo" \xe9 obrigat\xf3rio');if(!a.contextoNegocio||!a.contextoNegocio.trim())throw Error('Campo "Contexto do Neg\xf3cio" \xe9 obrigat\xf3rio');if(!a.contexto||!a.contexto.trim())throw Error('Campo "Contexto da Intera\xe7\xe3o" \xe9 obrigat\xf3rio');let{ai:b,usingUserKey:c}=await i(),d=`
# INFORMA\xc7\xd5ES BASE PARA GERA\xc7\xc3O DO PROMPT MESTRE

## IDENTIDADE CENTRAL & EXPERTISE (PERSONA)
${a.persona.trim()}

## OBJETIVO PRINCIPAL
${a.objetivo.trim()}

## CONTEXTO DO NEG\xd3CIO
${a.contextoNegocio.trim()}

## CONTEXTO DA INTERA\xc7\xc3O
${a.contexto.trim()}
`;a.ferramentas.length>0&&(d+=`
## FERRAMENTAS DISPON\xcdVEIS (TOOLS)
`,a.ferramentas.forEach(a=>{d+=`- **${a.nome}**: ${a.descricao}
`})),a.variaveisDinamicas.length>0&&(d+=`
## VARI\xc1VEIS DIN\xc2MICAS
`,a.variaveisDinamicas.forEach(a=>{d+=`- **{{${a.chave}}}**: (Valor de exemplo: ${a.valor})
`})),d+=`
## REGRAS CR\xcdTICAS INVIOL\xc1VEIS
${a.regras.map(a=>`- ${a}`).join("\n")}
`,a.exemplos.length>0&&(d+=`
## EXEMPLOS (FEW-SHOT LEARNING)
`,a.exemplos.forEach(a=>{d+=`### Exemplo:
- **Usu\xe1rio:** ${a.user}
- **Agente:** ${a.agent}
`})),a.fluxos&&a.fluxos.length>0&&(d+=`
## FLUXOS DE INTERA\xc7\xc3O ESPEC\xcdFICOS
`,a.fluxos.forEach(a=>{d+=`### Fluxo: ${a.nome} (${a.tipoPrompt})
- Objetivo: ${a.objetivo}
`,a.baseConhecimentoRAG&&(d+=`- Contexto/RAG: ${a.baseConhecimentoRAG}
`),a.reforcarCoT&&(d+=`- [REFOR\xc7AR CHAIN-OF-THOUGHT NESTE FLUXO]
`),a.ativarGuardrails&&(d+=`- [ATIVAR GUARDRAILS ESTRITOS NESTE FLUXO]
`),a.fewShotExamples&&(d+=`- Exemplos do fluxo:
${a.fewShotExamples}
`)})),d+=`
## FORMATO E ESTRUTURA DE RESPOSTA DO AGENTE
- **Formato Alvo do Agente:** ${a.formatoSaida.toUpperCase()}
- **Estrutura Esperada:** ${a.estruturaSaida}
`,["json","xml","yaml"].includes(a.formatoSaida)?d+=`
### RESTRI\xc7\xd5ES ESTRITAS DE FORMATO DO AGENTE (${a.formatoSaida.toUpperCase()})
Para garantir a integridade t\xe9cnica da resposta, as seguintes restri\xe7\xf5es S\xc3O OBRIGAT\xd3RIAS para o Agente Final:
1. **SEM MARKDOWN NA RESPOSTA FINAL:** A resposta do agente N\xc3O DEVE conter blocos de c\xf3digo Markdown. Deve ser apenas o dado puro.
2. **SEM TEXTO CONVERSACIONAL:** A resposta deve come\xe7ar imediatamente com o primeiro caractere v\xe1lido do formato.
`:"text"===a.formatoSaida&&(d+=`
### RESTRI\xc7\xd5ES DE FORMATO DO AGENTE (TEXTO PURO)
1. **LINGUAGEM NATURAL:** A resposta deve ser em texto corrido natural, focado no usu\xe1rio final.
2. **SEM FORMATA\xc7\xc3O COMPLEXA:** Evite uso excessivo de Markdown. NUNCA use blocos de c\xf3digo para texto normal.
`);let f=`
Voc\xea \xe9 um especialista s\xeanior em engenharia de prompts. Sua tarefa \xe9 pegar as informa\xe7\xf5es base fornecidas e expandi-las em um "PROMPT MESTRE" detalhado e robusto.

**INFORMA\xc7\xd5ES BASE:**
---
${d.trim()}
---

**REQUISITOS DO PROMPT MESTRE:**
1. **EXPANS\xc3O INTELIGENTE:** Use as informa\xe7\xf5es base como n\xfacleo. Expanda se\xe7\xf5es, adicione detalhes, explica\xe7\xf5es e exemplos consistentes com a persona.
2. **TAMANHO ALVO:** Aproximadamente **${a.promptSize}** caracteres.
3. **FORMATO DE SA\xcdDA DO PROMPT MESTRE:** O prompt mestre que VOC\xca vai gerar deve estar no formato **${a.masterPromptFormat.toUpperCase()}**.
`;"markdown"===a.masterPromptFormat?f+=`
**ESTRUTURA MARKDOWN ESPERADA (CR\xcdTICO - DEVE SER MARKDOWN 100% COM HIERARQUIA):**

O prompt mestre DEVE seguir uma hierarquia Markdown completa e bem estruturada:

1. **T\xcdTULOS COM HIERARQUIA:**
   - Use # (H1) apenas para o t\xedtulo principal do prompt
   - Use ## (H2) para se\xe7\xf5es principais (PERSONA, OBJETIVO, CONTEXTO, REGRAS, etc.)
   - Use ### (H3) para subse\xe7\xf5es dentro de cada se\xe7\xe3o principal
   - Use #### (H4) para sub-subse\xe7\xf5es quando necess\xe1rio
   - Use ##### (H5) para detalhamentos finos quando necess\xe1rio

2. **FORMATA\xc7\xc3O:**
   - Use **negrito** para destacar conceitos importantes
   - Use *it\xe1lico* para \xeanfase
   - Use c\xf3digo inline (backtick) para nomes de vari\xe1veis, fun\xe7\xf5es ou termos t\xe9cnicos
   - Use listas ordenadas (1., 2., 3.) para instru\xe7\xf5es sequenciais
   - Use listas n\xe3o ordenadas (- ou *) para itens relacionados
   - Use > para cita\xe7\xf5es ou blocos de destaque quando apropriado
   - Use blocos de c\xf3digo (tr\xeas backticks) quando necess\xe1rio

3. **ESTRUTURA ESPERADA:**
   - T\xedtulo principal com #
   - Se\xe7\xf5es principais com ##
   - Subse\xe7\xf5es com ###
   - Conte\xfado formatado com listas, negrito, it\xe1lico e c\xf3digo inline
   - Organiza\xe7\xe3o hier\xe1rquica clara para facilitar leitura por LLMs

4. **EXEMPLO DE ESTRUTURA:**
(BLOCO DE C\xd3DIGO MARKDOWN)
# T\xcdTULO PRINCIPAL DO PROMPT

## PERSONA

### Identidade Central
[conte\xfado detalhado]

### Especializa\xe7\xe3o
[conte\xfado detalhado]

## OBJETIVO

### Objetivo Principal
[conte\xfado detalhado]

## REGRAS

### Regras Cr\xedticas
- Regra 1: [descri\xe7\xe3o]
- Regra 2: [descri\xe7\xe3o]
(FIM DO BLOCO)

Sua resposta deve ser APENAS o texto Markdown do prompt final, SEM explica\xe7\xf5es ou coment\xe1rios adicionais.
`:"json"===a.masterPromptFormat&&(f+=`
**ESTRUTURA JSON ESPERADA (CR\xcdTICO - DEVE SER JSON 100% ESTRUTURADO):**

O prompt mestre DEVE ser um objeto JSON v\xe1lido, bem formatado e estruturado:

1. **FORMATA\xc7\xc3O OBRIGAT\xd3RIA:**
   - Use indenta\xe7\xe3o de 2 espa\xe7os para cada n\xedvel
   - Use quebras de linha ap\xf3s cada chave/valor
   - Use v\xedrgulas apropriadas (n\xe3o v\xedrgula final)
   - Use aspas duplas para todas as strings
   - Use arrays para listas de itens
   - Use objetos aninhados para estruturas hier\xe1rquicas

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

3. **REQUISITOS CR\xcdTICOS:**
   - O JSON DEVE ser v\xe1lido e bem formatado (passar em JSON.parse())
   - Use indenta\xe7\xe3o consistente (2 espa\xe7os por n\xedvel)
   - Strings podem conter quebras de linha \\n quando necess\xe1rio
   - Strings podem conter markdown DENTRO delas se apropriado
   - Estruture de forma hier\xe1rquica para facilitar leitura por LLMs

4. **N\xc3O FA\xc7A:**
   - N\xe3o retorne JSON em um bloco de c\xf3digo markdown (tr\xeas backticks json)
   - N\xe3o adicione explica\xe7\xf5es antes ou depois do JSON
   - N\xe3o use formata\xe7\xe3o compacta (tudo em uma linha)
   - N\xe3o use aspas simples para strings

Sua resposta deve ser APENAS o objeto JSON v\xe1lido, SEM blocos de c\xf3digo markdown, SEM explica\xe7\xf5es, APENAS o JSON puro e bem formatado.
`);let j=g(f,""),k=await (0,e.oo)(j);if(!k.allowed)throw Error(k.reason||"Limite de tokens excedido");let l=await b.models.generateContent({model:"gemini-2.5-pro",contents:f,config:"json"===a.masterPromptFormat?{responseMimeType:"application/json"}:void 0});if(!l.text)throw Error("Resposta vazia do modelo Gemini");let m=g(f,l.text);await (0,e.ex)(m),c&&await (0,h.cI)("gemini",m);let n=l.text.trim();if("json"===a.masterPromptFormat)try{n=(n=n.replace(/^```json\s*/i,"").replace(/\s*```$/i,"").trim()).replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();let a=JSON.parse(n);n=JSON.stringify(a,null,2)}catch(b){console.warn("⚠️ Erro ao formatar JSON, retornando texto original:",b);let a=n.match(/\{[\s\S]*\}/);if(a)try{let b=JSON.parse(a[0]);n=JSON.stringify(b,null,2)}catch(a){console.error("❌ Erro ao extrair JSON:",a)}}return n},l=null,m=null,n=async a=>{let{ai:b,usingUserKey:c,apiKey:d}=await i();m={usingUserKey:c,apiKey:d};try{JSON.parse(a)}catch(a){}l=b.chats.create({model:j,config:{systemInstruction:a}})},o=async(a,b)=>{if(!l)throw Error("Chat n\xe3o iniciado. Selecione uma vers\xe3o de prompt para come\xe7ar.");try{let c=g(a+(b||""),""),d=await (0,e.oo)(c);if(!d.allowed)throw Error(d.reason||"Limite de tokens excedido");let f=await l.sendMessage({message:a});if(!f.text)throw Error("Resposta vazia do modelo Gemini");let i=g(a,f.text);return await (0,e.ex)(i),m?.usingUserKey&&await (0,h.cI)("gemini",i),f.text}catch(a){if(console.error("Error in chat:",a),a.message&&a.message.includes("Limite de tokens"))throw a;throw Error(a.message||"Falha ao se comunicar com a API da Gemini no chat.")}},p=async a=>{let{ai:b,usingUserKey:c,apiKey:e}=await i();try{let c=`
        **Persona do Agente:** ${a.persona}
        **Objetivo Principal:** ${a.objetivo}
        **Contexto do Neg\xf3cio:** ${a.contextoNegocio}
        **Contexto da Intera\xe7\xe3o:** ${a.contexto}
        **Regras:** ${a.regras.join(", ")}
        **Formato de Sa\xedda do Agente:** ${a.formatoSaida.toUpperCase()}
        `,e=`
        Com base no contexto, gere 2-3 exemplos de intera\xe7\xf5es (usu\xe1rio/agente).
        `;["json","xml","yaml"].includes(a.formatoSaida)&&(e+=` IMPORTANTE: A resposta do 'agent' nos exemplos deve ser EXATAMENTE no formato ${a.formatoSaida.toUpperCase()} solicitado.`),e+=`
        **Contexto:**
        ---
        ${c}
        ---
        Retorne os exemplos como um array JSON.
        `;let f=await b.models.generateContent({model:j,contents:e,config:{responseMimeType:"application/json",responseSchema:{type:d.ZU.ARRAY,items:{type:d.ZU.OBJECT,properties:{user:{type:d.ZU.STRING},agent:{type:d.ZU.STRING}},required:["user","agent"]}}}});if(!f.text)throw Error("Resposta vazia do modelo Gemini ao gerar exemplos");return JSON.parse(f.text.trim())}catch(a){throw console.error("Error generating examples:",a),Error("Falha ao gerar exemplos.")}},q=async(a,b,c="")=>{let{ai:d,usingUserKey:e,apiKey:f}=await i();try{let e=b.length>0?b.map((a,b)=>`
### Corre\xe7\xe3o ${b+1}
- **Consulta:** "${a.userQuery}"
- **Resposta Antiga (Ruim):** "${a.originalResponse}"
- **Resposta Nova (Ideal):** "${a.correctedResponse}"
`).join("\n"):"Nenhuma corre\xe7\xe3o espec\xedfica de chat.",f=`
Voc\xea \xe9 um especialista em engenharia de prompts. Refatore o prompt abaixo com base no feedback.
MANTENHA O MESMO FORMATO (Markdown ou JSON) do prompt original.

**PROMPT ATUAL:**
---
${a}
---

**FEEDBACK (CORRE\xc7\xd5ES):**
---
${e}
---

**INSTRU\xc7\xd5ES MANUAIS:**
---
${c.trim()||"Nenhuma instru\xe7\xe3o adicional."}
---

Reescreva o prompt para corrigir os problemas identificados. Retorne APENAS o novo prompt.
`,g=!1;try{JSON.parse(a),g=!0}catch(a){}let h=g?`${f}

**IMPORTANTE - FORMATO JSON:**
- O prompt otimizado DEVE ser um JSON v\xe1lido e bem formatado
- Use indenta\xe7\xe3o de 2 espa\xe7os por n\xedvel
- Use quebras de linha ap\xf3s cada chave/valor
- N\xc3O retorne JSON em bloco de c\xf3digo markdown (sem tr\xeas backticks json)
- Retorne APENAS o objeto JSON puro, bem formatado e estruturado
- Garanta que o JSON seja v\xe1lido e pass\xedvel de parse com JSON.parse()
`:f,i=await d.models.generateContent({model:"gemini-2.5-pro",contents:h,config:g?{responseMimeType:"application/json"}:void 0});if(!i.text)throw Error("Resposta vazia do modelo Gemini ao otimizar prompt");let j=i.text.trim();if(g)try{j=(j=j.replace(/^```json\s*/i,"").replace(/\s*```$/i,"").trim()).replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();let a=JSON.parse(j);j=JSON.stringify(a,null,2)}catch(b){console.warn("⚠️ Erro ao formatar JSON otimizado, tentando extrair JSON:",b);let a=j.match(/\{[\s\S]*\}/);if(a)try{let b=JSON.parse(a[0]);j=JSON.stringify(b,null,2)}catch(a){console.error("❌ Erro ao extrair e formatar JSON:",a)}}return j}catch(a){throw console.error("Error optimizing prompt:",a),Error(a?.message||a?.toString()||"Falha na otimiza\xe7\xe3o.")}},r=async a=>{let{ai:b,usingUserKey:c,apiKey:d}=await i(),e=`
Voc\xea \xe9 um especialista em engenharia de prompts e comunica\xe7\xe3o t\xe9cnica. Sua tarefa \xe9 analisar o prompt de IA fornecido e gerar uma documenta\xe7\xe3o clara, detalhada e pedag\xf3gica sobre ele. O p\xfablico-alvo desta documenta\xe7\xe3o s\xe3o clientes e membros n\xe3o-t\xe9cnicos da equipe do projeto.

A documenta\xe7\xe3o deve explicar:
1. **Objetivo Geral:** Qual \xe9 a principal fun\xe7\xe3o do agente de IA que usar\xe1 este prompt?
2. **Persona e Tom de Voz:** Como o agente se comportar\xe1? Qual \xe9 sua personalidade?
3. **Principais Regras e Limita\xe7\xf5es:** Quais s\xe3o as diretrizes mais importantes que o agente deve seguir?
4. **Entradas e Sa\xeddas:** Que tipo de informa\xe7\xe3o o agente espera e como ele deve formatar suas respostas?
5. **Exemplos Pr\xe1ticos:** Se houver exemplos, explique o que eles demonstram.
6. **Fluxo de Conversa:** Descreva um exemplo de como uma conversa com este agente poderia acontecer.

Use formata\xe7\xe3o Markdown (t\xedtulos, listas, negrito) para tornar o documento f\xe1cil de ler e bem estruturado. A linguagem deve ser simples e evitar jarg\xf5es t\xe9cnicos sempre que poss\xedvel.

**PROMPT PARA ANALISAR:**
---
${a}
---

Retorne APENAS a documenta\xe7\xe3o em Markdown.`;try{let a=await b.models.generateContent({model:"gemini-2.5-pro",contents:e});if(!a.text)throw Error("Resposta vazia do modelo Gemini ao explicar prompt");return a.text}catch(a){throw console.error("Error explaining prompt:",a),Error("Falha ao gerar a explica\xe7\xe3o do prompt.")}},s=async(a,b=3,c=1e3)=>{let d;for(let e=0;e<=b;e++)try{return await a()}catch(f){if(d=f,!(f?.status===503||f?.status===429||f?.status===500||f?.status===502||f?.code===503||f?.code===429||f?.code===500||f?.code===502||f?.message?.includes("overloaded")||f?.message?.includes("try again later")||f?.message?.includes("rate limit")||f?.message?.includes("UNAVAILABLE"))||e===b)throw f;let a=c*Math.pow(2,e);await new Promise(b=>setTimeout(b,a))}throw d},t=async(a,b,c)=>{let{ai:f,usingUserKey:j,apiKey:k}=await i(),l="text/csv"===b||c?.toLowerCase().endsWith(".csv"),m={inlineData:{data:a,mimeType:b}},n=l?`
Analise este arquivo CSV e extraia informa\xe7\xf5es relevantes para criar um prompt de IA.
Identifique padr\xf5es, estruturas de dados, contexto de neg\xf3cio e regras de processamento.

Para arquivos CSV, foque em:
- Entender a estrutura e prop\xf3sito dos dados
- Identificar campos importantes e suas rela\xe7\xf5es
- Extrair contexto de neg\xf3cio dos cabe\xe7alhos e dados
- Identificar regras de valida\xe7\xe3o ou processamento impl\xedcitas

Campos JSON esperados: persona, objetivo, contextoNegocio, contexto, regras (array de strings).
Retorne sempre um JSON v\xe1lido, mesmo que alguns campos estejam vazios.
`:`
Analise o documento e extraia informa\xe7\xf5es para um prompt de IA.
${c?`Nome do arquivo: ${c}
`:""}
Campos JSON esperados: persona, objetivo, contextoNegocio, contexto, regras (array de strings).
Retorne sempre um JSON v\xe1lido, mesmo que alguns campos estejam vazios.
`;try{let a=await s(async()=>{let a=l?{type:d.ZU.OBJECT,properties:{persona:{type:d.ZU.STRING},objetivo:{type:d.ZU.STRING},contextoNegocio:{type:d.ZU.STRING},contexto:{type:d.ZU.STRING},regras:{type:d.ZU.ARRAY,items:{type:d.ZU.STRING}}},required:[]}:{type:d.ZU.OBJECT,properties:{persona:{type:d.ZU.STRING},objetivo:{type:d.ZU.STRING},contextoNegocio:{type:d.ZU.STRING},contexto:{type:d.ZU.STRING},regras:{type:d.ZU.ARRAY,items:{type:d.ZU.STRING}}},required:["persona","objetivo","contextoNegocio","contexto","regras"]},b=g(n,""),c=await (0,e.oo)(b);if(!c.allowed)throw Error(c.reason||"Limite de tokens excedido");let i=await f.models.generateContent({model:"gemini-2.5-pro",contents:{parts:[m,{text:n}]},config:{responseMimeType:"application/json",responseSchema:a}});if(!i.text)throw Error("Resposta vazia do modelo Gemini ao extrair dados");let k=g(n,i.text);return await (0,e.ex)(k),j&&await (0,h.cI)("gemini",k),i},3,500);if(!a||!a.text)throw console.error("Resposta vazia ou inv\xe1lida da API:",a),Error("A API retornou uma resposta vazia. Tente novamente.");let b=a.text.trim();if(!b||"undefined"===b||"null"===b)throw console.error("Texto da resposta est\xe1 vazio ou inv\xe1lido:",b),Error("A API retornou dados inv\xe1lidos. Tente novamente.");try{let a=JSON.parse(b);return{persona:a.persona||"",objetivo:a.objetivo||"",contextoNegocio:a.contextoNegocio||"",contexto:a.contexto||"",regras:Array.isArray(a.regras)?a.regras:[]}}catch(a){console.error("Erro ao fazer parse do JSON:",a),console.error("Texto recebido:",b.substring(0,500));try{let a=b.match(/\{[\s\S]*\}/);if(a){let b=JSON.parse(a[0]);return{persona:b.persona||"",objetivo:b.objetivo||"",contextoNegocio:b.contextoNegocio||"",contexto:b.contexto||"",regras:Array.isArray(b.regras)?b.regras:[]}}}catch(a){console.error("Segunda tentativa de parse tamb\xe9m falhou:",a)}throw Error(`Erro ao processar a resposta da API${c?` para ${c}`:""}. O formato retornado \xe9 inv\xe1lido. Tente novamente.`)}}catch(a){if(console.error("Error analyzing document:",a),a?.message&&!a?.status&&!a?.code)throw a;if(a?.status===503||a?.code===503||a?.message?.includes("overloaded")||a?.message?.includes("UNAVAILABLE"))throw Error("O servi\xe7o est\xe1 temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.");if(a?.status===429||a?.code===429||a?.message?.includes("rate limit"))throw Error("Muitas requisi\xe7\xf5es. Por favor, aguarde alguns segundos antes de tentar novamente.");if(a?.status===400||a?.code===400||a?.message?.includes("400"))throw Error("Formato de arquivo n\xe3o suportado ou inv\xe1lido. Tente converter para PDF ou TXT.");else if(a?.status===401||a?.code===401)throw Error("Erro de autentica\xe7\xe3o. Verifique sua chave de API do Gemini.");else if(a?.status===413||a?.code===413)throw Error("Arquivo muito grande. Tente um arquivo menor ou divida o documento.");else if(a?.message?.includes("JSON")||a?.message?.includes("parse"))throw Error("Erro ao processar a resposta da API. Tente novamente.");else throw Error(a?.message||"Falha ao analisar o documento. Tente novamente mais tarde.")}},u=[{name:"updatePersona",parameters:{type:d.ZU.OBJECT,properties:{text:{type:d.ZU.STRING}},required:["text"]}},{name:"updateObjetivo",parameters:{type:d.ZU.OBJECT,properties:{text:{type:d.ZU.STRING}},required:["text"]}},{name:"updateContextoNegocio",parameters:{type:d.ZU.OBJECT,properties:{text:{type:d.ZU.STRING}},required:["text"]}},{name:"updateContextoInteracao",parameters:{type:d.ZU.OBJECT,properties:{text:{type:d.ZU.STRING}},required:["text"]}},{name:"addRegra",parameters:{type:d.ZU.OBJECT,properties:{text:{type:d.ZU.STRING}},required:["text"]}},{name:"addExemplo",parameters:{type:d.ZU.OBJECT,properties:{user:{type:d.ZU.STRING},agent:{type:d.ZU.STRING}},required:["user","agent"]}}],v=`Voc\xea \xe9 um assistente de preenchimento de formul\xe1rio por voz. Transcreva o \xe1udio do usu\xe1rio e use as ferramentas para atualizar os campos. Responda com [TRANSCRI\xc7\xc3O: ...] seguido de uma confirma\xe7\xe3o curta.`,w=async(a,b)=>{let{ai:c,usingUserKey:d,apiKey:e}=await i();try{return await c.models.generateContent({model:"gemini-2.5-pro",contents:{parts:[{inlineData:{mimeType:b,data:a}},{text:"Processe este comando."}]},config:{systemInstruction:v,tools:[{functionDeclarations:u}]}})}catch(a){throw console.error("Error processing audio:",a),Error("Falha ao processar \xe1udio.")}}},82822:(a,b,c)=>{"use strict";c.d(b,{KA:()=>f,OW:()=>g,YG:()=>h,cI:()=>i,dD:()=>e,tv:()=>j,y1:()=>k});var d=c(36369);async function e(a){try{let{data:{user:b},error:c}=await d.ND.auth.getUser();if(c||!b)return null;let{data:e,error:f}=await d.ND.from("user_api_keys").select("*").eq("user_id",b.id).eq("provider",a).eq("is_active",!0).maybeSingle();if(f)return"PGRST116"!==f.code&&console.warn("Erro ao buscar API Key do usu\xe1rio:",f.message),null;if(!e)return null;return e.api_key||null}catch(a){return console.warn("Erro ao buscar API Key do usu\xe1rio (ignorado):",a?.message||a),null}}async function f(a,b,c=!1){try{let e,{data:{user:f}}=await d.ND.auth.getUser();if(!f)throw Error("Usu\xe1rio n\xe3o autenticado");if(!b||b.trim().length<10)throw Error("API Key inv\xe1lida");let{data:g}=await d.ND.from("user_api_keys").select("id").eq("user_id",f.id).eq("provider",a).eq("is_active",!0).maybeSingle();if(g){let{data:a,error:f}=await d.ND.from("user_api_keys").update({api_key:b.trim(),is_global:c,updated_at:new Date().toISOString()}).eq("id",g.id).select().maybeSingle();if(f)throw f;if(!a)throw Error("Erro ao atualizar API Key");e=a}else{await d.ND.from("user_api_keys").update({is_active:!1}).eq("user_id",f.id).eq("provider",a);let{data:g,error:h}=await d.ND.from("user_api_keys").insert({user_id:f.id,provider:a,api_key:b.trim(),is_global:c,is_active:!0}).select().maybeSingle();if(h)throw h;if(!g)throw Error("Erro ao criar API Key");e=g}return e}catch(a){throw console.error("Erro ao salvar API Key:",a),Error(a.message||"Erro ao salvar API Key")}}async function g(){try{let{data:{user:a}}=await d.ND.auth.getUser();if(!a)return[];let{data:b,error:c}=await d.ND.from("user_api_keys").select("*").eq("user_id",a.id).order("created_at",{ascending:!1});if(c)throw c;return b||[]}catch(a){return console.error("Erro ao listar API Keys:",a),[]}}async function h(a){try{let{data:{user:b}}=await d.ND.auth.getUser();if(!b)throw Error("Usu\xe1rio n\xe3o autenticado");let{error:c}=await d.ND.from("user_api_keys").delete().eq("id",a).eq("user_id",b.id);if(c)throw c}catch(a){throw console.error("Erro ao deletar API Key:",a),Error(a.message||"Erro ao deletar API Key")}}async function i(a,b){try{let{data:{user:c}}=await d.ND.auth.getUser();if(!c)return;let{data:e}=await d.ND.from("user_api_keys").select("usage_count, total_tokens_used").eq("user_id",c.id).eq("provider",a).eq("is_active",!0).maybeSingle();if(!e)return;let{error:f}=await d.ND.from("user_api_keys").update({usage_count:(e.usage_count||0)+1,total_tokens_used:(e.total_tokens_used||0)+b,last_used_at:new Date().toISOString()}).eq("user_id",c.id).eq("provider",a).eq("is_active",!0);f&&console.error("Erro ao atualizar estat\xedsticas:",f)}catch(a){console.error("Erro ao atualizar uso da API Key:",a)}}async function j(a){try{if(!a||0===a.trim().length)return!1;a.startsWith("AIzaSy")||console.warn("API Key do Gemini n\xe3o tem o formato esperado (deve come\xe7ar com AIzaSy)");let b=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(a.trim())}`,{method:"GET",headers:{"Content-Type":"application/json"}});if(!b.ok){let a=await b.text();return console.error("Erro na valida\xe7\xe3o Gemini:",b.status,a),!1}let c=await b.json();return c&&Array.isArray(c.models)&&c.models.length>0}catch(a){if(console.error("Erro ao validar API Key do Gemini:",a),a.message?.includes("Failed to fetch")||a.message?.includes("NetworkError"))return console.warn("Erro de rede ao validar. Permitindo salvar a chave para tentativa posterior."),!0;return!1}}async function k(a){try{if(!a||0===a.trim().length)return!1;a.startsWith("sk-")||console.warn("API Key da OpenAI n\xe3o tem o formato esperado (deve come\xe7ar com sk-)");let b=await fetch("https://api.openai.com/v1/models",{method:"GET",headers:{Authorization:`Bearer ${a.trim()}`,"Content-Type":"application/json"}});if(!b.ok){let a=await b.text();return console.error("Erro na valida\xe7\xe3o OpenAI:",b.status,a),b.status,!1}let c=await b.json();return c&&Array.isArray(c.data)&&c.data.length>0}catch(a){if(console.error("Erro ao validar API Key da OpenAI:",a),a.message?.includes("Failed to fetch")||a.message?.includes("NetworkError"))return console.warn("Erro de rede ao validar. Permitindo salvar a chave para tentativa posterior."),!0;return!1}}}};