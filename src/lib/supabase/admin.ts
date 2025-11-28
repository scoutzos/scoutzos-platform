import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export async function getTenantIdForUser(userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('tenant_id')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error('Failed to get tenant_id for user:', error);
        return null;
    }

    return data.tenant_id;
}
