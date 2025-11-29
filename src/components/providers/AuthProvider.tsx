'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type UserProfile = {
    id: string;
    email: string;
    tenant_id: string;
    role: string;
    created_at: string;
};

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    error: null,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, tenant_id, role, created_at')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (err) {
            console.error('[AuthProvider] Failed to fetch user profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
        }
    };

    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                setSession(session);
                setUser(session?.user || null);

                if (session?.user) {
                    await fetchUserProfile(session.user.id);
                }
            } catch (err) {
                console.error('[AuthProvider] Session error:', err);
                setError(err instanceof Error ? err.message : 'Failed to get session');
            } finally {
                setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user || null);

            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setProfile(null);
            }

            setLoading(false);
            router.refresh();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setProfile(null);
            router.push('/login');
        } catch (err) {
            console.error('[AuthProvider] Sign out error:', err);
            setError(err instanceof Error ? err.message : 'Failed to sign out');
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, error, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
