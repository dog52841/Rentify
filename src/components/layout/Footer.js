import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Github, Send } from 'lucide-react';
import Logo from '../../assets/logo.svg?react';
import { Button } from './../ui/Button';
import { Input } from './../ui/input';
const FooterLink = ({ to, children }) => (_jsx("li", { children: _jsx(Link, { to: to, className: "text-muted-foreground hover:text-primary transition-colors duration-300 ease-in-out", children: children }) }));
const SocialLink = ({ href, icon: Icon }) => (_jsx("a", { href: href, target: "_blank", rel: "noopener noreferrer", className: "text-muted-foreground hover:text-primary transition-colors duration-300", children: _jsx(Icon, { className: "h-6 w-6" }) }));
const Footer = () => {
    const currentYear = new Date().getFullYear();
    const sections = [
        {
            title: "Platform",
            links: [
                { to: "/browse", text: "Browse" },
                { to: "/how-it-works", text: "How It Works" },
                { to: "/safety-tips", text: "Safety" },
            ]
        },
        {
            title: "Company",
            links: [
                { to: "/about", text: "About Us" },
                { to: "/pricing", text: "Pricing" },
            ]
        },
        {
            title: "Legal",
            links: [
                { to: "/terms", text: "Terms of Service" },
                { to: "/privacy", text: "Privacy Policy" },
            ]
        }
    ];
    return (_jsx("footer", { className: "bg-background/95 backdrop-blur-lg border-t", children: _jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 py-16", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-12", children: [_jsxs("div", { className: "lg:col-span-4 space-y-6", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2 group", children: [_jsx(Logo, { className: "h-10 w-10 text-primary group-hover:animate-pulse" }), _jsx("span", { className: "text-3xl font-bold text-foreground group-hover:text-primary transition-colors", children: "Rentify" })] }), _jsx("p", { className: "text-muted-foreground max-w-sm", children: "The ultimate peer-to-peer rental marketplace. Rent anything, from anyone, anywhere." })] }), _jsx("div", { className: "lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8", children: sections.map(section => (_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg text-foreground mb-4", children: section.title }), _jsx("ul", { className: "space-y-3", children: section.links.map(link => _jsx(FooterLink, { to: link.to, children: link.text }, link.to)) })] }, section.title))) })] }), _jsxs("div", { className: "border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: ["\u00A9 ", currentYear, " Rentify Inc. All rights reserved."] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(SocialLink, { href: "https://github.com/your-repo", icon: Github }), _jsx(SocialLink, { href: "#", icon: Twitter }), _jsx(SocialLink, { href: "#", icon: Facebook }), _jsx(SocialLink, { href: "#", icon: Instagram })] })] })] }) }));
};
export default Footer;
