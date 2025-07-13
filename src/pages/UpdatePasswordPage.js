import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
const UpdatePasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    useEffect(() => {
        // This listener handles the 'PASSWORD_RECOVERY' event from Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Here you could automatically sign the user in if desired
            }
        });
        return () => {
            subscription?.unsubscribe();
        };
    }, []);
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(false);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (error) {
            setError(error.message);
        }
        else {
            setSuccess(true);
            // Optionally, navigate to login after a delay
            setTimeout(() => navigate('/auth'), 3000);
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-background px-4", children: _jsx("div", { className: "w-full max-w-md", children: _jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "bg-card rounded-2xl shadow-sm border p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Update Your Password" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Please enter and confirm your new password below." })] }), _jsxs("form", { className: "space-y-6", onSubmit: handlePasswordUpdate, children: [error && (_jsxs("div", { className: "p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm", children: [_jsx(AlertCircle, { size: 16 }), _jsx("span", { children: error })] })), success ? (_jsxs("div", { className: "p-3 bg-green-500/10 text-green-700 rounded-md flex items-center gap-2 text-sm text-center", children: [_jsx(CheckCircle, { size: 16 }), _jsx("span", { children: "Password updated successfully! Redirecting you to sign in..." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium mb-1", children: "New Password" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(Lock, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "password", type: showPassword ? 'text' : 'password', required: true, className: "w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer", children: showPassword ? _jsx(EyeOff, { className: "h-5 w-5 text-muted-foreground" }) : _jsx(Eye, { className: "h-5 w-5 text-muted-foreground" }) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirm-password", className: "block text-sm font-medium mb-1", children: "Confirm New Password" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(Lock, { className: "h-5 w-5 text-muted-foreground" }) }), _jsx("input", { id: "confirm-password", type: showConfirmPassword ? 'text' : 'password', required: true, className: "w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer", children: showConfirmPassword ? _jsx(EyeOff, { className: "h-5 w-5 text-muted-foreground" }) : _jsx(Eye, { className: "h-5 w-5 text-muted-foreground" }) })] })] }), _jsx(Button, { type: "submit", className: "w-full", size: "lg", disabled: loading, children: loading ? 'Updating...' : 'Update Password' })] }))] })] }) }) }));
};
export default UpdatePasswordPage;
