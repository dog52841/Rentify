import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Loader2, RefreshCw, Filter, Search, Shield, CalendarCheck2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Skeleton } from '../ui/skeleton';
const bookingStatusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    confirmed: 'bg-green-500/20 text-green-500 border-green-500/30',
    denied: 'bg-red-500/20 text-red-500 border-red-500/30',
    completed: 'bg-blue-500/20 text-blue-500 border-blue-500/30'
};
export const BookingsManagementTab = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const { toast } = useToast();
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_bookings_admin');
            if (error)
                throw error;
            setBookings(data || []);
        }
        catch (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch bookings', description: error.message });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchBookings();
    }, []);
    const filteredBookings = useMemo(() => {
        let result = bookings
            .filter(b => statusFilter === 'all' || b.status === statusFilter)
            .filter(b => searchQuery === '' ||
            b.listing_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.renter_name.toLowerCase().includes(searchQuery.toLowerCase()));
        result.sort((a, b) => {
            switch (sortBy) {
                case 'price_high': return b.total_price - a.total_price;
                case 'price_low': return a.total_price - b.total_price;
                case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'newest':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
        return result;
    }, [searchQuery, statusFilter, bookings, sortBy]);
    if (loading) {
        return _jsx(Skeleton, { className: "w-full h-96" });
    }
    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "space-y-6", children: _jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20 overflow-hidden", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-primary", children: [_jsx(CalendarCheck2, { className: "h-5 w-5" }), _jsx("span", { children: "Bookings Management" })] }), _jsx(CardDescription, { children: "View and manage all bookings on the platform." })] }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { onClick: fetchBookings, variant: "ghost", size: "icon", disabled: loading, className: "rounded-full hover:bg-primary/20", children: _jsx(RefreshCw, { className: `h-4 w-4 ${loading ? 'animate-spin' : ''}` }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Refresh bookings" }) })] }) })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "mb-6 flex flex-col sm:flex-row gap-4 items-end flex-wrap", children: [_jsxs("div", { className: "relative w-full sm:w-64", children: [_jsx(Search, { className: "absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by item or renter...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-8 bg-background/50 border-border/50" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "h-4 w-4 text-muted-foreground" }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-[180px] bg-background/50 border-border/50", children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All statuses" }), _jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "confirmed", children: "Confirmed" }), _jsx(SelectItem, { value: "completed", children: "Completed" }), _jsx(SelectItem, { value: "denied", children: "Denied" })] })] })] }), _jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Sort by:" }), _jsxs(Select, { value: sortBy, onValueChange: (v) => setSortBy(v), children: [_jsx(SelectTrigger, { className: "w-[150px] bg-background/50 border-border/50", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "newest", children: "Newest" }), _jsx(SelectItem, { value: "oldest", children: "Oldest" }), _jsx(SelectItem, { value: "price_high", children: "Price: High-Low" }), _jsx(SelectItem, { value: "price_low", children: "Price: Low-High" })] })] })] })] }), _jsx("div", { className: "rounded-md border overflow-hidden", children: _jsxs(Table, { children: [_jsx(TableHeader, { className: "bg-muted/50", children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Renter" }), _jsx(TableHead, { children: "Listing" }), _jsx(TableHead, { children: "Dates" }), _jsx(TableHead, { children: "Total Price" }), _jsx(TableHead, { children: "Status" })] }) }), _jsx(TableBody, { children: filteredBookings.map((booking) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: booking.renter_name }), _jsx(TableCell, { children: booking.listing_title }), _jsx(TableCell, { children: `${format(new Date(booking.start_date), 'PP')} - ${format(new Date(booking.end_date), 'PP')}` }), _jsxs(TableCell, { children: ["$", booking.total_price.toFixed(2)] }), _jsx(TableCell, { children: _jsx(Badge, { className: bookingStatusColors[booking.status] || '', children: booking.status }) })] }, booking.id))) })] }) })] }), _jsx(CardFooter, { className: "flex justify-between border-t bg-muted/30 px-6 py-3", children: _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Showing ", filteredBookings.length, " of ", bookings.length, " total bookings"] }) })] }) }));
};
