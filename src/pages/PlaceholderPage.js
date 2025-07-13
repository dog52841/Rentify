import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
const PlaceholderPage = ({ title, description }) => {
    return (_jsxs("div", { className: "text-center py-20", children: [_jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 260, damping: 20 }, className: "inline-block p-6 bg-muted/50 rounded-full mb-6", children: _jsx(Wrench, { className: "h-12 w-12 text-primary" }) }), _jsx("h1", { className: "text-4xl font-bold mb-4", children: title }), _jsx("p", { className: "text-muted-foreground mb-8 max-w-lg mx-auto", children: description || `This page is currently under construction. Check back soon for exciting updates!` }), _jsx(Link, { to: "/", className: "px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity", children: "Back to Home" })] }));
};
export default PlaceholderPage;
