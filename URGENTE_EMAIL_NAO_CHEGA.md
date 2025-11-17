# 🚨 URGENTE: Email de Confirmação Não Chega

## ❌ Problema Identificado
O email de confirmação não está chegando após o cadastro.

## ✅ SOLUÇÕES IMEDIATAS

### 1. Verificar Configurações no Supabase Dashboard

**Acesse:** https://app.supabase.com → Seu Projeto → Authentication → Settings

#### A. Verificar se Email está Habilitado:
1. Vá em **Authentication** → **Settings** → **Email Auth**
2. Certifique-se de que **"Enable Email Signup"** está **ATIVADO** ✅
3. Certifique-se de que **"Confirm email"** está **ATIVADO** ✅

#### B. Verificar Configuração de SMTP:
1. Vá em **Project Settings** → **Auth** → **SMTP Settings**
2. Se estiver usando SMTP customizado, verifique se está configurado corretamente
3. **IMPORTANTE:** Se não tem SMTP configurado, o Supabase usa um serviço gratuito limitado
4. **SOLUÇÃO:** Configure um SMTP customizado ou verifique se o email não está na pasta SPAM

#### C. Verificar Redirect URLs:
1. Vá em **Project Settings** → **Auth** → **URL Configuration**
2. Em **"Redirect URLs"**, adicione e certifique-se de que estas URLs estão listadas:
   ```
   https://labprompt.com.br/auth/callback
   https://labprompt.com.br/**
   http://localhost:3000/auth/callback
   ```

#### D. Verificar Site URL:
1. Na mesma página **URL Configuration**
2. Em **"Site URL"**, configure:
   ```
   https://labprompt.com.br
   ```

### 2. Verificar Logs do Supabase

1. Acesse **Authentication** → **Users**
2. Procure pelo usuário pelo email cadastrado
3. Clique no usuário para ver detalhes
4. Verifique os logs de autenticação
5. Veja se há erros ao enviar o email

### 3. Verificar Pasta de SPAM

**MUITO IMPORTANTE:** 
- Verifique a pasta de **SPAM/LIXO ELETRÔNICO**
- Verifique a pasta de **PROMOÇÕES** (Gmail)
- Verifique filtros de email

### 4. Reenviar Email Manualmente

**Use a funcionalidade de reenvio que acabamos de adicionar:**
1. Na página de registro, após criar a conta
2. Clique no botão **"📧 Reenviar Email de Confirmação"**
3. Isso enviará um novo email

### 5. Configurar SMTP Customizado (RECOMENDADO)

Se os emails não estão chegando, configure um SMTP customizado:

1. **Acesse:** Project Settings → Auth → SMTP Settings
2. **Configure:**
   - **SMTP Host:** Seu provedor de email (ex: smtp.gmail.com, smtp.office365.com)
   - **SMTP Port:** 587 (TLS) ou 465 (SSL)
   - **SMTP User:** Seu email
   - **SMTP Password:** Senha do app ou senha do email
   - **Sender Email:** Email que vai aparecer como remetente
   - **Sender Name:** LaBPrompT

**Exemplo Gmail:**
- Host: `smtp.gmail.com`
- Port: `587`
- User: `seuemail@gmail.com`
- Password: `senha_do_app` (use "Senha de App" do Google, não a senha normal)

### 6. Testar Email Diretamente no Supabase

1. Vá em **Authentication** → **Users**
2. Clique no usuário
3. Clique em **"Send confirmation email"** manualmente
4. Verifique se chega

### 7. Verificar Limites do Plano Gratuito

O Supabase tem limites no plano gratuito:
- **Email Rate Limit:** Verifique se não excedeu o limite diário
- Se sim, aguarde ou faça upgrade do plano

### 8. Verificar Template de Email

1. Vá em **Authentication** → **Email Templates** → **Confirm signup**
2. Verifique se o template está configurado
3. Verifique se o assunto está: `Confirme seu email - LaBPrompT`
4. Salve novamente o template

## 🔧 Código Adicionado

Adicionamos uma função de **reenvio de email**:
- Botão "📧 Reenviar Email de Confirmação" aparece após criar conta
- Funciona apenas se o email não foi confirmado ainda

## 📋 Checklist de Verificação

- [ ] Email Signup está ATIVADO no Supabase
- [ ] Confirm Email está ATIVADO no Supabase  
- [ ] Redirect URLs configuradas: `https://labprompt.com.br/auth/callback`
- [ ] Site URL configurada: `https://labprompt.com.br`
- [ ] Verificado pasta SPAM
- [ ] Verificado logs do Supabase
- [ ] SMTP customizado configurado (se necessário)
- [ ] Template de email está configurado
- [ ] Não excedeu limite de emails do plano

## 🆘 Se Nada Funcionar

**ÚLTIMA SOLUÇÃO - Confirmar Email Manualmente no Supabase:**

1. Acesse **Authentication** → **Users**
2. Encontre o usuário pelo email
3. Clique no usuário
4. Em **"Email Confirmed"**, clique em **"Confirm Email"**
5. O usuário poderá fazer login imediatamente

## 📞 Próximos Passos

1. **Agora mesmo:** Acesse o Supabase Dashboard e verifique TODAS as configurações acima
2. **Teste:** Tente criar uma nova conta e verificar SPAM
3. **Reenvie:** Use o botão de reenvio se o email não chegar
4. **Configure SMTP:** Se ainda não funcionar, configure SMTP customizado

**O código está corrigido e pronto. O problema está na configuração do Supabase, não no código!**

