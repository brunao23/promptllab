-- Schema para gerenciamento de API Keys dos usuários
-- Permite que usuários usem suas próprias API Keys quando necessário

-- Tabela para armazenar API Keys dos usuários
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai')),
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false, -- Se true, será usada globalmente quando a API do sistema falhar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(is_active) WHERE is_active = true;

-- Índice único parcial: Garantir que cada usuário tenha apenas uma API Key ativa por provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_api_keys_unique_active 
    ON user_api_keys(user_id, provider) 
    WHERE is_active = true;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_user_api_keys_updated_at();

-- RLS (Row Level Security)
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias API Keys
CREATE POLICY "Users can view their own API keys"
    ON user_api_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Usuários só podem inserir suas próprias API Keys
CREATE POLICY "Users can insert their own API keys"
    ON user_api_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem atualizar suas próprias API Keys
CREATE POLICY "Users can update their own API keys"
    ON user_api_keys
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem deletar suas próprias API Keys
CREATE POLICY "Users can delete their own API keys"
    ON user_api_keys
    FOR DELETE
    USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE user_api_keys IS 'Armazena API Keys dos usuários para uso quando a API do sistema falhar ou quando o usuário quiser usar sua própria chave';
COMMENT ON COLUMN user_api_keys.provider IS 'Provedor da API: gemini ou openai';
COMMENT ON COLUMN user_api_keys.is_global IS 'Se true, será usada globalmente quando a API do sistema falhar';
COMMENT ON COLUMN user_api_keys.total_tokens_used IS 'Total de tokens usados com esta API Key';

