-- =====================================================
-- SCHEMA COMPLETO DO LABPROMPT - SUPABASE
-- =====================================================
-- Este script cria todas as tabelas relacionais,
-- políticas RLS, triggers e funções necessárias
-- =====================================================

-- =====================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para buscas de texto

-- =====================================================
-- 2. TABELA DE PERFIS DE USUÁRIO
-- =====================================================
-- Liga-se ao auth.users do Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =====================================================
-- 3. TABELA DE DOCUMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    file_url TEXT, -- URL do arquivo no Supabase Storage (se aplicável)
    content_text TEXT, -- Conteúdo extraído do documento
    metadata JSONB DEFAULT '{}'::jsonb, -- Metadados adicionais
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- =====================================================
-- 4. TABELA DE PROMPTS (Prompt Principal)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT, -- Título opcional do prompt
    persona TEXT NOT NULL,
    objetivo TEXT NOT NULL,
    contexto_negocio TEXT,
    contexto TEXT,
    regras TEXT[], -- Array de regras
    formato_saida TEXT NOT NULL CHECK (formato_saida IN ('json', 'markdown', 'text', 'xml', 'yaml')),
    master_prompt_format TEXT NOT NULL DEFAULT 'markdown' CHECK (master_prompt_format IN ('markdown', 'json')),
    estrutura_saida TEXT,
    prompt_size INTEGER DEFAULT 5000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_is_active ON public.prompts(is_active) WHERE is_active = true;

-- =====================================================
-- 5. TABELA DE VERSÕES DE PROMPTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL, -- Conteúdo final do prompt gerado
    format TEXT NOT NULL CHECK (format IN ('json', 'markdown', 'text', 'xml', 'yaml')),
    master_format TEXT NOT NULL DEFAULT 'markdown' CHECK (master_format IN ('markdown', 'json')),
    source_data JSONB NOT NULL, -- Armazena o PromptData completo
    is_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(prompt_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_at ON public.prompt_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_is_validated ON public.prompt_versions(is_validated) WHERE is_validated = true;

-- =====================================================
-- 6. TABELA DE EXEMPLOS FEW-SHOT
-- =====================================================
CREATE TABLE IF NOT EXISTS public.few_shot_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    user_text TEXT NOT NULL,
    agent_text TEXT NOT NULL,
    order_index INTEGER DEFAULT 0, -- Para manter a ordem
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_few_shot_examples_prompt_id ON public.few_shot_examples(prompt_id);
CREATE INDEX IF NOT EXISTS idx_few_shot_examples_order ON public.few_shot_examples(prompt_id, order_index);

-- =====================================================
-- 7. TABELA DE VARIÁVEIS DINÂMICAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.variaveis_dinamicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    chave TEXT NOT NULL,
    valor TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_variaveis_dinamicas_prompt_id ON public.variaveis_dinamicas(prompt_id);
CREATE INDEX IF NOT EXISTS idx_variaveis_dinamicas_order ON public.variaveis_dinamicas(prompt_id, order_index);

-- =====================================================
-- 8. TABELA DE FERRAMENTAS (TOOLS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ferramentas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ferramentas_prompt_id ON public.ferramentas(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ferramentas_order ON public.ferramentas(prompt_id, order_index);

-- =====================================================
-- 9. TABELA DE FLUXOS DE INTERAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.fluxos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo_prompt TEXT,
    objetivo TEXT,
    base_conhecimento_rag TEXT,
    few_shot_examples TEXT,
    reforcar_cot BOOLEAN DEFAULT false,
    ativar_guardrails BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fluxos_prompt_id ON public.fluxos(prompt_id);
CREATE INDEX IF NOT EXISTS idx_fluxos_order ON public.fluxos(prompt_id, order_index);

-- =====================================================
-- 10. TABELA DE MENSAGENS DE CHAT
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_version_id UUID NOT NULL REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
    author TEXT NOT NULL CHECK (author IN ('user', 'agent')),
    text TEXT NOT NULL,
    feedback TEXT CHECK (feedback IN ('correct', 'incorrect')),
    is_editing BOOLEAN DEFAULT false,
    correction TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_prompt_version_id ON public.chat_messages(prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_order ON public.chat_messages(prompt_version_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- =====================================================
-- 11. TABELA DE PARES DE OTIMIZAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.optimization_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_version_id UUID NOT NULL REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
    user_query TEXT NOT NULL,
    original_response TEXT NOT NULL,
    corrected_response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_optimization_pairs_prompt_version_id ON public.optimization_pairs(prompt_version_id);

-- =====================================================
-- 12. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas
-- Remover triggers existentes antes de criar novos
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_documents ON public.documents;
DROP TRIGGER IF EXISTS set_updated_at_prompts ON public.prompts;
DROP TRIGGER IF EXISTS set_updated_at_prompt_versions ON public.prompt_versions;
DROP TRIGGER IF EXISTS set_updated_at_few_shot_examples ON public.few_shot_examples;
DROP TRIGGER IF EXISTS set_updated_at_variaveis_dinamicas ON public.variaveis_dinamicas;
DROP TRIGGER IF EXISTS set_updated_at_ferramentas ON public.ferramentas;
DROP TRIGGER IF EXISTS set_updated_at_fluxos ON public.fluxos;
DROP TRIGGER IF EXISTS set_updated_at_chat_messages ON public.chat_messages;
DROP TRIGGER IF EXISTS set_updated_at_optimization_pairs ON public.optimization_pairs;

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_documents
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_prompts
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_prompt_versions
    BEFORE UPDATE ON public.prompt_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_few_shot_examples
    BEFORE UPDATE ON public.few_shot_examples
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_variaveis_dinamicas
    BEFORE UPDATE ON public.variaveis_dinamicas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_ferramentas
    BEFORE UPDATE ON public.ferramentas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_fluxos
    BEFORE UPDATE ON public.fluxos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_chat_messages
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_optimization_pairs
    BEFORE UPDATE ON public.optimization_pairs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 13. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- =====================================================
-- Cria um perfil automaticamente quando um usuário é criado no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente antes de criar novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 14. FUNÇÃO PARA OBTER VERSÃO ATUAL DO PROMPT
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_latest_prompt_version(prompt_uuid UUID)
RETURNS TABLE (
    id UUID,
    version_number INTEGER,
    content TEXT,
    format TEXT,
    master_format TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.id,
        pv.version_number,
        pv.content,
        pv.format,
        pv.master_format,
        pv.created_at
    FROM public.prompt_versions pv
    WHERE pv.prompt_id = prompt_uuid
    ORDER BY pv.version_number DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 15. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.few_shot_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variaveis_dinamicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_pairs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA PROFILES
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- POLÍTICAS PARA DOCUMENTS
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

-- Usuários podem ver apenas seus próprios documentos
CREATE POLICY "Users can view own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem inserir apenas seus próprios documentos
CREATE POLICY "Users can insert own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas seus próprios documentos
CREATE POLICY "Users can update own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

-- Usuários podem deletar apenas seus próprios documentos
CREATE POLICY "Users can delete own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA PROMPTS
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can insert own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON public.prompts;

-- Usuários podem ver apenas seus próprios prompts
CREATE POLICY "Users can view own prompts"
    ON public.prompts FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem inserir apenas seus próprios prompts
CREATE POLICY "Users can insert own prompts"
    ON public.prompts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas seus próprios prompts
CREATE POLICY "Users can update own prompts"
    ON public.prompts FOR UPDATE
    USING (auth.uid() = user_id);

-- Usuários podem deletar apenas seus próprios prompts
CREATE POLICY "Users can delete own prompts"
    ON public.prompts FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA PROMPT_VERSIONS
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can insert own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can update own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can delete own prompt versions" ON public.prompt_versions;

-- Usuários podem ver versões apenas dos seus prompts
CREATE POLICY "Users can view own prompt versions"
    ON public.prompt_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = prompt_versions.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem inserir versões apenas nos seus prompts
CREATE POLICY "Users can insert own prompt versions"
    ON public.prompt_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = prompt_versions.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem atualizar versões apenas dos seus prompts
CREATE POLICY "Users can update own prompt versions"
    ON public.prompt_versions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = prompt_versions.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem deletar versões apenas dos seus prompts
CREATE POLICY "Users can delete own prompt versions"
    ON public.prompt_versions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = prompt_versions.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA FEW_SHOT_EXAMPLES
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own few shot examples" ON public.few_shot_examples;
DROP POLICY IF EXISTS "Users can insert own few shot examples" ON public.few_shot_examples;
DROP POLICY IF EXISTS "Users can update own few shot examples" ON public.few_shot_examples;
DROP POLICY IF EXISTS "Users can delete own few shot examples" ON public.few_shot_examples;

-- Usuários podem ver exemplos apenas dos seus prompts
CREATE POLICY "Users can view own few shot examples"
    ON public.few_shot_examples FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = few_shot_examples.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem inserir exemplos apenas nos seus prompts
CREATE POLICY "Users can insert own few shot examples"
    ON public.few_shot_examples FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = few_shot_examples.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem atualizar exemplos apenas dos seus prompts
CREATE POLICY "Users can update own few shot examples"
    ON public.few_shot_examples FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = few_shot_examples.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem deletar exemplos apenas dos seus prompts
CREATE POLICY "Users can delete own few shot examples"
    ON public.few_shot_examples FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = few_shot_examples.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA VARIAVEIS_DINAMICAS
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own variaveis dinamicas" ON public.variaveis_dinamicas;
DROP POLICY IF EXISTS "Users can insert own variaveis dinamicas" ON public.variaveis_dinamicas;
DROP POLICY IF EXISTS "Users can update own variaveis dinamicas" ON public.variaveis_dinamicas;
DROP POLICY IF EXISTS "Users can delete own variaveis dinamicas" ON public.variaveis_dinamicas;

-- Usuários podem ver variáveis apenas dos seus prompts
CREATE POLICY "Users can view own variaveis dinamicas"
    ON public.variaveis_dinamicas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = variaveis_dinamicas.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem inserir variáveis apenas nos seus prompts
CREATE POLICY "Users can insert own variaveis dinamicas"
    ON public.variaveis_dinamicas FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = variaveis_dinamicas.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem atualizar variáveis apenas dos seus prompts
CREATE POLICY "Users can update own variaveis dinamicas"
    ON public.variaveis_dinamicas FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = variaveis_dinamicas.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem deletar variáveis apenas dos seus prompts
CREATE POLICY "Users can delete own variaveis dinamicas"
    ON public.variaveis_dinamicas FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = variaveis_dinamicas.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA FERRAMENTAS
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own ferramentas" ON public.ferramentas;
DROP POLICY IF EXISTS "Users can insert own ferramentas" ON public.ferramentas;
DROP POLICY IF EXISTS "Users can update own ferramentas" ON public.ferramentas;
DROP POLICY IF EXISTS "Users can delete own ferramentas" ON public.ferramentas;

-- Usuários podem ver ferramentas apenas dos seus prompts
CREATE POLICY "Users can view own ferramentas"
    ON public.ferramentas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = ferramentas.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem inserir ferramentas apenas nos seus prompts
CREATE POLICY "Users can insert own ferramentas"
    ON public.ferramentas FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = ferramentas.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem atualizar ferramentas apenas dos seus prompts
CREATE POLICY "Users can update own ferramentas"
    ON public.ferramentas FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = ferramentas.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem deletar ferramentas apenas dos seus prompts
CREATE POLICY "Users can delete own ferramentas"
    ON public.ferramentas FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = ferramentas.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA FLUXOS
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own fluxos" ON public.fluxos;
DROP POLICY IF EXISTS "Users can insert own fluxos" ON public.fluxos;
DROP POLICY IF EXISTS "Users can update own fluxos" ON public.fluxos;
DROP POLICY IF EXISTS "Users can delete own fluxos" ON public.fluxos;

-- Usuários podem ver fluxos apenas dos seus prompts
CREATE POLICY "Users can view own fluxos"
    ON public.fluxos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = fluxos.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem inserir fluxos apenas nos seus prompts
CREATE POLICY "Users can insert own fluxos"
    ON public.fluxos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = fluxos.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem atualizar fluxos apenas dos seus prompts
CREATE POLICY "Users can update own fluxos"
    ON public.fluxos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = fluxos.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem deletar fluxos apenas dos seus prompts
CREATE POLICY "Users can delete own fluxos"
    ON public.fluxos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = fluxos.prompt_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA CHAT_MESSAGES
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;

-- Usuários podem ver mensagens apenas das versões dos seus prompts
CREATE POLICY "Users can view own chat messages"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prompt_versions pv
            JOIN public.prompts p ON p.id = pv.prompt_id
            WHERE pv.id = chat_messages.prompt_version_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem inserir mensagens apenas nas versões dos seus prompts
CREATE POLICY "Users can insert own chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompt_versions pv
            JOIN public.prompts p ON p.id = pv.prompt_id
            WHERE pv.id = chat_messages.prompt_version_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem atualizar mensagens apenas das versões dos seus prompts
CREATE POLICY "Users can update own chat messages"
    ON public.chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompt_versions pv
            JOIN public.prompts p ON p.id = pv.prompt_id
            WHERE pv.id = chat_messages.prompt_version_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem deletar mensagens apenas das versões dos seus prompts
CREATE POLICY "Users can delete own chat messages"
    ON public.chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompt_versions pv
            JOIN public.prompts p ON p.id = pv.prompt_id
            WHERE pv.id = chat_messages.prompt_version_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA OPTIMIZATION_PAIRS
-- =====================================================
-- Remover políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Users can view own optimization pairs" ON public.optimization_pairs;
DROP POLICY IF EXISTS "Users can insert own optimization pairs" ON public.optimization_pairs;
DROP POLICY IF EXISTS "Users can update own optimization pairs" ON public.optimization_pairs;
DROP POLICY IF EXISTS "Users can delete own optimization pairs" ON public.optimization_pairs;

-- Usuários podem ver pares apenas das versões dos seus prompts
CREATE POLICY "Users can view own optimization pairs"
    ON public.optimization_pairs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.prompt_versions pv
            JOIN public.prompts p ON p.id = pv.prompt_id
            WHERE pv.id = optimization_pairs.prompt_version_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem inserir pares apenas nas versões dos seus prompts
CREATE POLICY "Users can insert own optimization pairs"
    ON public.optimization_pairs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompt_versions pv
            JOIN public.prompts p ON p.id = pv.prompt_id
            WHERE pv.id = optimization_pairs.prompt_version_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem atualizar pares apenas das versões dos seus prompts
CREATE POLICY "Users can update own optimization pairs"
    ON public.optimization_pairs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompt_versions pv
            JOIN public.prompts p ON p.id = pv.prompt_id
            WHERE pv.id = optimization_pairs.prompt_version_id
            AND p.user_id = auth.uid()
        )
    );

-- Usuários podem deletar pares apenas das versões dos seus prompts
CREATE POLICY "Users can delete own optimization pairs"
    ON public.optimization_pairs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.prompt_versions pv
            JOIN public.prompts p ON p.id = pv.prompt_id
            WHERE pv.id = optimization_pairs.prompt_version_id
            AND p.user_id = auth.uid()
        )
    );

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para criar toda a estrutura do banco de dados
-- =====================================================

