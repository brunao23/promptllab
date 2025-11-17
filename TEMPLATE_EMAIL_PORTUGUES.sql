-- =====================================================
-- TEMPLATE DE EMAIL DE CONFIRMAÇÃO EM PORTUGUÊS
-- =====================================================
-- Este script NÃO é SQL executável diretamente.
-- Você precisa copiar o conteúdo para o Supabase Dashboard
-- 
-- INSTRUÇÕES:
-- 1. Acesse: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em: Authentication → Email Templates
-- 4. Selecione: "Confirm signup"
-- 5. Cole o conteúdo abaixo nos campos Subject e Body
-- =====================================================

-- ASSUNTO (Subject):
Confirme seu email - LaBPrompT

-- CORPO DO EMAIL (Body) - Cole o HTML abaixo:
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

