-- ============================================
-- HABILITAR CRIAÇÃO DE USUÁRIOS VIA ADMIN
-- Execute no Supabase SQL Editor
-- ============================================

-- NOTA: Este script NÃO resolve o problema completamente!
-- O erro "User not allowed" acontece porque o frontend usa a ANON_KEY
-- que não tem permissão para criar usuários.
--
-- SOLUÇÕES:
-- 
-- 1. USAR O DASHBOARD (RECOMENDADO):
--    - Authentication → Users → Add User
--    - Depois execute CRIAR_USUARIO_PREMIUM_MANUAL.sql
--
-- 2. CRIAR API ROUTE (Avançado - requer Service Role Key):
--    - Criar /api/admin/create-user route
--    - Usar SUPABASE_SERVICE_ROLE_KEY (não expor no frontend!)
--
-- ============================================

-- Ver se a tabela admin_users está OK
SELECT * FROM admin_users WHERE email = 'brunocostaads23@gmail.com';

-- Garantir que você é super_admin
UPDATE admin_users
SET 
    role = 'super_admin',
    can_manage_tenants = true,
    can_manage_subscriptions = true,
    can_view_analytics = true,
    is_active = true
WHERE email = 'brunocostaads23@gmail.com';

-- ============================================
-- PARA CRIAR USUÁRIO:
-- 
-- USE O DASHBOARD DO SUPABASE:
-- 1. Authentication → Users
-- 2. Add User
-- 3. Email + Senha
-- 4. Auto Confirm User ✅
-- 5. Create User
--
-- DEPOIS EXECUTE:
-- CRIAR_USUARIO_PREMIUM_MANUAL.sql
-- ============================================

