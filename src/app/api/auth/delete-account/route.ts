import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // We use the regular supabase-js here to get the user's session
    // but we need the SERVICE_ROLE_KEY to actually delete the user from auth.users
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration missing: SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    // 1. Identify the user from their session
    // We create a temporary client with the user's cookies
    const { createServerClient } = await import('@supabase/ssr');
    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    const { data: { user }, error: userError } = await client.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Delete the user using the Admin API (Service Role)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // This will trigger the ON DELETE CASCADE on the public.users table 
    // and subsequently all related data.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Admin delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete account route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
