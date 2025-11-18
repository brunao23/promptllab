# Criar Bucket "avatars" no Supabase Storage

Para que o upload de avatares funcione, é necessário criar o bucket `avatars` no Supabase Storage.

## Passo a Passo

1. **Acesse o Dashboard do Supabase**
   - Vá para https://app.supabase.com
   - Faça login na sua conta
   - Selecione o projeto correspondente

2. **Navegue para Storage**
   - No menu lateral esquerdo, clique em **Storage**

3. **Criar Novo Bucket**
   - Clique no botão **"New bucket"** ou **"Create bucket"**
   
4. **Configurar o Bucket**
   - **Name**: `avatars` (deve ser exatamente este nome)
   - **Public bucket**: ✅ **SIM** (marque esta opção para permitir acesso público às imagens)
   - Clique em **"Create bucket"**

5. **Configurar Políticas RLS (Opcional mas Recomendado)**
   - Após criar o bucket, clique nele
   - Vá para a aba **"Policies"**
   - Adicione uma política para permitir leitura pública:
     ```sql
     -- Permitir leitura pública
     CREATE POLICY "Public Access"
     ON storage.objects FOR SELECT
     USING ( bucket_id = 'avatars' );
     
     -- Permitir upload apenas para usuários autenticados
     CREATE POLICY "Authenticated users can upload"
     ON storage.objects FOR INSERT
     WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
     
     -- Permitir atualização apenas para o dono do arquivo
     CREATE POLICY "Users can update own files"
     ON storage.objects FOR UPDATE
     USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
     
     -- Permitir exclusão apenas para o dono do arquivo
     CREATE POLICY "Users can delete own files"
     ON storage.objects FOR DELETE
     USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
     ```

6. **Verificar Configurações**
   - Certifique-se de que o bucket está marcado como **Público**
   - Verifique se as políticas RLS estão aplicadas corretamente

## Após Criar o Bucket

Após criar o bucket, o upload de avatares funcionará automaticamente. Não é necessário reiniciar o aplicativo ou fazer deploy novamente.

## Troubleshooting

Se ainda houver erros após criar o bucket:
- Verifique se o nome do bucket é exatamente `avatars` (case-sensitive)
- Verifique se o bucket está marcado como **Público**
- Verifique se as políticas RLS estão configuradas corretamente
- Tente fazer upload novamente após alguns segundos

