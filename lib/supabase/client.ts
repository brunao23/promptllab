'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas. O cliente Supabase pode não funcionar corretamente.');
    // Durante o build, podemos não ter as variáveis, então não lançamos erro fatal
    if (typeof window === 'undefined') {
      return createBrowserClient('https://placeholder.supabase.co', 'placeholder', {
        db: { schema: 'public' },
        auth: { persistSession: false }
      });
    }
    // No cliente real, isso vai falhar eventualmente, mas permite que o app carregue
  }

  return createBrowserClient(supabaseUrl || '', supabaseAnonKey || '', {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'labprompt-nextjs',
      },
    },
  });
}

