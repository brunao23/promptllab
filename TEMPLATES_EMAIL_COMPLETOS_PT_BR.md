# 📧 Templates de Email em Português do Brasil - Supabase

Este guia contém **TODOS** os templates de email do Supabase traduzidos para português do Brasil.

## 📋 Como Usar

1. Acesse: https://app.supabase.com → Seu Projeto
2. Vá em: **Authentication** → **Email Templates**
3. Para cada template abaixo, clique no nome correspondente e cole o conteúdo

---

## 1️⃣ CONFIRM SIGNUP (Confirmar Cadastro)

### Subject (Assunto):
```
Confirme seu email - LaBPrompT
```

### Body (Corpo):
```html
<h2 style="color: #0891b2; font-family: Arial, sans-serif;">Bem-vindo ao LaBPrompT! 🎉</h2>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Olá!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Obrigado por se cadastrar no <strong>LaBPrompT - Laboratório de Engenharia de Prompt</strong>.
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Para começar a usar nossa ferramenta, precisamos confirmar seu endereço de email. Clique no botão abaixo para confirmar:
</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0891b2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold;
            font-family: Arial, sans-serif;">
    Confirmar Email
  </a>
</div>

<p style="color: #666; font-family: Arial, sans-serif; line-height: 1.6;">
Ou copie e cole este link no seu navegador:
</p>
<p style="color: #0891b2; font-family: Arial, sans-serif; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
{{ .ConfirmationURL }}
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
<strong>Este link expira em 24 horas.</strong>
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Após confirmar seu email, você será redirecionado automaticamente para a ferramenta e poderá começar a criar seus prompts profissionais!
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Se você não se cadastrou nesta conta, pode ignorar este email com segurança.
</p>

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Atenciosamente,<br>
<strong>Equipe LaBPrompT</strong>
</p>
```

---

## 2️⃣ MAGIC LINK (Login sem Senha)

### Subject (Assunto):
```
Seu link de acesso - LaBPrompT
```

### Body (Corpo):
```html
<h2 style="color: #0891b2; font-family: Arial, sans-serif;">Acesse sua conta</h2>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Olá!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Você solicitou um link de acesso para sua conta no <strong>LaBPrompT</strong>.
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Clique no botão abaixo para fazer login automaticamente (sem precisar de senha):
</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0891b2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold;
            font-family: Arial, sans-serif;">
    Acessar Minha Conta
  </a>
</div>

<p style="color: #666; font-family: Arial, sans-serif; line-height: 1.6;">
Ou copie e cole este link no seu navegador:
</p>
<p style="color: #0891b2; font-family: Arial, sans-serif; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
{{ .ConfirmationURL }}
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
<strong>Este link expira em 1 hora e só pode ser usado uma vez.</strong>
</p>

<p style="color: #dc2626; font-family: Arial, sans-serif; line-height: 1.6; font-size: 14px;">
⚠️ <strong>Segurança:</strong> Se você não solicitou este link, ignore este email e verifique a segurança da sua conta.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Atenciosamente,<br>
<strong>Equipe LaBPrompT</strong>
</p>
```

---

## 3️⃣ CHANGE EMAIL ADDRESS (Mudar Email)

### Subject (Assunto):
```
Confirme sua mudança de email - LaBPrompT
```

### Body (Corpo):
```html
<h2 style="color: #0891b2; font-family: Arial, sans-serif;">Mudança de Email</h2>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Olá!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Você solicitou alterar o endereço de email da sua conta no <strong>LaBPrompT</strong>.
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Para confirmar a mudança, clique no botão abaixo:
</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0891b2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold;
            font-family: Arial, sans-serif;">
    Confirmar Novo Email
  </a>
</div>

<p style="color: #666; font-family: Arial, sans-serif; line-height: 1.6;">
Ou copie e cole este link no seu navegador:
</p>
<p style="color: #0891b2; font-family: Arial, sans-serif; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
{{ .ConfirmationURL }}
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
<strong>Este link expira em 24 horas.</strong>
</p>

<p style="color: #dc2626; font-family: Arial, sans-serif; line-height: 1.6; font-size: 14px;">
⚠️ <strong>Importante:</strong> Se você não solicitou esta mudança, ignore este email imediatamente e entre em contato conosco.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Atenciosamente,<br>
<strong>Equipe LaBPrompT</strong>
</p>
```

---

## 4️⃣ RESET PASSWORD (Recuperar Senha)

### Subject (Assunto):
```
Recuperar sua senha - LaBPrompT
```

### Body (Corpo):
```html
<h2 style="color: #0891b2; font-family: Arial, sans-serif;">Recuperação de Senha</h2>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Olá!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Você solicitou redefinir a senha da sua conta no <strong>LaBPrompT</strong>.
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Clique no botão abaixo para criar uma nova senha:
</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0891b2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold;
            font-family: Arial, sans-serif;">
    Criar Nova Senha
  </a>
</div>

<p style="color: #666; font-family: Arial, sans-serif; line-height: 1.6;">
Ou copie e cole este link no seu navegador:
</p>
<p style="color: #0891b2; font-family: Arial, sans-serif; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
{{ .ConfirmationURL }}
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
<strong>Este link expira em 1 hora e só pode ser usado uma vez.</strong>
</p>

<p style="color: #dc2626; font-family: Arial, sans-serif; line-height: 1.6; font-size: 14px;">
⚠️ <strong>Segurança:</strong> Se você não solicitou a recuperação de senha, ignore este email imediatamente. Sua senha atual permanecerá inalterada.
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Após clicar no link, você poderá criar uma nova senha segura para sua conta.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Atenciosamente,<br>
<strong>Equipe LaBPrompT</strong>
</p>
```

---

## 5️⃣ REAUTHENTICATION (Reautenticação)

### Subject (Assunto):
```
Verificação de Segurança - LaBPrompT
```

### Body (Corpo):
```html
<h2 style="color: #0891b2; font-family: Arial, sans-serif;">Verificação de Segurança Necessária</h2>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Olá!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Por motivos de segurança, precisamos verificar sua identidade antes de continuar com uma ação importante na sua conta do <strong>LaBPrompT</strong>.
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Clique no botão abaixo para verificar sua identidade:
</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0891b2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold;
            font-family: Arial, sans-serif;">
    Verificar Minha Identidade
  </a>
</div>

<p style="color: #666; font-family: Arial, sans-serif; line-height: 1.6;">
Ou copie e cole este link no seu navegador:
</p>
<p style="color: #0891b2; font-family: Arial, sans-serif; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
{{ .ConfirmationURL }}
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
<strong>Este link expira em 15 minutos e só pode ser usado uma vez.</strong>
</p>

<p style="color: #dc2626; font-family: Arial, sans-serif; line-height: 1.6; font-size: 14px;">
⚠️ <strong>Atenção:</strong> Esta verificação é necessária para ações sensíveis como mudança de senha ou alteração de configurações de segurança.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Se você não iniciou esta ação, entre em contato conosco imediatamente.
</p>

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Atenciosamente,<br>
<strong>Equipe LaBPrompT</strong>
</p>
```

---

## 6️⃣ INVITE USER (Convidar Usuário) - Opcional

### Subject (Assunto):
```
Você foi convidado para o LaBPrompT
```

### Body (Corpo):
```html
<h2 style="color: #0891b2; font-family: Arial, sans-serif;">Você foi convidado! 🎉</h2>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Olá!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Você foi convidado para se juntar ao <strong>LaBPrompT - Laboratório de Engenharia de Prompt</strong>!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Clique no botão abaixo para aceitar o convite e criar sua conta:
</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0891b2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold;
            font-family: Arial, sans-serif;">
    Aceitar Convite
  </a>
</div>

<p style="color: #666; font-family: Arial, sans-serif; line-height: 1.6;">
Ou copie e cole este link no seu navegador:
</p>
<p style="color: #0891b2; font-family: Arial, sans-serif; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
{{ .ConfirmationURL }}
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Após aceitar o convite, você poderá começar a usar todas as funcionalidades da ferramenta!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
<strong>Este convite expira em 7 dias.</strong>
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Atenciosamente,<br>
<strong>Equipe LaBPrompT</strong>
</p>
```

---

## 📝 Checklist de Configuração

Configure **TODOS** os templates na seguinte ordem:

- [ ] **Confirm signup** - Confirmar Cadastro
- [ ] **Magic link** - Login sem Senha
- [ ] **Change email address** - Mudar Email
- [ ] **Reset password** - Recuperar Senha
- [ ] **Reauthentication** - Reautenticação
- [ ] **Invite user** - Convidar Usuário (opcional)

---

## 🎨 Personalização

Todos os templates usam a cor principal **#0891b2** (cyan). Você pode personalizar:

- **Cor do botão:** Altere `background-color: #0891b2` para sua cor
- **Cor dos links:** Altere `color: #0891b2` para sua cor
- **Nome da empresa:** Substitua "LaBPrompT" pelo nome desejado

---

## ✅ Após Configurar

1. **Salve cada template** clicando em "Save" ou "Update"
2. **Teste cada template** criando cenários de teste:
   - Crie uma nova conta (testa "Confirm signup")
   - Solicite recuperação de senha (testa "Reset password")
   - Solicite magic link (testa "Magic link")
3. **Verifique** se todos os emails chegam em português

---

**Pronto! Agora todos os emails do Supabase estarão em português do Brasil!** 🎉

