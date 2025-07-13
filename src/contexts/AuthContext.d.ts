import type { ReactNode } from 'react';
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
export declare const AuthProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
