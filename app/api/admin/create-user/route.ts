import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente com Service Role para operações de admin
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    console.log('🔐 [API] Iniciando criação de usuário via admin...');
    
    // Verificar autenticação do admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair o token do header
    const token = authHeader.replace('Bearer ', '');
    
    // Criar cliente normal para verificar se é admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const normalClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verificar sessão
    const { data: { user }, error: userError } = await normalClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ [API] Erro ao verificar usuário:', userError);
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const { data: adminData } = await normalClient
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    const isAdmin = adminData?.role === 'super_admin' || user.email === 'brunocostaads23@gmail.com';
    
    if (!isAdmin) {
      console.error('❌ [API] Usuário não é admin:', user.email);
      return NextResponse.json(
        { error: 'Apenas administradores podem criar usuários' },
        { status: 403 }
      );
    }

    console.log('✅ [API] Admin verificado:', user.email);

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    console.log('🔐 [API] Criando usuário:', email);

    // Usar Service Role Client para criar usuário
    const adminClient = getServiceRoleClient();

    // 1. Criar usuário
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error('❌ [API] Erro ao criar usuário:', authError);
      return NextResponse.json(
        { error: `Erro ao criar usuário: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Usuário não foi criado corretamente' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    console.log('✅ [API] Usuário criado:', userId);

    // 2. Criar profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
      });

    if (profileError) {
      console.warn('⚠️ [API] Erro ao criar perfil:', profileError);
    }

    // 3. Buscar plano Premium
    const { data: premiumPlan, error: planError } = await adminClient
      .from('plans')
      .select('id')
      .eq('name', 'premium')
      .maybeSingle();

    let planId: string;

    if (planError || !premiumPlan) {
      console.error('❌ [API] Plano premium não encontrado:', planError);
      
      // Criar plano premium se não existir
      const { data: newPlan, error: createPlanError } = await adminClient
        .from('plans')
        .insert({
          name: 'premium',
          display_name: 'Premium',
          description: 'Plano Premium com recursos ilimitados',
          max_versions: 999999,
          max_tokens_per_month: 999999999,
          max_prompt_versions: 999999,
          can_share_chat: true,
          price_monthly: 29.90,
          is_active: true,
        })
        .select()
        .single();
      
      if (createPlanError || !newPlan) {
        return NextResponse.json(
          { error: 'Erro ao criar plano premium' },
          { status: 500 }
        );
      }
      
      console.log('✅ [API] Plano premium criado:', newPlan.id);
      planId = newPlan.id;
    } else {
      planId = premiumPlan.id;
    }

    console.log('✅ [API] Plano premium ID:', planId);

    // 4. Desativar outras subscriptions do usuário
    await adminClient
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId);

    // 5. Criar subscription premium
    const { error: subscriptionError } = await adminClient
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        is_active: true,
        subscription_started_at: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      });

    if (subscriptionError) {
      console.error('❌ [API] Erro ao criar subscription:', subscriptionError);
      return NextResponse.json(
        { error: `Erro ao criar subscription: ${subscriptionError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ [API] Subscription premium criada');

    return NextResponse.json({
      success: true,
      userId,
      message: `Usuário ${email} criado com sucesso e subscription premium ativada!`,
    });
  } catch (error: any) {
    console.error('❌ [API] Erro geral:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

