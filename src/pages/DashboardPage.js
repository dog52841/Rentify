import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, List, ShoppingBag, Settings, LogOut, Star, MoreVertical, CreditCard, ExternalLink, PlusCircle, Edit, Trash, Check, Eye, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { useToast } from '../hooks/use-toast';
import LeaveReviewModal from '../components/ui/LeaveReviewModal';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import PayoutsPane from '../components/dashboard/PayoutsPane';
import { ProfileSettingsPane } from '../components/dashboard/ProfileSettingsPane';
import { Skeleton } from '../components/ui/skeleton';
// Main Dashboard Component
const DashboardPage = () => {
    const { profile, loading: authLoading } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('profile');
    const [data, setData] = useState({
        listings: [],
        rentals: [],
        messages: []
    });
    const [loadingData, setLoadingData] = useState(true);
    useEffect(() => {
        const tabFromState = location.state?.tab;
        if (tabFromState && ['profile', 'my-listings', 'my-rentals', 'payouts', 'settings'].includes(tabFromState)) {
            setActiveTab(tabFromState);
        }
    }, [location.state]);
    const fetchData = useCallback(async () => {
        if (!profile || !profile.id)
            return;
        setLoadingData(true);
        try {
            const [listingsRes, rentalsRes, messagesRes] = await Promise.all([
                supabase.from('listings').select('*, bookings(status, total_price)').eq('owner_id', profile.id),
                supabase.from('bookings').select('*, listings:listings!inner(id, title, owner_id, images_urls, profiles:profiles!inner(full_name)), user_reviews!left(id)').eq('renter_id', profile.id),
                supabase.from('messages').select('id, created_at, title, read').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5)
            ]);
            if (listingsRes.error)
                throw listingsRes.error;
            if (rentalsRes.error)
                throw rentalsRes.error;
            if (messagesRes.error)
                throw messagesRes.error;
            setData({
                listings: listingsRes.data || [],
                rentals: rentalsRes.data || [],
                messages: messagesRes.data || [],
            });
        }
        catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
        finally {
            setLoadingData(false);
        }
    }, [profile]);
    useEffect(() => {
        if (profile) {
            fetchData();
        }
        else if (!authLoading) {
            setLoadingData(false);
        }
    }, [profile, authLoading, fetchData]);
    if (authLoading) {
        return _jsx("div", { className: "container mx-auto py-10 px-4", children: _jsx(DashboardSkeleton, {}) });
    }
    if (!profile) {
        return (_jsxs("div", { className: "container mx-auto py-10 px-4 text-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Please log in" }), _jsx("p", { className: "text-muted-foreground", children: "You need to be logged in to view your dashboard." }), _jsx(Button, { asChild: true, className: "mt-4", children: _jsx(Link, { to: "/auth", children: "Log In" }) })] }));
    }
    const renderContent = () => {
        if (loadingData) {
            return _jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-48 w-full" }), _jsx(Skeleton, { className: "h-48 w-full" })] });
        }
        switch (activeTab) {
            case 'profile':
                return _jsx(ProfilePane, { profile: profile, listings: data.listings, rentals: data.rentals, messages: data.messages });
            case 'my-listings':
                return _jsx(MyListingsPane, { listings: data.listings, fetchListings: fetchData });
            case 'my-rentals':
                return _jsx(MyRentalsPane, { rentals: data.rentals, fetchRentals: fetchData });
            case 'payouts':
                return _jsx(PayoutsPane, {});
            case 'settings':
                return _jsx(ProfileSettingsPane, {});
            default:
                return null;
        }
    };
    return (_jsx("div", { className: "container mx-auto py-10 px-4", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8", children: [_jsx(DashboardSidebar, { activeTab: activeTab, setActiveTab: setActiveTab }), _jsx("main", { className: "lg:col-span-9", children: _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { duration: 0.25 }, children: renderContent() }, activeTab) }) })] }) }));
};
// Sidebar
const DashboardSidebar = ({ activeTab, setActiveTab }) => {
    const { profile, user, signOut } = useAuth();
    const navigate = useNavigate();
    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };
    const NavItem = ({ tab, icon: Icon, children, disabled }) => (_jsxs("button", { onClick: () => setActiveTab(tab), disabled: disabled, className: cn('w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200', activeTab === tab
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground', disabled && 'opacity-50 cursor-not-allowed'), children: [_jsx(Icon, { size: 20 }), _jsx("span", { className: "font-medium", children: children })] }));
    return (_jsx("aside", { className: "lg:col-span-3 space-y-6 lg:sticky top-24 h-fit", children: _jsxs(Card, { className: "overflow-hidden shadow-lg border-border/10", children: [_jsxs("div", { className: "p-5 flex flex-col items-center text-center bg-gradient-to-br from-card to-muted/20", children: [_jsxs(Avatar, { className: "h-24 w-24 mb-4 border-4 border-background/20 ring-4 ring-primary/20", children: [_jsx(AvatarImage, { src: profile?.avatar_url || undefined, alt: profile?.full_name || "User" }), _jsx(AvatarFallback, { className: "text-3xl", children: profile?.full_name?.charAt(0) || 'U' })] }), _jsx("h2", { className: "text-xl font-bold", children: profile?.full_name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Joined ", format(new Date(user?.created_at || Date.now()), 'MMMM yyyy')] }), profile?.role === 'admin' && _jsxs(Badge, { className: "mt-3 bg-destructive/10 text-destructive border-destructive/20", children: [_jsx(Shield, { size: 12, className: "mr-1.5" }), "Admin"] })] }), _jsxs("nav", { className: "p-3", children: [_jsx(NavItem, { tab: "profile", icon: User, children: "Dashboard" }), _jsx(NavItem, { tab: "my-listings", icon: List, children: "My Listings" }), _jsx(NavItem, { tab: "my-rentals", icon: ShoppingBag, children: "My Rentals" }), _jsx(NavItem, { tab: "payouts", icon: CreditCard, children: "Payouts" }), _jsx(NavItem, { tab: "settings", icon: Settings, children: "Settings" }), _jsx("div", { className: "px-4 py-2 my-2 border-t border-border/10" }), _jsxs("button", { onClick: handleSignOut, className: "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-destructive/80 hover:bg-destructive/10 hover:text-destructive font-medium transition-colors", children: [_jsx(LogOut, { size: 20 }), _jsx("span", { children: "Sign Out" })] })] })] }) }));
};
// Profile Pane
const StatCard = ({ icon: Icon, title, value, isLoading, }) => (_jsxs(Card, { className: "hover:border-primary/50 hover:shadow-lg transition-all", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: title }), _jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: value }) })] }));
const ProfilePane = ({ profile, listings, rentals, messages }) => {
    const totalEarnings = listings.reduce((acc, listing) => acc + (listing.bookings?.reduce((sum, b) => b.status === 'confirmed' ? sum + b.total_price : sum, 0) || 0), 0) * 0.9;
    const totalViews = listings.reduce((acc, listing) => acc + (listing.view_count || 0), 0);
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsxs("h1", { className: "text-4xl font-bold tracking-tight", children: ["Welcome back, ", profile.full_name?.split(' ')[0], "!"] }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Here's a snapshot of your activity on Rentify." })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [_jsx(StatCard, { icon: List, title: "Total Listings", value: listings.length, isLoading: false }), _jsx(StatCard, { icon: CreditCard, title: "Total Earnings (est.)", value: `$${totalEarnings.toFixed(2)}`, isLoading: false }), _jsx(StatCard, { icon: Eye, title: "Total Views", value: totalViews, isLoading: false })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Actions" }) }), _jsxs(CardContent, { className: "flex flex-col gap-3", children: [_jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/list-item", children: [_jsx(PlusCircle, { size: 16, className: "mr-2" }), "List a New Item"] }) }), _jsx(Button, { asChild: true, variant: "outline", children: _jsxs(Link, { to: `/profile/${profile.id}`, children: [_jsx(User, { size: 16, className: "mr-2" }), "View Public Profile"] }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recent Activity" }), _jsx(CardDescription, { children: "Updates on your listings and rentals." })] }), _jsx(CardContent, { children: messages.length > 0 ? (_jsxs("div", { className: "space-y-4", children: [messages.map((message) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-shrink-0", children: !message.read && _jsx("div", { className: "h-2 w-2 rounded-full bg-primary" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium truncate", children: message.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) })] })] }, message.id))), _jsx(Button, { asChild: true, variant: "link", className: "p-0 h-auto mt-4", children: _jsx(Link, { to: "/inbox", children: "View all activity" }) })] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "No new activity to show." })) })] })] })] }));
};
// My Listings Pane
const MyListingsPane = ({ listings, fetchListings }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const handleDelete = async (listingId) => {
        const { data: listingData } = await supabase.from('listings').select('images_urls').eq('id', listingId).single();
        const { error } = await supabase.from('listings').delete().eq('id', listingId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting listing', description: error.message });
        }
        else {
            if (listingData?.images_urls && listingData.images_urls.length > 0) {
                const filePaths = listingData.images_urls.map((url) => url.substring(url.lastIndexOf('/') + 1));
                await supabase.storage.from('listing-images').remove(filePaths);
            }
            toast({ title: 'Listing deleted successfully' });
            fetchListings();
        }
    };
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row justify-between items-center", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "My Listings" }), _jsx(CardDescription, { children: "Manage your items available for rent." })] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/list-item", children: [_jsx(PlusCircle, { size: 16, className: "mr-2" }), "New Listing"] }) })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(AnimatePresence, { children: listings.map(listing => (_jsx(motion.div, { layout: true, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }, children: _jsxs(Card, { className: "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group", children: [_jsx("img", { src: listing.images_urls?.[0], alt: listing.title, className: "w-24 h-24 object-cover rounded-lg" }), _jsxs("div", { className: "flex-grow", children: [_jsx("h4", { className: "font-semibold text-lg", children: listing.title }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["$", listing.price_per_day, "/day"] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground mt-2", children: [_jsx(Eye, { size: 14 }), " ", _jsxs("span", { children: [listing.view_count || 0, " views"] })] })] }), _jsxs("div", { className: "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: () => navigate(`/listings/${listing.id}/edit`), children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsx(Button, { variant: "destructive", size: "icon", children: _jsx(Trash, { className: "h-4 w-4" }) }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Are you sure?" }), _jsx(AlertDialogDescription, { children: "This action cannot be undone. This will permanently delete your listing." })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: () => handleDelete(listing.id), children: "Delete" })] })] })] })] })] }) }, listing.id))) }), listings.length === 0 && _jsx("p", { className: "text-muted-foreground text-center py-10", children: "You have no active listings." })] })] }));
};
// My Rentals Pane
const MyRentalsPane = ({ rentals, fetchRentals }) => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const handleOpenReview = (rental) => {
        setSelectedRental(rental);
        setShowReviewModal(true);
    };
    const handleReviewSubmitted = () => {
        setShowReviewModal(false);
        setSelectedRental(null);
        fetchRentals();
        toast({ title: "Review submitted!", description: "Thank you for your feedback." });
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "My Rentals" }), _jsx(CardDescription, { children: "Your history of rented items." })] }), _jsxs(CardContent, { className: "space-y-4", children: [rentals.map(rental => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex gap-4", children: [_jsx("img", { src: rental.listings.images_urls[0], alt: rental.listings.title, className: "w-24 h-24 object-cover rounded-lg" }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-lg", children: rental.listings.title }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Rented from ", rental.listings.profiles.full_name] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [format(new Date(rental.start_date), 'PPP'), " - ", format(new Date(rental.end_date), 'PPP')] })] })] }), _jsx(Badge, { variant: rental.status === 'confirmed' ? 'success' : 'secondary', children: rental.status })] }), isPast(new Date(rental.end_date)) && rental.user_reviews.length === 0 && rental.status === 'confirmed' && (_jsx("div", { className: "flex justify-end mt-4", children: _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleOpenReview(rental), children: [_jsx(Star, { size: 16, className: "mr-2" }), " Leave Review"] }) }))] }) }, rental.id))), rentals.length === 0 && _jsx("p", { className: "text-muted-foreground text-center py-10", children: "You have not rented any items yet." })] })] }), showReviewModal && selectedRental && profile && (_jsx(LeaveReviewModal, { isOpen: showReviewModal, onClose: () => setShowReviewModal(false), booking: selectedRental, reviewerId: profile.id, revieweeId: selectedRental.listings.owner_id, onReviewSubmitted: handleReviewSubmitted }))] }));
};
// New DashboardSkeleton component
const DashboardSkeleton = () => (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8", children: [_jsxs("aside", { className: "lg:col-span-3 space-y-6", children: [_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex flex-col items-center lg:items-start", children: [_jsx(Skeleton, { className: "h-24 w-24 rounded-full mb-4" }), _jsx(Skeleton, { className: "h-6 w-3/4 mb-2" }), _jsx(Skeleton, { className: "h-4 w-1/2" })] }) }), _jsx(Card, { className: "p-4 space-y-2", children: [...Array(5)].map((_, i) => _jsx(Skeleton, { className: "h-10 w-full" }, i)) })] }), _jsxs("main", { className: "lg:col-span-9 space-y-6", children: [_jsx(Skeleton, { className: "h-32 w-full" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(Skeleton, { className: "h-24 w-full" }), _jsx(Skeleton, { className: "h-24 w-full" }), _jsx(Skeleton, { className: "h-24 w-full" })] }), _jsx(Skeleton, { className: "h-48 w-full" })] })] }));
export default DashboardPage;
