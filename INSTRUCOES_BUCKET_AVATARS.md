# 🚨 IMPORTANTE: Criar Bucket "avatars" no Supabase Storage

Para que o upload de avatares funcione, você **DEVE** criar o bucket `avatars` manualmente no Dashboard do Supabase.

## 📋 Passo a Passo Detalhado

### 1. Acesse o Dashboard do Supabase
- Abra seu navegador e vá para: **https://app.supabase.com**
- Faça login com suas credenciais
- Selecione seu projeto: **zmagqrcymbletqymclig**

### 2. Navegue para Storage
- No menu lateral esquerdo, clique em **"Storage"** (ícone de pasta/arquivo)
- Você verá a página de Storage do seu projeto

### 3. Criar Novo Bucket
- Clique no botão **"New bucket"** ou **"Create bucket"** (geralmente no canto superior direito ou no centro da tela)

### 4. Configurar o Bucket
Preencha os campos:
- **Name**: Digite exatamente: `avatars` (case-sensitive, tudo minúsculo)
- **Public bucket**: ✅ **MARQUE ESTA OPÇÃO** (muito importante para acesso público às imagens)
- **File size limit**: Opcional, mas você pode definir `5242880` (5MB em bytes)
- **Allowed MIME types**: Opcional, mas você pode adicionar:
  - `image/png`
  - `image/jpeg`
  - `image/jpg`
  - `image/gif`
  - `image/webp`

### 5. Finalizar Criação
- Clique no botão **"Create bucket"** ou **"Create"**

### 6. Verificar Configuração
Após criar:
- Certifique-se de que o bucket aparece na lista de buckets
- Verifique se está marcado como **"Public"** (deve aparecer um ícone ou badge indicando)
- O bucket deve estar acessível e funcionando

## ✅ Após Criar o Bucket

Depois de criar o bucket:
1. Volte para a página de **Configurações** na sua aplicação
2. Tente fazer upload do avatar novamente
3. O upload deve funcionar normalmente

## 🔒 Configurar Políticas RLS (Opcional mas Recomendado)

Para maior segurança, configure as políticas RLS do bucket:

1. No Dashboard do Supabase, vá para **Storage** → Clique no bucket **"avatars"**
2. Vá para a aba **"Policies"**
3. Clique em **"New Policy"** ou use o SQL Editor
4. Execute o seguinte SQL:

```sql
-- Política 1: Permitir leitura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Política 2: Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Política 3: Permitir atualização apenas para o dono do arquivo
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 4: Permitir exclusão apenas para o dono do arquivo
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🐛 Troubleshooting

### O bucket não aparece após criar?
- Recarregue a página (F5)
- Verifique se você está no projeto correto
- Verifique se há mensagens de erro na tela

### Erro de permissão ao fazer upload?
- Certifique-se de que o bucket está marcado como **"Public"**
- Verifique se as políticas RLS foram configuradas corretamente
- Tente fazer logout e login novamente na aplicação

### Ainda recebe erro "Bucket not found"?
- Verifique se o nome do bucket é exatamente `avatars` (case-sensitive)
- Aguarde alguns segundos e tente novamente
- Limpe o cache do navegador e tente novamente

## 📞 Precisa de Ajuda?

Se ainda tiver problemas:
1. Verifique o console do navegador (F12) para mensagens de erro detalhadas
2. Verifique os logs do Supabase Dashboard → Logs → Storage
3. Consulte a documentação oficial do Supabase: https://supabase.com/docs/guides/storage

---

**⚠️ NOTA IMPORTANTE**: Este bucket é necessário para que a funcionalidade de upload de avatares funcione. Sem ele, os usuários não poderão fazer upload de suas fotos de perfil.

