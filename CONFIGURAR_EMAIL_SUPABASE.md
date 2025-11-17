# 📧 Configurar Email Personalizado no Supabase

Este guia explica como configurar um email de confirmação personalizado em português do Brasil no Supabase.

## 🎯 Objetivos

1. ✅ Traduzir os emails para português do Brasil
2. ✅ Personalizar o conteúdo do email de confirmação
3. ✅ Configurar a URL de redirecionamento correta (não localhost)

## 📋 Passo a Passo

### 1. Acessar Configurações de Email no Supabase

1. Acesse o dashboard do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, vá em **Authentication** → **Email Templates**
4. Ou acesse diretamente: **Project Settings** → **Auth** → **Email Templates**

### 2. Configurar o Template de Confirmação de Email

1. Clique na aba **"Confirm signup"**
2. Você verá o editor de template com campos:
   - **Subject** (Assunto do email)
   - **Body** (Corpo do email em HTML)

### 3. Configurar o Assunto (Subject)

**Cole este texto:**
```
Confirme seu email - LaBPrompT
```

### 4. Configurar o Corpo do Email (Body)

**Substitua todo o conteúdo do Body por este template personalizado:**

```html
<h2>Bem-vindo ao LaBPrompT! 🎉</h2>

<p>Olá!</p>

<p>Obrigado por se cadastrar no <strong>LaBPrompT - Laboratório de Engenharia de Prompt</strong>.</p>

<p>Para começar a usar nossa ferramenta, precisamos confirmar seu endereço de email. Clique no botão abaixo para confirmar:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0891b2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold;">
    Confirmar Email
  </a>
</p>

<p>Ou copie e cole este link no seu navegador:</p>
<p style="word-break: break-all; color: #0891b2;">{{ .ConfirmationURL }}</p>

<p><strong>Este link expira em 24 horas.</strong></p>

<p>Após confirmar seu email, você será redirecionado automaticamente para a ferramenta e poderá começar a criar seus prompts profissionais!</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px;">
  Se você não se cadastrou nesta conta, pode ignorar este email com segurança.
</p>

<p style="color: #6b7280; font-size: 14px;">
  Atenciosamente,<br>
  <strong>Equipe LaBPrompT</strong>
</p>
```

### 5. Configurar URL de Redirecionamento

**IMPORTANTE:** Configure a URL de redirecionamento no Supabase para não usar localhost:

1. Vá em **Project Settings** → **Auth** → **URL Configuration**
2. Na seção **"Redirect URLs"**, adicione:
   - **Para produção:** `https://labprompt.com.br/auth/callback`
   - **Para desenvolvimento local (opcional):** `http://localhost:3000/auth/callback`

**Configure estas URLs:**
```
https://labprompt.com.br/auth/callback
http://localhost:3000/auth/callback
```

⚠️ **IMPORTANTE:** A URL principal deve ser `https://labprompt.com.br/auth/callback`!

### 6. Configurar Site URL

1. Na mesma página **URL Configuration**
2. Em **"Site URL"**, configure:
   - **Produção:** `https://labprompt.com.br`
   - **Desenvolvimento (opcional):** `http://localhost:3000`

### 7. Salvar as Configurações

1. Clique em **"Save"** ou **"Update"** em todas as telas onde fez alterações
2. Aguarde a confirmação de salvamento

## 🧪 Testar a Configuração

### Teste Local:

1. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Crie uma nova conta
3. Verifique seu email (inbox ou spam)
4. Clique no link de confirmação
5. Você deve ser redirecionado para `http://localhost:3000/auth/callback`
6. Depois será redirecionado automaticamente para `/dashboard`

### Teste em Produção:

1. Faça deploy na Vercel
2. Certifique-se de que a URL de redirecionamento está configurada corretamente no Supabase
3. Crie uma nova conta na aplicação de produção
4. Verifique o email de confirmação
5. Clique no link e verifique se redireciona para sua aplicação (não localhost)

## 🔍 Verificação de Variáveis no Template

O Supabase usa variáveis especiais nos templates:

- `{{ .ConfirmationURL }}` - Link de confirmação
- `{{ .Email }}` - Email do usuário
- `{{ .Token }}` - Token de confirmação (menos usado)
- `{{ .TokenHash }}` - Hash do token (menos usado)

## 📝 Templates Adicionais (Opcional)

Você também pode personalizar outros templates:

- **Magic Link** - Para login sem senha
- **Change Email Address** - Para mudança de email
- **Reset Password** - Para recuperação de senha

Siga o mesmo padrão, traduzindo para português do Brasil.

## ⚠️ Troubleshooting

### Problema: Email ainda está em inglês
- **Solução:** Verifique se salvou o template corretamente. Limpe o cache do navegador e tente novamente.

### Problema: Redireciona para localhost em produção
- **Solução:** Verifique se configurou a URL correta em **Redirect URLs** no Supabase. A URL deve ser a da Vercel, não localhost.

### Problema: Link de confirmação não funciona
- **Solução:** Verifique se a rota `/auth/callback` existe no seu aplicativo (já foi criada).

### Problema: Email não chega
- **Solução:** 
  - Verifique a pasta de spam
  - Verifique os logs do Supabase em **Authentication** → **Users** → **Logs**
  - Configure um provedor de email customizado se necessário (SMTP)

## 🎨 Personalização Adicional

Você pode adicionar:
- Logo da sua empresa
- Cores personalizadas (use a cor cyan-600: `#0891b2`)
- Links para redes sociais
- Rodapé com informações legais

Basta editar o HTML do template conforme suas necessidades!

