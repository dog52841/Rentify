// @refresh reload
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

export type Profile = {
    id: string;
    full_name?: string;
    avatar_url?: string;
    banner_url?: string;
    bio?: string;
    website_url?: string;
    social_links?: {
        twitter?: string;
        github?: string;
    };
    instagram?: string;
    twitter?: string;
    facebook?: string;
    role?: string;
    created_at?: string;
};

export type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    setProfile: (profile: Profile | null) => void;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
    authError: string | null;
    setAuthError: (error: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    // This effect runs once to set up the auth listener and fetch initial session.
    useEffect(() => {
        setLoading(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            // The loading state will be set to false in the second useEffect
            // after the profile has been fetched. This prevents a flash of
            // content before the profile is ready.
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // This effect runs whenever the session changes, to fetch the user profile.
    useEffect(() => {
        const fetchProfile = async () => {
            if (session?.user) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select(`*`)
                        .eq('id', session.user.id)
                        .single();
                    if (error && error.code !== 'PGRST116') {
                        throw error;
                    }
                    setProfile(data as Profile | null);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        };
        
        fetchProfile();
    }, [session]);
    
    const refreshProfile = async () => {
        const user = session?.user;
        if (!user) return;
        
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            if (data) {
                setProfile(data as Profile);
            }
        } catch (error) {
            console.error('Exception refreshing profile:', error);
        }
    };

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setAuthError(null);
        
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) {
                setAuthError(error.message);
            }
        } catch (error) {
            if (error instanceof Error) {
                setAuthError(error.message);
            } else {
                setAuthError('An unknown error occurred');
            }
        } finally {
            // The onAuthStateChange listener will handle setting the new state
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        setLoading(true);
        setAuthError(null);
        
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });
            
            if (error) {
                setAuthError(error.message);
                return;
            }
            
            if (data.user) {
                // The onAuthStateChange listener will handle the profile fetch
            }
        } catch (error) {
            if (error instanceof Error) {
                setAuthError(error.message);
            } else {
                setAuthError('An unknown error occurred');
            }
        } finally {
           // The onAuthStateChange listener will handle setting loading to false
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            setProfile(null); 
            setSession(null);
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendPasswordResetEmail = async (email: string) => {
        setLoading(true);
        setAuthError(null);
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth?mode=reset-password`,
            });
            
            if (error) {
                setAuthError(error.message);
            }
        } catch (error) {
            if (error instanceof Error) {
                setAuthError(error.message);
            } else {
                setAuthError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                profile,
                loading,
                setLoading,
                setProfile,
                signIn,
                signUp,
                signOut,
                sendPasswordResetEmail,
                refreshProfile,
                authError,
                setAuthError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 