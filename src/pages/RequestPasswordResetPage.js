import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
const RequestPasswordResetPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const handlePasswordResetRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        setLoading(false);
        if (error) {
            setError(error.message);
        }
        else {
            setSuccess(true);
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-background px-4", children: _jsx("div", { className: "w-full max-w-md", children: _jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "bg-card rounded-2xl shadow-sm border p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Forgot Password?" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "No problem. Enter your email address and we'll send you a link to reset it." })] }), _jsxs("form", { className: "space-y-6", onSubmit: handlePasswordResetRequest, children: [error && (_jsxs("div", { className: "p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm", children: [_jsx(AlertCircle, { size: 16 }), _jsx("span", { children: error })] })), success ? (_jsxs("div", { className: "p-3 bg-green-500/10 text-green-700 rounded-md flex items-center gap-2 text-sm", children: [_jsx(CheckCircle, { size: 16 }), _jsx("span", { children: "If an account with that email exists, a password reset link has been sent." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium mb-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(Mail, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, className: "w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value) })] })] }), _jsx(Button, { type: "submit", className: "w-full", size: "lg", disabled: loading, children: loading ? 'Sending...' : 'Send Reset Link' })] }))] }), _jsx("div", { className: "mt-6 text-center text-sm", children: _jsx(Link, { to: "/auth", className: "font-medium text-primary hover:underline", children: "Back to Sign In" }) })] }) }) }));
};
export default RequestPasswordResetPage;
