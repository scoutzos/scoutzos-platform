import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

export const signOut = async () => {
    await supabase.auth.signOut();
};
