import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, PlusCircle, MoreVertical, Edit, Trash2, MapPin, Star, Building } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from '../components/ui/dropdown-menu';
const MyListingsPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listingToDelete, setListingToDelete] = useState(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }
        ;
        const fetchListings = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_listings_with_ratings', {
                p_owner_id: user.id,
                p_sort_column: 'created_at',
                p_sort_direction: 'desc',
                p_limit: 50,
                p_offset: 0,
                p_search_term: null, p_category: null, p_min_price: null, p_max_price: null,
                p_min_rating: null, p_user_lon: null, p_user_lat: null, p_nearby_radius: null,
                p_exclude_owner_id: null
            });
            if (error) {
                toast({ variant: 'destructive', title: 'Error fetching listings', description: error.message });
            }
            else {
                setListings(data || []);
            }
            setLoading(false);
        };
        fetchListings();
    }, [user, toast, navigate]);
    const handleDeleteListing = async () => {
        if (!listingToDelete)
            return;
        // TODO: Also delete associated storage images
        const { error } = await supabase.from('listings').delete().eq('id', listingToDelete);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting listing', description: error.message });
        }
        else {
            setListings(prev => prev.filter(l => l.id !== listingToDelete));
            toast({ title: 'Listing deleted successfully' });
        }
        setListingToDelete(null);
    };
    if (loading) {
        return _jsx("div", { className: "flex items-center justify-center h-96", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) });
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-12", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("h1", { className: "text-4xl font-bold tracking-tight flex items-center gap-3", children: [_jsx(Building, { className: "h-8 w-8 text-primary" }), "My Listings"] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/list-item", children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), " Add New Listing"] }) })] }), listings.length === 0 ? (_jsxs("div", { className: "text-center py-20 bg-card border rounded-lg", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "You haven't listed any items yet." }), _jsx("p", { className: "text-muted-foreground mt-2 mb-6", children: "Start earning by sharing your items with the community." }), _jsx(Button, { asChild: true, size: "lg", children: _jsx(Link, { to: "/list-item", children: "List Your First Item" }) })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: listings.map(listing => (_jsxs(Card, { className: "overflow-hidden flex flex-col", children: [_jsxs(CardHeader, { className: "p-0 relative", children: [_jsx(Link, { to: `/listings/${listing.id}`, className: "block", children: _jsx("img", { src: listing.images_urls?.[0] || 'https://placehold.co/600x400', alt: listing.title, className: "aspect-video w-full object-cover" }) }), _jsx("div", { className: "absolute top-2 right-2", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "secondary", size: "icon", className: "h-8 w-8 rounded-full bg-background/70 backdrop-blur-sm", children: _jsx(MoreVertical, { className: "h-4 w-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: `/listings/${listing.id}/edit`, children: [_jsx(Edit, { className: "mr-2 h-4 w-4" }), "Edit"] }) }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => setListingToDelete(listing.id), className: "text-destructive focus:text-destructive", children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"] })] })] }) })] }), _jsxs(CardContent, { className: "p-4 flex-grow", children: [_jsx("h3", { className: "font-semibold text-lg truncate", children: listing.title }), _jsxs("div", { className: "flex items-center text-sm text-muted-foreground mt-2", children: [_jsx(Star, { className: "h-4 w-4 text-primary fill-current mr-1" }), _jsx("span", { children: listing.average_rating.toFixed(1) }), _jsxs("span", { className: "ml-1", children: ["(", listing.review_count, " reviews)"] })] })] }), _jsx(CardFooter, { className: "p-4 bg-muted/30", children: _jsxs("p", { className: "font-bold text-lg", children: ["$", listing.price_per_day, _jsx("span", { className: "font-normal text-sm text-muted-foreground", children: "/day" })] }) })] }, listing.id))) })), _jsx(AlertDialog, { open: !!listingToDelete, onOpenChange: (open) => !open && setListingToDelete(null), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Are you sure?" }), _jsx(AlertDialogDescription, { children: "This action cannot be undone. This will permanently delete your listing and all associated data." })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: handleDeleteListing, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Delete" })] })] }) })] }));
};
export default MyListingsPage;
