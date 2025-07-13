import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu as MenuIcon, X, User, Search, LogOut, Inbox, Moon, Sun, PlusCircle, Heart, LayoutGrid, Building, UserCircle, Settings, Loader2, ShieldCheck, LifeBuoy, MessageSquare, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { useTheme } from '../ui/ThemeProvider';
import { supabase } from '../../lib/supabaseClient';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '../ui/dropdown-menu';
// Import logo from assets
import LogoSvg from '../../assets/logo.svg?react';
const NavLink = ({ href, label, isActive, isScrolled, onClick }) => (_jsx(Link, { to: href, onClick: onClick, className: cn("px-3 py-2 text-sm font-medium rounded-md transition-colors", isActive
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground"), children: label }));
const ProfileMenu = () => {
    const { user, profile, signOut } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!user)
                return;
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('count', { count: 'exact' })
                    .eq('recipient_id', user.id)
                    .eq('read', false);
                if (error)
                    throw error;
                setUnreadCount(data?.length || 0);
            }
            catch (error) {
                console.error('Error fetching unread messages:', error);
            }
        };
        fetchUnreadCount();
        // Set up subscription for new messages
        const setupSubscription = () => {
            if (!user)
                return null;
            try {
                setSubscriptionStatus('CONNECTING');
                const subscription = supabase
                    .channel('messages-channel')
                    .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${user.id}`,
                }, (payload) => {
                    if (payload.new && !payload.new.read) {
                        setUnreadCount((prev) => prev + 1);
                    }
                })
                    .subscribe((status) => {
                    setSubscriptionStatus(status);
                    console.log('Message subscription status:', status);
                });
                return () => {
                    subscription.unsubscribe();
                };
            }
            catch (error) {
                console.error('Error setting up message subscription:', error);
                setSubscriptionStatus('ERROR');
                return null;
            }
        };
        const cleanup = setupSubscription();
        return () => {
            if (cleanup)
                cleanup();
        };
    }, [user]);
    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        }
        catch (error) {
            console.error('Error signing out:', error);
        }
    };
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", className: "relative rounded-full h-10 w-10 p-0 overflow-hidden", children: [_jsxs(Avatar, { className: "h-10 w-10", children: [_jsx(AvatarImage, { src: profile?.avatar_url, alt: profile?.full_name || "User" }), _jsx(AvatarFallback, { children: profile?.full_name?.charAt(0) || (user?.email?.charAt(0) || "U") })] }), unreadCount > 0 && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold", children: unreadCount > 9 ? '9+' : unreadCount }))] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-56", children: [_jsx(DropdownMenuLabel, { children: _jsxs("div", { className: "flex flex-col space-y-1", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: profile?.full_name }), _jsx("p", { className: "text-xs leading-none text-muted-foreground", children: user?.email })] }) }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: `/profile/${user?.id}`, className: "flex cursor-pointer items-center", children: [_jsx(UserCircle, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Profile" })] }) }), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/dashboard", className: "flex cursor-pointer items-center", children: [_jsx(LayoutGrid, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Dashboard" })] }) }), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/my-listings", className: "flex cursor-pointer items-center", children: [_jsx(Building, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "My Listings" })] }) }), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/inbox", className: "flex cursor-pointer items-center", children: [_jsx(Inbox, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Messages" }), unreadCount > 0 && (_jsx("span", { className: "ml-auto bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5", children: unreadCount }))] }) }), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/wishlist", className: "flex cursor-pointer items-center", children: [_jsx(Heart, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Wishlist" })] }) }), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/dashboard?tab=settings", className: "flex cursor-pointer items-center", children: [_jsx(Settings, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Settings" })] }) }), profile?.role === 'admin' && (_jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/admin", className: "flex cursor-pointer items-center", children: [_jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Admin Panel" })] }) })), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/help", className: "flex cursor-pointer items-center", children: [_jsx(LifeBuoy, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Help" })] }) }), _jsxs(DropdownMenuItem, { onClick: handleSignOut, className: "text-destructive focus:text-destructive focus:bg-destructive/10", children: [_jsx(LogOut, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Log out" })] })] })] }));
};
const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { session, user, loading } = useAuth();
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
    const isLoggedIn = !!session;
    const navLinks = [
        { href: "/browse", label: "Browse" },
        { href: "/how-it-works", label: "How It Works" },
        { href: "/pricing", label: "Pricing" },
    ];
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const handleSignOut = async () => {
        // Implementation...
    };
    return (_jsxs("header", { className: cn("sticky top-0 z-50 w-full transition-all duration-300", isScrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : "bg-transparent"), children: [_jsx("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex h-16 items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs(Link, { to: "/", className: "flex items-center", children: [_jsx(motion.div, { whileHover: { rotate: [0, -10, 10, -10, 0], scale: 1.05 }, transition: { duration: 0.5 }, children: _jsx(LogoSvg, { className: "h-8 w-auto text-primary" }) }), _jsx("span", { className: "ml-2 text-xl font-bold", children: "Rentify" })] }), _jsx("nav", { className: "hidden md:ml-10 md:flex md:space-x-8", children: navLinks.map(({ href, label }) => {
                                        const isActive = location.pathname.startsWith(href);
                                        return _jsx(NavLink, { href: href, label: label, isActive: isActive, isScrolled: isScrolled }, href);
                                    }) })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { asChild: true, variant: "outline", className: "hidden md:flex items-center gap-2 border-primary/30 hover:border-primary hover:bg-primary/5", children: _jsxs(Link, { to: "/create-listing", children: [_jsx(motion.div, { whileHover: { rotate: 90 }, transition: { duration: 0.2 }, children: _jsx(Plus, { className: "h-4 w-4" }) }), _jsx("span", { children: "List Your Gear" })] }) }), showLoadingSpinner ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : isLoggedIn ? (_jsx(ProfileMenu, {})) : (_jsxs("div", { className: "hidden md:flex items-center space-x-2", children: [_jsx(Button, { asChild: true, variant: "ghost", children: _jsx(Link, { to: "/login", children: "Log in" }) }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/signup", children: "Sign up" }) })] })), _jsxs(Button, { variant: "ghost", size: "icon", onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'), className: "rounded-full", children: [_jsx(Sun, { className: "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" }), _jsx(Moon, { className: "absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" }), _jsx("span", { className: "sr-only", children: "Toggle theme" })] }), _jsx("button", { className: "md:hidden rounded-md p-2 text-foreground transition-colors hover:bg-muted", onClick: toggleMenu, "aria-expanded": isMenuOpen, "aria-label": "Toggle menu", children: isMenuOpen ? (_jsx(X, { className: "h-6 w-6" })) : (_jsx(MenuIcon, { className: "h-6 w-6" })) })] })] }) }), _jsx(AnimatePresence, { children: isMenuOpen && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.3 }, className: "md:hidden border-t border-border/10 bg-background/95 backdrop-blur-md", children: _jsxs("nav", { className: "container mx-auto px-4 flex flex-col space-y-4 pt-6", children: [navLinks.map(({ href, label }) => {
                                const isActive = location.pathname.startsWith(href);
                                return (_jsx(NavLink, { href: href, label: label, isActive: isActive, isScrolled: isScrolled, onClick: () => setIsMenuOpen(false) }, href));
                            }), !isLoggedIn && (_jsxs("div", { className: "flex flex-col space-y-2 pt-2 pb-6", children: [_jsx(Button, { asChild: true, variant: "outline", children: _jsx(Link, { to: "/login", onClick: () => setIsMenuOpen(false), children: "Log in" }) }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/signup", onClick: () => setIsMenuOpen(false), children: "Sign up" }) })] }))] }) })) })] }));
};
export default Header;
