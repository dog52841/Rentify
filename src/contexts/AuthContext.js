import { jsx as _jsx } from "react/jsx-runtime";
// @refresh reload
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const fetchProfile = useCallback(async (user) => {
        if (!user) {
            setProfile(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            setProfile(data || null);
        }
        catch (error) {
            console.error("Error fetching profile:", error);
            setProfile(null);
        }
    }, []);
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            await fetchProfile(newSession?.user || null);
            if (loading)
                setLoading(false);
        });
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            if (!initialSession) {
                setLoading(false);
            }
        });
        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchProfile, loading]);
    const value = {
        session,
        user: session?.user ?? null,
        profile,
        loading,
        setLoading,
        setProfile,
        refreshProfile: useCallback(async () => {
            await fetchProfile(session?.user || null);
        }, [session, fetchProfile]),
        signIn: async (email, password) => {
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
            }
            catch (error) {
                if (error instanceof Error) {
                    setAuthError(error.message);
                }
                else {
                    setAuthError('An unknown error occurred');
                }
            }
            finally {
                // The onAuthStateChange listener will handle setting the new state
            }
        },
        signUp: async (email, password, fullName) => {
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
            }
            catch (error) {
                if (error instanceof Error) {
                    setAuthError(error.message);
                }
                else {
                    setAuthError('An unknown error occurred');
                }
            }
            finally {
                // The onAuthStateChange listener will handle setting loading to false
            }
        },
        signOut: async () => {
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
        },
        sendPasswordResetEmail: async (email) => {
            setLoading(true);
            setAuthError(null);
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth?mode=reset-password`,
                });
                if (error) {
                    setAuthError(error.message);
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    setAuthError(error.message);
                }
                else {
                    setAuthError('An unknown error occurred');
                }
            }
            finally {
                setLoading(false);
            }
        },
        authError,
        setAuthError,
    };
    return (_jsx(AuthContext.Provider, { value: value, children: !loading && children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
