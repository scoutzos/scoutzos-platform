import { createClient } from '@/lib/supabase/client';

export const supabase = createClient();

export const signOut = async () => {
    await supabase.auth.signOut();
};
