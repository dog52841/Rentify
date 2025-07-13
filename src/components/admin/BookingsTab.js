import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Loader2, RefreshCw, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
const getStatusVariant = (status) => {
    switch (status) {
        case 'confirmed': return 'success';
        case 'pending': return 'secondary';
        case 'cancelled': return 'destructive';
        default: return 'default';
    }
};
export const BookingsManagementTab = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const fetchBookings = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_bookings_admin');
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch bookings',
                description: error.message,
            });
        }
        else {
            setBookings(data || []);
        }
        setLoading(false);
    };
    useEffect(() => {
        fetchBookings();
    }, []);
    return (_jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Briefcase, {}), " All Bookings"] }), _jsx(CardDescription, { children: "View and manage all bookings across the platform." })] }), _jsx(Button, { onClick: fetchBookings, variant: "ghost", size: "icon", disabled: loading, children: _jsx(RefreshCw, { className: `h-4 w-4 ${loading ? 'animate-spin' : ''}` }) })] }), _jsx(CardContent, { children: loading ? (_jsx("div", { className: "flex justify-center items-center py-20", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin" }) })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Listing" }), _jsx(TableHead, { children: "Renter ID" }), _jsx(TableHead, { children: "Dates" }), _jsx(TableHead, { children: "Total" }), _jsx(TableHead, { className: "text-center", children: "Status" })] }) }), _jsx(TableBody, { children: bookings.map((booking) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: booking.listing_title }), _jsx(TableCell, { className: "font-mono text-xs", children: booking.renter_id }), _jsxs(TableCell, { children: [format(new Date(booking.start_date), 'PP'), " - ", format(new Date(booking.end_date), 'PP')] }), _jsxs(TableCell, { children: ["$", booking.total_price.toFixed(2)] }), _jsx(TableCell, { className: "text-center", children: _jsx(Badge, { variant: getStatusVariant(booking.status), className: "capitalize", children: booking.status }) })] }, booking.id))) })] })) })] }));
};
