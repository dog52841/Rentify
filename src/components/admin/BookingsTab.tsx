import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Loader2, RefreshCw, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

type BookingAdmin = {
    id: number;
    created_at: string;
    listing_id: string;
    listing_title: string;
    renter_id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: string;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'confirmed': return 'success';
        case 'pending': return 'secondary';
        case 'cancelled': return 'destructive';
        default: return 'default';
    }
};

export const BookingsManagementTab = () => {
    const [bookings, setBookings] = useState<BookingAdmin[]>([]);
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
        } else {
            setBookings(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    return (
        <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Briefcase /> All Bookings</CardTitle>
                    <CardDescription>View and manage all bookings across the platform.</CardDescription>
                </div>
                <Button onClick={fetchBookings} variant="ghost" size="icon" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Listing</TableHead>
                                <TableHead>Renter ID</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-medium">{booking.listing_title}</TableCell>
                                    <TableCell className="font-mono text-xs">{booking.renter_id}</TableCell>
                                    <TableCell>{format(new Date(booking.start_date), 'PP')} - {format(new Date(booking.end_date), 'PP')}</TableCell>
                                    <TableCell>${booking.total_price.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getStatusVariant(booking.status)} className="capitalize">
                                            {booking.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}; 