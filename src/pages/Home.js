import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, CalendarCheck, Handshake, Search, Star, MapPin, Heart, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { AnimatedGradient } from '../components/ui/AnimatedGradient';
const Home = () => {
    const [featuredListings, setFeaturedListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [favorites, setFavorites] = useState([]);
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/browse?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const { data: listingsData, error: listingsError } = await supabase.rpc('get_listings_paged', {
                    p_sort_column: 'is_verified',
                    p_sort_direction: 'desc',
                    p_limit: 4,
                    p_offset: 0
                });
                if (listingsError)
                    throw listingsError;
                setFeaturedListings(listingsData || []);
                if (user) {
                    const { data: favData, error: favError } = await supabase
                        .from('favorites')
                        .select('listing_id')
                        .eq('user_id', user.id);
                    if (favError)
                        throw favError;
                    setFavorites(favData.map(fav => fav.listing_id));
                }
            }
            catch (error) {
                toast({ variant: 'destructive', title: 'Failed to load listings.', description: error.message });
            }
            finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [user, toast]);
    const handleToggleFavorite = async (listingId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast({ variant: 'destructive', title: 'Please log in to save listings.' });
            return;
        }
        const isFavorited = favorites.includes(listingId);
        if (isFavorited) {
            setFavorites(prev => prev.filter(id => id !== listingId));
            const { error } = await supabase.from('favorites').delete().match({ user_id: user.id, listing_id: listingId });
            if (error) {
                setFavorites(prev => [...prev, listingId]); // Revert
                toast({ variant: 'destructive', title: 'Error removing from favorites.' });
            }
            else {
                toast({ title: "Removed from favorites." });
            }
        }
        else {
            setFavorites(prev => [...prev, listingId]);
            const { error } = await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
            if (error) {
                setFavorites(prev => prev.filter(id => id !== listingId)); // Revert
                toast({ variant: 'destructive', title: 'Error adding to favorites.' });
            }
            else {
                toast({ title: "Added to favorites!" });
            }
        }
    };
    const categories = [
        { name: 'Electronics', icon: '💻', link: '/browse?category=Electronics' },
        { name: 'Sports & Outdoors', icon: '🏕️', link: '/browse?category=Sports+%26+Outdoors' },
        { name: 'Home & Garden', icon: '🪴', link: '/browse?category=Home+%26+Garden' },
        { name: 'Vehicles', icon: '🚗', link: '/browse?category=Vehicles' },
        { name: 'Tools & Equipment', icon: '🛠️', link: '/browse?category=Tools+%26+Equipment' },
        { name: 'Events & Parties', icon: '🎉', link: '/browse?category=Events+%26+Parties' },
        { name: 'Fashion', icon: '👕', link: '/browse?category=Fashion' },
        { name: 'Drones', icon: '🚁', link: '/browse?category=Drones' }
    ];
    const features = [
        { icon: Search, title: "Find Anything", description: "From professional drones to party supplies, find exactly what you need from trusted locals." },
        { icon: CalendarCheck, title: "Book Instantly", description: "Check availability and book your rental for the perfect time, all in a few clicks." },
        { icon: Handshake, title: "Rent with Confidence", description: "Coordinate directly with owners and enjoy a secure rental experience from start to finish." },
    ];
    const SkeletonCard = () => (_jsxs("div", { className: "bg-card rounded-2xl overflow-hidden border border-border/50", children: [_jsx("div", { className: "aspect-square w-full bg-muted/50 animate-pulse" }), _jsxs("div", { className: "p-4 space-y-3", children: [_jsx("div", { className: "h-4 w-1/3 bg-muted/50 rounded animate-pulse" }), _jsx("div", { className: "h-6 w-full bg-muted/50 rounded animate-pulse" }), _jsx("div", { className: "h-4 w-1/2 bg-muted/50 rounded animate-pulse" })] })] }));
    return (_jsxs("div", { className: "bg-background text-foreground", children: [_jsxs("section", { className: "relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32", children: [_jsx(AnimatedGradient, {}), _jsx("div", { className: "container mx-auto px-4 text-center", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, staggerChildren: 0.2 }, className: "max-w-4xl mx-auto", children: [_jsxs(motion.h1, { variants: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }, className: "text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight", children: ["Don't Buy It. ", _jsx("span", { className: "text-primary", children: "Just Rent It." })] }), _jsx(motion.p, { variants: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }, className: "mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto", children: "Access thousands of items from people nearby. Save money, reduce waste, and live more by owning less." }), _jsxs(motion.form, { variants: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }, onSubmit: handleSearch, className: "mt-8 flex flex-col sm:flex-row items-center max-w-lg mx-auto gap-3", children: [_jsxs("div", { className: "relative w-full", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" }), _jsx(Input, { type: "text", placeholder: "Search for drones, cameras, party supplies...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-12 pr-4 py-3 h-14 rounded-full text-lg border-2 border-border/50 focus-visible:ring-primary/50" })] }), _jsx(Button, { type: "submit", size: "lg", className: "rounded-full w-full sm:w-auto h-14 text-lg font-semibold", children: "Search" })] })] }) })] }), _jsxs(AnimatedSection, { className: "container mx-auto px-4 py-16 sm:py-24", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-4xl font-bold tracking-tight", children: "Browse by Category" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Find exactly what you're looking for." })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4", children: categories.map((category, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: i * 0.05 }, children: _jsxs(Link, { to: category.link, className: "group flex flex-col items-center gap-3 p-4 bg-card border border-transparent rounded-2xl hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-1.5 transition-all duration-300 ease-in-out", children: [_jsx("div", { className: "text-5xl", children: category.icon }), _jsx("p", { className: "text-sm font-semibold text-center text-foreground group-hover:text-primary transition-colors", children: category.name })] }) }, category.name))) })] }), _jsx(AnimatedSection, { className: "bg-muted/30 py-16 sm:py-24", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-4xl font-bold tracking-tight", children: "A seamless, secure experience." }), _jsx("p", { className: "text-muted-foreground mt-2 max-w-2xl mx-auto", children: "Renting on Rentify is simple and safe. Here's how it works." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: features.map((feature, i) => (_jsxs(motion.div, { className: "flex flex-col items-center text-center p-6", initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: i * 0.15 }, viewport: { once: true, amount: 0.5 }, children: [_jsx("div", { className: "flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-primary/10 text-primary", children: _jsx(feature.icon, { className: "h-8 w-8" }) }), _jsx("h3", { className: "text-xl font-semibold mb-2", children: feature.title }), _jsx("p", { className: "text-muted-foreground", children: feature.description })] }, i))) })] }) }), _jsxs(AnimatedSection, { className: "container mx-auto px-4 py-16 sm:py-24", children: [_jsxs("div", { className: "flex justify-between items-center mb-12", children: [_jsxs("h2", { className: "text-4xl font-bold tracking-tight flex items-center gap-3", children: [_jsx(Sparkles, { className: "h-8 w-8 text-primary" }), "Featured Rentals"] }), _jsx(Button, { asChild: true, variant: "ghost", children: _jsxs(Link, { to: "/browse", children: ["View all ", _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] }) })] }), loading ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", children: [...Array(4)].map((_, i) => _jsx(SkeletonCard, {}, i)) })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", children: featuredListings.map((listing, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: i * 0.1 }, viewport: { once: true, amount: 0.3 }, children: _jsxs(Link, { to: `/listings/${listing.id}`, className: "group block bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 ease-in-out", children: [_jsxs("div", { className: "aspect-square w-full overflow-hidden relative", children: [_jsx("img", { src: listing.images_urls?.[0] || 'https://placehold.co/600x400', alt: listing.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out" }), listing.is_verified && (_jsxs("div", { className: "absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1", children: [_jsx(ShieldCheck, { className: "h-4 w-4" }), " Verified"] })), _jsx("div", { className: "absolute top-3 right-3", children: _jsx(Button, { size: "icon", variant: "secondary", className: "rounded-full h-10 w-10 bg-background/70 backdrop-blur-sm", onClick: (e) => handleToggleFavorite(listing.id, e), children: _jsx(Heart, { className: favorites.includes(listing.id) ? "h-5 w-5 text-red-500 fill-current" : "h-5 w-5" }) }) })] }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: listing.category }), _jsx("h3", { className: "font-semibold text-lg text-foreground truncate mt-1", children: listing.title }), _jsxs("p", { className: "text-sm text-muted-foreground flex items-center mt-2 gap-1.5", children: [_jsx(MapPin, { className: "h-4 w-4" }), " ", listing.location_text || "Worldwide"] }), _jsxs("div", { className: "flex items-center mt-2", children: [_jsx(Star, { className: "h-4 w-4 text-primary fill-current" }), _jsx("span", { className: "text-sm font-bold ml-1", children: listing.average_rating.toFixed(1) }), _jsxs("span", { className: "text-sm text-muted-foreground ml-1.5", children: ["(", listing.review_count, " reviews)"] })] }), _jsxs("p", { className: "font-bold text-lg text-foreground mt-4", children: ["$", listing.price_per_day, _jsx("span", { className: "font-normal text-sm text-muted-foreground", children: "/day" })] })] })] }) }, listing.id))) }))] }), _jsx("section", { className: "py-16 sm:py-24", children: _jsx("div", { className: "container mx-auto px-4 text-center", children: _jsxs("div", { className: "bg-primary/10 rounded-2xl p-8 sm:p-16 border border-primary/20", children: [_jsx("h2", { className: "text-4xl font-bold tracking-tight", children: "Ready to start renting?" }), _jsx("p", { className: "text-muted-foreground mt-4 max-w-xl mx-auto", children: "Have something you're not using? Earn extra cash by listing it on Rentify. It's free and takes just a few minutes." }), _jsxs("div", { className: "mt-8 flex justify-center gap-4", children: [_jsx(Button, { asChild: true, size: "lg", className: "rounded-full text-lg", children: _jsx(Link, { to: "/list-item", children: "List an Item" }) }), _jsx(Button, { asChild: true, variant: "outline", size: "lg", className: "rounded-full text-lg", children: _jsx(Link, { to: "/browse", children: "Browse Items" }) })] })] }) }) })] }));
};
export default Home;
