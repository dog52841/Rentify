import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Shield, Award, MapPin, Edit, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { format, formatDistanceToNowStrict } from 'date-fns';
import StarRating from '../components/ui/StarRating';
import { Badge } from '../components/ui/badge';
// Main Component
const UserProfilePage = () => {
    const { userId } = useParams();
    const { user: currentUser, profile: currentProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [profile, setProfile] = useState(null);
    const [listings, setListings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ listings: 0, reviews: 0, rating: 0 });
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!userId)
                return;
            setIsLoading(true);
            try {
                // Fetch profile, listings, and reviews in parallel
                const [profileRes, listingsRes, reviewsRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', userId).single(),
                    supabase.from('listings').select('id, title, price_per_day, images_urls, average_rating').eq('owner_id', userId),
                    supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, avatar_url), listing:listings(title)').eq('reviewee_id', userId)
                ]);
                if (profileRes.error)
                    throw profileRes.error;
                if (listingsRes.error)
                    throw listingsRes.error;
                if (reviewsRes.error)
                    throw reviewsRes.error;
                setProfile(profileRes.data);
                setListings(listingsRes.data);
                setReviews(reviewsRes.data);
                // Calculate stats
                const totalRating = (reviewsRes.data || []).reduce((acc, r) => acc + r.rating, 0);
                setStats({
                    listings: listingsRes.data?.length || 0,
                    reviews: reviewsRes.data?.length || 0,
                    rating: reviewsRes.data?.length ? totalRating / reviewsRes.data.length : 0,
                });
            }
            catch (error) {
                console.error("Error fetching profile data:", error);
                toast({ variant: 'destructive', title: 'Failed to load profile', description: error.message });
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, [userId, toast]);
    if (isLoading)
        return _jsx(ProfileSkeleton, {});
    if (!profile) {
        return (_jsxs("div", { className: "text-center py-20", children: [_jsx("h2", { className: "text-2xl font-bold", children: "User not found" }), _jsx(Button, { asChild: true, className: "mt-4", children: _jsx(Link, { to: "/", children: "Go Home" }) })] }));
    }
    const isOwner = currentUser?.id === profile.id;
    return (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "container max-w-6xl mx-auto py-12 px-4 space-y-8", children: [_jsxs(Button, { variant: "ghost", onClick: () => navigate(-1), className: "absolute top-24 left-8 text-muted-foreground", children: [_jsx(ChevronLeft, { className: "mr-2 h-4 w-4" }), " Back"] }), _jsxs(Card, { className: "overflow-hidden border-0 shadow-none", children: [_jsx("div", { className: "h-48 bg-muted bg-cover bg-center", style: { backgroundImage: `url(${profile.banner_url})` } }), _jsx(CardContent, { className: "p-6 relative", children: _jsxs("div", { className: "flex items-end -mt-20", children: [_jsxs(Avatar, { className: "h-32 w-32 border-4 border-background ring-4 ring-primary/20", children: [_jsx(AvatarImage, { src: profile.avatar_url }), _jsx(AvatarFallback, { className: "text-4xl", children: profile.full_name.charAt(0) })] }), _jsxs("div", { className: "ml-6 flex-grow", children: [_jsxs("h1", { className: "text-4xl font-bold flex items-center gap-2", children: [profile.full_name, profile.is_verified && _jsx(ShieldCheck, { className: "h-7 w-7 text-primary" })] }), _jsxs("p", { className: "text-muted-foreground", children: ["Member for ", formatDistanceToNowStrict(new Date(profile.created_at))] })] }), _jsx("div", { className: "flex items-center gap-2", children: isOwner ? (_jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/dashboard", state: { tab: 'settings' }, children: [_jsx(Edit, { className: "mr-2 h-4 w-4" }), "Edit Profile"] }) })) : (_jsxs(Button, { children: [_jsx(Mail, { className: "mr-2 h-4 w-4" }), "Message"] })) })] }) })] }), _jsxs("div", { className: "grid grid-cols-12 gap-8", children: [_jsxs("div", { className: "col-span-12 lg:col-span-4 space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "About" }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-muted-foreground", children: profile.bio || "This user hasn't written a bio yet." }), _jsxs("div", { className: "mt-4 space-y-2", children: [profile.location && _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(MapPin, { className: "h-4 w-4 text-primary" }), _jsx("span", { children: profile.location })] }), profile.website_url && _jsxs("a", { href: profile.website_url, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 text-sm text-primary hover:underline", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), _jsx("span", { children: profile.website_url })] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Stats" }) }), _jsxs(CardContent, { className: "grid grid-cols-2 gap-4 text-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.listings }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Listings" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.reviews }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Reviews" })] })] })] }), currentProfile?.role === 'admin' && _jsx(AdminActions, { profile: profile })] }), _jsx("div", { className: "col-span-12 lg:col-span-8", children: _jsxs(Tabs, { defaultValue: "listings", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsxs(TabsTrigger, { value: "listings", children: ["Listings (", stats.listings, ")"] }), _jsxs(TabsTrigger, { value: "reviews", children: ["Reviews (", stats.reviews, ")"] })] }), _jsx(TabsContent, { value: "listings", className: "mt-6", children: _jsx(ListingsGrid, { listings: listings }) }), _jsx(TabsContent, { value: "reviews", className: "mt-6", children: _jsx(ReviewsList, { reviews: reviews }) })] }) })] })] }));
};
// Sub-components
const ListingsGrid = ({ listings }) => {
    if (listings.length === 0)
        return _jsx("div", { className: "text-center py-16 text-muted-foreground", children: "No listings to show." });
    return (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6", children: listings.map(l => (_jsx(Link, { to: `/listings/${l.id}`, children: _jsxs(Card, { className: "group overflow-hidden", children: [_jsx("div", { className: "aspect-square overflow-hidden", children: _jsx("img", { src: l.images_urls?.[0], className: "h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" }) }), _jsxs(CardContent, { className: "p-4", children: [_jsx("h3", { className: "font-semibold truncate", children: l.title }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsxs("p", { className: "text-lg font-bold", children: ["$", l.price_per_day, _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/day" })] }), l.average_rating && _jsx(StarRating, { rating: l.average_rating, size: "sm" })] })] })] }) }, l.id))) }));
};
const ReviewsList = ({ reviews }) => {
    if (reviews.length === 0)
        return _jsx("div", { className: "text-center py-16 text-muted-foreground", children: "No reviews yet." });
    return (_jsx("div", { className: "space-y-6", children: reviews.map(r => (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center gap-4", children: [_jsxs(Avatar, { className: "h-12 w-12", children: [_jsx(AvatarImage, { src: r.reviewer.avatar_url }), _jsx(AvatarFallback, { children: r.reviewer.full_name.charAt(0) })] }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: r.reviewer.full_name }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(StarRating, { rating: r.rating, size: "sm" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [formatDistanceToNowStrict(new Date(r.created_at)), " ago"] })] })] })] }), _jsx(CardContent, { children: _jsxs("p", { className: "text-muted-foreground italic", children: ["\"", r.comment, "\""] }) })] }, r.id))) }));
};
const AdminActions = ({ profile }) => (_jsxs(Card, { className: "bg-destructive/10 border-destructive/20", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Admin Actions" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsx(Button, { variant: "outline", className: "w-full", children: "View User Reports" }), _jsx(Button, { variant: "destructive", className: "w-full", children: "Ban User" })] })] }));
const ProfileSkeleton = () => (_jsxs("div", { className: "container max-w-6xl mx-auto py-12 px-4 space-y-8 animate-pulse", children: [_jsx("div", { className: "h-10 w-24 absolute top-24 left-8 bg-muted rounded-md" }), _jsxs(Card, { className: "overflow-hidden border-0 shadow-none", children: [_jsx("div", { className: "h-48 bg-muted" }), _jsx(CardContent, { className: "p-6 relative", children: _jsxs("div", { className: "flex items-end -mt-20", children: [_jsx(Skeleton, { className: "h-32 w-32 rounded-full" }), _jsxs("div", { className: "ml-6 flex-grow space-y-2", children: [_jsx(Skeleton, { className: "h-10 w-1/3" }), _jsx(Skeleton, { className: "h-5 w-1/4" })] }), _jsx(Skeleton, { className: "h-12 w-32 rounded-md" })] }) })] }), _jsxs("div", { className: "grid grid-cols-12 gap-8", children: [_jsxs("div", { className: "col-span-4 space-y-6", children: [_jsx(Skeleton, { className: "h-48 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-32 w-full rounded-xl" })] }), _jsxs("div", { className: "col-span-8", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Skeleton, { className: "h-10 w-1/2 rounded-md" }), _jsx(Skeleton, { className: "h-10 w-1/2 rounded-md" })] }), _jsxs("div", { className: "mt-6 grid grid-cols-3 gap-6", children: [_jsx(Skeleton, { className: "h-60 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-60 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-60 w-full rounded-xl" })] })] })] })] }));
export default UserProfilePage;
