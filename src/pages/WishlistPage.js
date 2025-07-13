import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Loader2, MapPin, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
const WishlistPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const getAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0)
            return 0;
        return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    };
    const fetchWishlist = async () => {
        if (!user) {
            setError("Please log in to see your wishlist.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    listing:listings (
                        id,
                        images_urls,
                        price_per_day,
                        category,
                        title,
                        location_text,
                        user_reviews (rating)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setWishlistItems(data?.filter(item => item.listing && item.listing.length > 0) || []);
        }
        catch (err) {
            setError(err.message || "Failed to fetch wishlist.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchWishlist();
    }, [user]);
    const handleRemoveFromWishlist = async (listingId, e) => {
        e.preventDefault();
        e.stopPropagation();
        const previousWishlist = wishlistItems;
        setWishlistItems(current => current.filter(item => item.listing[0]?.id !== listingId));
        const { error } = await supabase.from('favorites').delete().match({ user_id: user?.id, listing_id: listingId });
        if (error) {
            setWishlistItems(previousWishlist);
            toast({
                variant: 'destructive',
                title: 'Error removing item',
                description: 'Could not remove the item from your wishlist. Please try again.'
            });
        }
    };
    if (loading) {
        return _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) });
    }
    if (error) {
        return _jsx("div", { className: "text-center py-20 text-destructive", children: error });
    }
    return (_jsx("div", { className: "max-w-6xl mx-auto py-12 px-4", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsxs("div", { className: "mb-12", children: [_jsx("h1", { className: "text-4xl font-bold", children: "My Wishlist" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Items you've saved for later." })] }), wishlistItems.length === 0 ? (_jsxs("div", { className: "text-center py-20 bg-muted/30 rounded-lg", children: [_jsx(Heart, { className: "mx-auto h-12 w-12 text-muted-foreground mb-4" }), _jsx("h3", { className: "text-xl font-semibold mb-2", children: "Your wishlist is empty." }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Browse items and click the heart icon to save them for later." }), _jsx(Link, { to: "/browse", children: _jsx(Button, { children: "Start Browsing" }) })] })) : (_jsx(motion.div, { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", initial: "hidden", animate: "visible", variants: { visible: { transition: { staggerChildren: 0.05 } } }, children: wishlistItems.map(({ listing }) => {
                        if (!listing?.[0])
                            return null;
                        const listingData = listing[0];
                        const averageRating = getAverageRating(listingData.user_reviews);
                        return (_jsx(motion.div, { variants: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }, children: _jsxs(Link, { to: `/listings/${listingData.id}`, className: "group bg-card rounded-xl overflow-hidden border transition-all duration-300 h-full flex flex-col hover:shadow-xl relative", children: [_jsx("button", { onClick: (e) => handleRemoveFromWishlist(listingData.id, e), className: "absolute top-3 right-3 z-10 p-2 rounded-full bg-background/60 backdrop-blur-sm hover:bg-destructive/20 text-destructive transition-all", "aria-label": "Remove from wishlist", children: _jsx(Heart, { className: "h-5 w-5 fill-current" }) }), _jsxs("div", { className: "aspect-video w-full overflow-hidden relative", children: [_jsx("img", { src: listingData.images_urls?.[0] || 'https://placehold.co/600x400/e2e8f0/e2e8f0', alt: listingData.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" }), _jsxs("div", { className: "absolute bottom-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: [_jsxs("p", { children: [_jsxs("span", { className: "font-bold text-xl text-white", children: ["$", listingData.price_per_day] }), _jsx("span", { className: "text-white/80 text-sm", children: "/day" })] }), _jsx(Button, { variant: "secondary", size: "sm", className: "h-8", children: "View" })] })] }), _jsxs("div", { className: "p-4 space-y-1 flex-grow flex flex-col", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("span", { className: "text-sm text-primary font-semibold", children: listingData.category }), _jsx("h3", { className: "font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate", children: listingData.title })] }), averageRating > 0 && (_jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [_jsx(Star, { className: "h-4 w-4 text-yellow-400 fill-yellow-400" }), _jsx("span", { className: "text-sm font-bold", children: averageRating.toFixed(1) })] }))] }), _jsx("div", { className: "flex-grow" }), _jsxs("div", { className: "flex items-center text-sm text-muted-foreground pt-1", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1.5" }), " ", _jsx("span", { children: listingData.location_text || "Location not available" })] })] })] }) }, listingData.id));
                    }) }))] }) }));
};
export default WishlistPage;
