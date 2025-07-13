import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
const AuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('login');
    // Login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // Signup state
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    // Shared state
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);
    useEffect(() => {
        if (searchParams.get('status') === 'signup_success') {
            setSignupSuccess(true);
            setActiveTab('login');
        }
    }, [searchParams]);
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);
        if (error) {
            setError(error.message);
        }
        else {
            navigate('/dashboard');
        }
    };
    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        setLoading(false);
        if (error) {
            setError(error.message);
        }
        else if (data.user) {
            navigate('/login?status=signup_success');
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-background px-4", children: _jsx("div", { className: "w-full max-w-md", children: _jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "bg-card rounded-2xl shadow-sm border p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Link, { to: "/", className: "inline-block", children: _jsx("span", { className: "text-3xl font-bold text-primary", children: "Rentify" }) }), _jsx("h1", { className: "text-2xl font-bold mt-4", children: activeTab === 'login' ? 'Welcome Back' : 'Create Your Account' }), _jsx("p", { className: "text-muted-foreground mt-1", children: activeTab === 'login'
                                    ? 'Sign in to continue your rental journey.'
                                    : 'Join our community to start renting and earning.' })] }), _jsxs("div", { className: "flex border-b mb-6", children: [_jsx("button", { onClick: () => { setActiveTab('login'); setError(null); }, className: `flex-1 py-3 font-medium text-sm ${activeTab === 'login' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`, children: "Sign In" }), _jsx("button", { onClick: () => { setActiveTab('signup'); setError(null); }, className: `flex-1 py-3 font-medium text-sm ${activeTab === 'signup' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`, children: "Create Account" })] }), activeTab === 'login' && (_jsxs("form", { className: "space-y-6", onSubmit: handleLogin, children: [error && (_jsxs("div", { className: "p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm", children: [_jsx(AlertCircle, { size: 16 }), _jsx("span", { children: error })] })), signupSuccess && (_jsxs("div", { className: "p-3 bg-green-500/10 text-green-700 rounded-md flex items-center gap-2 text-sm", children: [_jsx(CheckCircle, { size: 16 }), _jsx("span", { children: "Sign up successful! Please check your email to confirm your account." })] })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium mb-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(Mail, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, className: "w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(Lock, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "password", name: "password", type: showPassword ? 'text' : 'password', autoComplete: "current-password", required: true, className: "w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer", children: showPassword ? _jsx(EyeOff, { className: "h-5 w-5 text-muted-foreground" }) : _jsx(Eye, { className: "h-5 w-5 text-muted-foreground" }) })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "remember-me", name: "remember-me", type: "checkbox", className: "h-4 w-4 border-border rounded focus:ring-primary" }), _jsx("label", { htmlFor: "remember-me", className: "ml-2 block text-sm", children: "Remember me" })] }), _jsx("div", { className: "text-sm", children: _jsx(Link, { to: "/request-password-reset", className: "font-medium text-primary hover:underline", children: "Forgot password?" }) })] }), _jsx(Button, { type: "submit", className: "w-full", size: "lg", disabled: loading, children: loading ? 'Signing In...' : 'Sign In' })] })), activeTab === 'signup' && (_jsxs("form", { className: "space-y-6", onSubmit: handleSignup, children: [error && (_jsxs("div", { className: "p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm", children: [_jsx(AlertCircle, { size: 16 }), _jsx("span", { children: error })] })), _jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium mb-1", children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(User, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "name", name: "name", type: "text", autoComplete: "name", required: true, className: "w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "John Doe", value: fullName, onChange: (e) => setFullName(e.target.value) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "signup-email", className: "block text-sm font-medium mb-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(Mail, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "signup-email", name: "email", type: "email", autoComplete: "email", required: true, className: "w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "signup-password", className: "block text-sm font-medium mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(Lock, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "signup-password", name: "password", type: showPassword ? 'text' : 'password', required: true, className: "w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer", children: showPassword ? _jsx(EyeOff, { className: "h-5 w-5 text-muted-foreground" }) : _jsx(Eye, { className: "h-5 w-5 text-muted-foreground" }) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirm-password", className: "block text-sm font-medium mb-1", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(Lock, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "confirm-password", name: "confirm-password", type: showConfirmPassword ? 'text' : 'password', required: true, className: "w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer", children: showConfirmPassword ? _jsx(EyeOff, { className: "h-5 w-5 text-muted-foreground" }) : _jsx(Eye, { className: "h-5 w-5 text-muted-foreground" }) })] })] }), _jsx(Button, { type: "submit", className: "w-full", size: "lg", disabled: loading, children: loading ? 'Creating Account...' : 'Create Account' })] }))] }) }) }));
};
export default AuthPage;
