# 🚨 SOLUÇÃO DEFINITIVA - ADMIN MASTER

## PROBLEMA
Você é ADMIN MASTER mas o sistema está mostrando "Trial Grátis - 7 dias".

## CAUSA
O registro de admin_users não foi criado corretamente no banco de dados.

---

# 🔥 SOLUÇÃO (3 PASSOS - 2 MINUTOS)

## PASSO 1: Executar Script SQL no Supabase

1. **Abra o Supabase Dashboard**
   - Acesse: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá para SQL Editor**
   - No menu lateral esquerdo, clique em **SQL Editor**

3. **Execute o Script**
   - Abra o arquivo: `CORRIGIR_ADMIN_MASTER_AGORA.sql`
   - **COPIE TODO O CONTEÚDO**
   - **COLE no SQL Editor**
   - Clique em **RUN** (ou Ctrl+Enter)

4. **Verificar Resultado**
   - Na última query, você deve ver:
   ```
   admin_role: super_admin
   subscription_status: active  ← (NÃO "trial"!)
   plan_name: 🔐 Admin Premium Master
   versoes_permitidas: 999999
   tokens_permitidos: 999999999
   pode_compartilhar: true
   ```

---

## PASSO 2: Limpar Cache do Site

1. **No site, clique no botão 💣 (LARANJA)**
   - Está no canto superior direito, ao lado do botão "Sair"
   - Isso vai limpar TUDO e forçar logout

2. **Aguarde o redirecionamento para /login**

---

## PASSO 3: Fazer Login Novamente

1. **Faça login com seu email:**
   - brunocostaads23@gmail.com

2. **Verificar se funcionou:**
   - Na sidebar (esquerda), deve aparecer:
     ```
     🔐 Admin Master          MASTER
     ♾️ Acesso Ilimitado Permanente
     
     Tokens: 0 / ♾️ Ilimitado
     Versões: 0 / ♾️ Ilimitado
     ```

   - NO HEADER (topo), deve aparecer:
     - Botão **🔐** (verde) para acessar Admin
     - Seu nome com ícone 🔐

---

## ✅ RESULTADO ESPERADO

Depois de seguir os 3 passos:

| Antes | Depois |
|-------|--------|
| ❌ Trial Grátis - 7 dias | ✅ **🔐 Admin Master** |
| ❌ Máx. 4 versões/mês | ✅ **♾️ Ilimitado** |
| ❌ 1.000.000 tokens/mês | ✅ **♾️ Ilimitado** |
| ❌ Sem botão Admin | ✅ **Botão 🔐 Admin** |

---

## 🔍 SE NÃO FUNCIONAR

1. Abra o console do navegador (F12)
2. Procure por logs que começam com:
   - `👑 [getCurrentSubscription]`
   - `🔍 [SubscriptionInfo]`
3. Me envie o que aparecer

---

## 💡 O QUE FOI FEITO NO CÓDIGO

1. **Verificação direta por email** em `getCurrentSubscription()`
   - Se email = brunocostaads23@gmail.com → Admin Master automático

2. **Plano ilimitado (-1)** para admin
   - max_prompt_versions: -1 (ilimitado)
   - max_tokens_per_month: -1 (ilimitado)

3. **UI atualizada** para mostrar "MASTER" em vez de "TRIAL"

---

**EXECUTE O SCRIPT SQL AGORA E DEPOIS CLIQUE NO BOTÃO 💣!**

