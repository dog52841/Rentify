import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Loader2, RefreshCw, Filter, Search, Shield, CalendarCheck2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Skeleton } from '../ui/skeleton';

type BookingAdmin = {
    id: string;
    created_at: string;
    listing_id: string;
    renter_id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: 'pending' | 'confirmed' | 'denied' | 'completed';
    listing_title: string;
    renter_name: string;
};

const bookingStatusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    confirmed: 'bg-green-500/20 text-green-500 border-green-500/30',
    denied: 'bg-red-500/20 text-red-500 border-red-500/30',
    completed: 'bg-blue-500/20 text-blue-500 border-blue-500/30'
};

export const BookingsManagementTab = () => {
    const [bookings, setBookings] = useState<BookingAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');
    const { toast } = useToast();

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_bookings_admin');
            if (error) throw error;
            setBookings(data || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to fetch bookings', description: error.message });
        } finally {
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
                         b.renter_name.toLowerCase().includes(searchQuery.toLowerCase())
            );

        result.sort((a, b) => {
            switch(sortBy) {
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
        return <Skeleton className="w-full h-96" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <CalendarCheck2 className="h-5 w-5" />
                            <span>Bookings Management</span>
                        </CardTitle>
                        <CardDescription>View and manage all bookings on the platform.</CardDescription>
                    </div>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={fetchBookings} variant="ghost" size="icon" disabled={loading} className="rounded-full hover:bg-primary/20">
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Refresh bookings</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-end flex-wrap">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by item or renter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 bg-background/50 border-border/50" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="denied">Denied</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm text-muted-foreground">Sort by:</span>
                            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                <SelectTrigger className="w-[150px] bg-background/50 border-border/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="oldest">Oldest</SelectItem>
                                    <SelectItem value="price_high">Price: High-Low</SelectItem>
                                    <SelectItem value="price_low">Price: Low-High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Renter</TableHead>
                                    <TableHead>Listing</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Total Price</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-medium">{booking.renter_name}</TableCell>
                                        <TableCell>{booking.listing_title}</TableCell>
                                        <TableCell>{`${format(new Date(booking.start_date), 'PP')} - ${format(new Date(booking.end_date), 'PP')}`}</TableCell>
                                        <TableCell>${booking.total_price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge className={bookingStatusColors[booking.status] || ''}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/30 px-6 py-3">
                    <p className="text-xs text-muted-foreground">Showing {filteredBookings.length} of {bookings.length} total bookings</p>
                </CardFooter>
            </Card>
        </motion.div>
    );
}; 