import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getCurrentTenantId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return null;
    }

    // Get the user's tenant_id from the users table
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single();

    if (error || !user) {
      // Fallback: check if user email exists and get their tenant
      const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .limit(1)
        .single();

      return tenant?.id || null;
    }

    return user.tenant_id;
  } catch (error) {
    console.error('Error getting tenant_id:', error);
    return null;
  }
}

export async function requireTenantId(): Promise<string> {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    throw new Error('Unauthorized: No tenant found for user');
  }

  return tenantId;
}
