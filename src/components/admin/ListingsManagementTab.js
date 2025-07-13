import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Search, RefreshCw, Check, ShieldCheck, ClipboardCheck, MoreHorizontal, X, Clipboard as ClipboardIcon, XCircle as XCircleIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
const getStatusVariant = (status, isReported) => {
    if (isReported)
        return 'warning';
    switch (status) {
        case 'approved': return 'success';
        case 'pending': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'default';
    }
};
export const ListingsManagementTab = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState({});
    const [activeFilter, setActiveFilter] = useState('all');
    const { toast } = useToast();
    const [actionListing, setActionListing] = useState(null);
    const [reason, setReason] = useState('');
    const [verifyId, setVerifyId] = useState('');
    const [isVerifyingById, setIsVerifyingById] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);
    const [listingHistory, setListingHistory] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const fetchListings = async (filter = 'all') => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_listings_admin', { p_status_filter: filter });
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch listings',
                description: error.message,
            });
        }
        else {
            setListings(data || []);
        }
        setLoading(false);
    };
    useEffect(() => {
        fetchListings(activeFilter);
    }, [activeFilter]);
    const handleSetStatus = async (listingId, status) => {
        if (status === 'rejected') {
            const listingToReject = listings.find(l => l.id === listingId);
            if (listingToReject) {
                setActionListing({ listing: listingToReject, action: 'reject' });
            }
            return;
        }
        setUpdatingStatus(prev => ({ ...prev, [listingId]: true }));
        const { error } = await supabase.rpc('set_listing_status', { p_listing_id: listingId, p_status: status });
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
        else {
            toast({ title: 'Listing Status Updated' });
            setListings(prev => prev.map(l => l.id === listingId ? { ...l, status } : l));
        }
        setUpdatingStatus(prev => ({ ...prev, [listingId]: false }));
    };
    const handleRejectSubmit = async () => {
        if (!actionListing)
            return;
        setUpdatingStatus(prev => ({ ...prev, [actionListing.listing.id]: true }));
        const { error } = await supabase.rpc('set_listing_status', {
            p_listing_id: actionListing.listing.id,
            p_status: 'rejected',
            p_reason: reason
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
        else {
            toast({ title: 'Listing Rejected', description: 'The listing has been marked as rejected.' });
            fetchListings(activeFilter); // Refresh to show updated data
        }
        setUpdatingStatus(prev => ({ ...prev, [actionListing.listing.id]: false }));
        setActionListing(null);
        setReason('');
    };
    const handleSetVerification = async (listingId, verify) => {
        setUpdatingStatus(prev => ({ ...prev, [listingId]: true }));
        const { error } = await supabase.rpc('set_listing_verification', { p_listing_id: listingId, p_is_verified: verify });
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
        else {
            toast({ title: 'Listing Verification Updated' });
            setListings(prev => prev.map(l => l.id === listingId ? { ...l, is_verified: verify } : l));
        }
        setUpdatingStatus(prev => ({ ...prev, [listingId]: false }));
    };
    const handleVerifyById = async () => {
        if (!verifyId || isNaN(parseInt(verifyId, 10))) {
            toast({ variant: 'destructive', title: 'Invalid ID', description: 'Please enter a numeric listing ID.' });
            return;
        }
        setIsVerifyingById(true);
        const numericId = parseInt(verifyId, 10);
        const { error } = await supabase.rpc('set_listing_verification', { p_listing_id: numericId, p_is_verified: true });
        if (error) {
            toast({ variant: 'destructive', title: 'Verification Failed', description: 'Could not find or update the listing. Check the ID.' });
        }
        else {
            toast({ title: 'Listing Verified!', description: `Listing ${numericId} is now verified.` });
            fetchListings(activeFilter); // Refresh the list
            setVerifyId('');
        }
        setIsVerifyingById(false);
    };
    const openDetailsModal = async (listing) => {
        setSelectedListing(listing);
        setModalLoading(true);
        // Fetch activity log for this listing
        const { data, error } = await supabase
            .from('admin_activity_log')
            .select('*')
            .eq('target_id', listing.id.toString())
            .order('created_at', { ascending: false });
        if (error) {
            toast({ title: 'Error fetching history', description: error.message, variant: 'destructive' });
        }
        setListingHistory(data || []);
        setModalLoading(false);
    };
    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id.toString());
        toast({ title: 'Copied to clipboard!' });
    };
    const handleDismissReport = async (listingId) => {
        setUpdatingStatus(prev => ({ ...prev, [listingId]: true }));
        const { error } = await supabase.rpc('dismiss_listing_report', { p_listing_id: listingId });
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
        else {
            toast({ title: 'Report Dismissed' });
            fetchListings(activeFilter); // Refresh list
        }
        setUpdatingStatus(prev => ({ ...prev, [listingId]: false }));
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20 mb-6", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(ClipboardCheck, {}), " Verify by ID"] }), _jsx(CardDescription, { children: "Manually verify a listing by entering its unique ID." })] }), _jsxs(CardContent, { className: "flex items-center gap-2", children: [_jsx(Input, { placeholder: "Paste Listing ID here...", value: verifyId, onChange: (e) => setVerifyId(e.target.value) }), _jsxs(Button, { onClick: handleVerifyById, disabled: isVerifyingById, children: [isVerifyingById && _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Verify"] })] })] }), _jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Listings Queue" }), _jsx(CardDescription, { children: "Review and manage all user-submitted listings." })] }), _jsx(Button, { onClick: () => fetchListings(), variant: "ghost", size: "icon", disabled: loading, children: _jsx(RefreshCw, { className: `h-4 w-4 ${loading ? 'animate-spin' : ''}` }) })] }), _jsxs(CardContent, { children: [_jsx(Tabs, { value: activeFilter, onValueChange: setActiveFilter, className: "mb-4", children: _jsxs(TabsList, { className: "grid w-full grid-cols-5", children: [_jsx(TabsTrigger, { value: "all", children: "All" }), _jsx(TabsTrigger, { value: "pending", children: "Pending" }), _jsx(TabsTrigger, { value: "approved", children: "Approved" }), _jsx(TabsTrigger, { value: "rejected", children: "Rejected" }), _jsx(TabsTrigger, { value: "reported", className: "text-amber-500 focus:text-amber-600 focus:bg-amber-100 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700", children: "Reported" })] }) }), loading ? (_jsx("div", { className: "flex justify-center items-center py-20", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin" }) })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Listing" }), _jsx(TableHead, { children: "Owner" }), _jsx(TableHead, { children: "Submitted" }), _jsx(TableHead, { className: "text-center", children: "Status" }), _jsx(TableHead, { className: "text-center", children: "Verified" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: listings.map((listing) => (_jsxs(TableRow, { onClick: () => openDetailsModal(listing), className: "cursor-pointer hover:bg-primary/10 transition-all", children: [_jsx(TableCell, { className: "font-medium", children: listing.title }), _jsx(TableCell, { children: listing.owner_full_name }), _jsx(TableCell, { children: format(new Date(listing.created_at), 'MMM dd, yyyy') }), _jsx(TableCell, { className: "text-center", children: _jsx(Badge, { variant: getStatusVariant(listing.status, listing.is_reported), className: "capitalize", children: listing.is_reported ? 'Reported' : listing.status }) }), _jsx(TableCell, { className: "text-center", children: listing.is_verified && _jsx(Check, { className: "h-5 w-5 text-green-500 mx-auto" }) }), _jsx(TableCell, { className: "text-right", children: updatingStatus[listing.id] ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin ml-auto" })) : (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", className: "h-8 w-8 p-0", onClick: (e) => e.stopPropagation(), children: [_jsx("span", { className: "sr-only", children: "Open menu" }), _jsx(MoreHorizontal, { className: "h-4 w-4" })] }) }), _jsxs(DropdownMenuContent, { align: "end", onClick: (e) => e.stopPropagation(), children: [_jsx(DropdownMenuLabel, { children: "Actions" }), listing.status === 'pending' && !listing.is_reported && (_jsxs(_Fragment, { children: [_jsxs(DropdownMenuItem, { onClick: () => handleSetStatus(listing.id, 'approved'), children: [_jsx(CheckCircle, { className: "mr-2 h-4 w-4" }), " Approve"] }), _jsxs(DropdownMenuItem, { onClick: () => handleSetStatus(listing.id, 'rejected'), children: [_jsx(XCircle, { className: "mr-2 h-4 w-4" }), " Reject"] })] })), _jsxs(DropdownMenuItem, { onClick: () => handleSetVerification(listing.id, !listing.is_verified), children: [_jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }), " ", listing.is_verified ? 'Un-verify' : 'Verify'] }), listing.is_reported && (_jsxs(_Fragment, { children: [_jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => handleDismissReport(listing.id), className: "text-amber-600 focus:bg-amber-100 focus:text-amber-800", children: [_jsx(ClipboardIcon, { className: "mr-2 h-4 w-4" }), " Dismiss Report"] }), _jsxs(DropdownMenuItem, { onClick: () => handleSetStatus(listing.id, 'rejected'), className: "text-red-600 focus:bg-red-100 focus:text-red-800", children: [_jsx(XCircle, { className: "mr-2 h-4 w-4" }), " Takedown Listing"] })] })), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => handleCopyId(listing.id), children: [_jsx(ClipboardIcon, { className: "mr-2 h-4 w-4" }), " Copy ID"] })] })] })) })] }, listing.id))) })] }))] })] }), _jsx(AlertDialog, { open: !!actionListing, onOpenChange: (open) => !open && setActionListing(null), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Reason for Rejection" }), _jsxs(AlertDialogDescription, { children: ["Please provide a reason for rejecting the listing \"", actionListing?.listing.title, "\". This will be logged."] })] }), _jsx("div", { className: "py-4", children: _jsx(Input, { placeholder: "e.g., Inappropriate content, violation of terms...", value: reason, onChange: (e) => setReason(e.target.value) }) }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { onClick: () => setActionListing(null), children: "Cancel" }), _jsx(AlertDialogAction, { onClick: handleRejectSubmit, children: "Confirm Rejection" })] })] }) }), _jsx(Dialog, { open: !!selectedListing, onOpenChange: (open) => { if (!open)
                    setSelectedListing(null); }, children: _jsx(DialogContent, { className: "max-w-3xl glassmorphic", children: selectedListing && (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center justify-between", children: [selectedListing.title, _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setSelectedListing(null), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs(DialogDescription, { children: ["ID: ", selectedListing.id, _jsx(Button, { variant: "ghost", size: "icon", className: "ml-2 h-6 w-6", onClick: () => handleCopyId(selectedListing.id), children: _jsx(ClipboardIcon, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "py-4 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-x-8 gap-y-4 text-sm", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-medium text-muted-foreground", children: "Owner" }), _jsxs("p", { children: [selectedListing.owner_full_name, " (", selectedListing.owner_id, ")"] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-medium text-muted-foreground", children: "Submitted" }), _jsx("p", { children: format(new Date(selectedListing.created_at), 'PPP p') })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-medium text-muted-foreground", children: "Status" }), _jsx("p", { children: _jsx(Badge, { variant: getStatusVariant(selectedListing.status, selectedListing.is_reported), children: selectedListing.status }) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-medium text-muted-foreground", children: "Verified" }), _jsx("p", { children: selectedListing.is_verified ? 'Yes' : 'No' })] }), selectedListing.is_reported && (_jsxs("div", { className: "space-y-1 col-span-2", children: [_jsx("p", { className: "font-medium text-amber-600", children: "Report Reason" }), _jsx("p", { className: "p-3 bg-amber-50 rounded-md border border-amber-200", children: selectedListing.rejection_reason || 'N/A' })] })), selectedListing.status === 'rejected' && !selectedListing.is_reported && (_jsxs("div", { className: "space-y-1 col-span-2", children: [_jsx("p", { className: "font-medium text-destructive", children: "Rejection Reason" }), _jsx("p", { className: "p-3 bg-destructive/10 rounded-md border border-destructive/20", children: selectedListing.rejection_reason || 'N/A' })] }))] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold mb-2", children: "Admin Action History" }), modalLoading ? _jsx(Loader2, { className: "h-5 w-5 animate-spin" }) : (_jsx("div", { className: "max-h-60 overflow-y-auto pr-2", children: listingHistory.length > 0 ? (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Action" }), _jsx(TableHead, { children: "Details" }), _jsx(TableHead, { children: "Timestamp" })] }) }), _jsx(TableBody, { children: listingHistory.map(entry => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: entry.action }), _jsx(TableCell, { className: "text-xs", children: entry.details ? JSON.stringify(entry.details) : 'N/A' }), _jsx(TableCell, { children: format(new Date(entry.created_at), 'Pp') })] }, entry.id))) })] })) : (_jsx("p", { className: "text-muted-foreground text-sm", children: "No history found for this listing." })) }))] })] })] })) }) })] }));
};
