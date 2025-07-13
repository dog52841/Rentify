import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Home, LifeBuoy } from 'lucide-react';
import { Button } from '../components/ui/Button';
const NotFoundPage = () => {
    const navigate = useNavigate();
    return (_jsx("div", { className: "min-h-[80vh] flex flex-col items-center justify-center px-4 md:px-8", children: _jsxs("div", { className: "max-w-md w-full mx-auto text-center", children: [_jsxs("div", { className: "relative h-64 mb-8", children: [_jsx(motion.div, { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                delay: 0.2
                            }, className: "absolute inset-0 flex items-center justify-center", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "text-[10rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary/70 to-purple-600/70 leading-none select-none", children: "404" }), _jsx(motion.div, { className: "absolute -top-10 -right-10", animate: {
                                            rotate: [0, 10, -10, 10, 0],
                                            scale: [1, 1.1, 1, 1.05, 1]
                                        }, transition: {
                                            repeat: Infinity,
                                            duration: 5,
                                            ease: "easeInOut"
                                        }, children: _jsx("div", { className: "bg-gradient-to-br from-primary/20 to-purple-500/20 p-4 rounded-full backdrop-blur-sm", children: _jsx(Search, { className: "h-8 w-8 text-primary" }) }) })] }) }), _jsx("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [...Array(20)].map((_, i) => (_jsx(motion.div, { className: "absolute bg-primary/10 rounded-full", style: {
                                    width: Math.random() * 20 + 5,
                                    height: Math.random() * 20 + 5,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }, animate: {
                                    y: [0, -100],
                                    x: [0, Math.random() * 50 - 25],
                                    opacity: [0, 0.7, 0]
                                }, transition: {
                                    duration: Math.random() * 3 + 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 5,
                                    ease: "easeInOut"
                                } }, i))) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 }, children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Page Not Found" }), _jsx("p", { className: "text-muted-foreground mb-8", children: "The page you're looking for doesn't exist or has been moved." })] }), _jsxs(motion.div, { className: "flex flex-col sm:flex-row gap-4 justify-center", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.6 }, children: [_jsxs(Button, { onClick: () => navigate(-1), variant: "outline", className: "gap-2", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Go Back"] }), _jsx(Button, { asChild: true, className: "gap-2", children: _jsxs(Link, { to: "/", children: [_jsx(Home, { className: "h-4 w-4" }), "Home Page"] }) })] }), _jsx(motion.div, { className: "mt-12 text-sm text-muted-foreground", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 1 }, children: _jsxs("p", { className: "flex items-center justify-center gap-2", children: [_jsx(LifeBuoy, { className: "h-4 w-4" }), "Need help? ", _jsx(Link, { to: "/contact", className: "text-primary hover:underline", children: "Contact support" })] }) })] }) }));
};
export default NotFoundPage;
