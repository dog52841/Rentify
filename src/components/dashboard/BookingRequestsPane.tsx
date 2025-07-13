import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Check, X, Loader2, Calendar, DollarSign, User, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Skeleton } from '../ui/skeleton';

interface BookingRequest {
  id: string;
  created_at: string;
  start_date: string;
  end_date: string;
  total_price: number;
  renter_id: string;
  renter_name?: string;
  renter_avatar?: string;
  listing_id: string;
  listing_title?: string;
  listing_image?: string;
}

export default function BookingRequestsPane() {
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch booking requests
  useEffect(() => {
    const fetchBookingRequests = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get all listings owned by the user
        const { data: listings } = await supabase
          .from('listings')
          .select('id')
          .eq('user_id', user.id);
        
        if (!listings || listings.length === 0) {
          setLoading(false);
          return;
        }
        
        const listingIds = listings.map(listing => listing.id);
        
        // Get all pending booking requests for these listings
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            id, created_at, start_date, end_date, total_price, renter_id, listing_id,
            approval_status,
            profiles:renter_id(full_name, avatar_url),
            listings:listing_id(title, image_urls)
          `)
          .in('listing_id', listingIds)
          .eq('approval_status', 'pending')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Format the booking data
        const formattedBookings = bookings.map(booking => ({
          id: booking.id,
          created_at: booking.created_at,
          start_date: booking.start_date,
          end_date: booking.end_date,
          total_price: booking.total_price,
          renter_id: booking.renter_id,
          renter_name: booking.profiles?.full_name,
          renter_avatar: booking.profiles?.avatar_url,
          listing_id: booking.listing_id,
          listing_title: booking.listings?.title,
          listing_image: booking.listings?.image_urls?.[0],
        }));
        
        setBookingRequests(formattedBookings);
      } catch (error) {
        console.error('Error fetching booking requests:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load booking requests",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingRequests();
    
    // Set up real-time subscription for new booking requests
    const subscription = supabase
      .channel('booking_requests')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bookings',
        filter: 'approval_status=eq.pending'
      }, (payload) => {
        // Check if this booking is for one of the user's listings
        supabase
          .from('listings')
          .select('id')
          .eq('id', payload.new.listing_id)
          .eq('user_id', user?.id)
          .single()
          .then(({ data }) => {
            if (data) {
              // This is a booking for one of the user's listings
              fetchBookingRequests();
            }
          });
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);

  // Handle approve/reject booking request
  const handleBookingAction = async (bookingId: string, approve: boolean) => {
    try {
      setProcessingIds(prev => [...prev, bookingId]);
      
      // Update the booking approval status
      const { error } = await supabase
        .from('bookings')
        .update({
          approval_status: approve ? 'approved' : 'rejected'
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      // Remove the booking from the list
      setBookingRequests(prev => prev.filter(booking => booking.id !== bookingId));
      
      // Send notification to the renter
      const booking = bookingRequests.find(b => b.id === bookingId);
      if (booking) {
        await supabase.from('notifications').insert({
          user_id: booking.renter_id,
          type: approve ? 'booking_approved' : 'booking_rejected',
          title: approve ? 'Booking Request Approved' : 'Booking Request Rejected',
          content: approve 
            ? `Your booking request for "${booking.listing_title}" has been approved. Please complete payment.` 
            : `Your booking request for "${booking.listing_title}" has been rejected.`,
          action_link: approve ? `/listing/${booking.listing_id}` : '/dashboard',
          related_id: bookingId
        });
      }
      
      toast({
        title: approve ? "Request Approved" : "Request Rejected",
        description: approve 
          ? "The booking request has been approved. The renter will be notified to complete payment." 
          : "The booking request has been rejected.",
      });
    } catch (error) {
      console.error('Error processing booking request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process booking request",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== bookingId));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Booking Requests</h2>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2 w-full">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (bookingRequests.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Booking Requests</h2>
        <Card className="bg-muted/40">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="mx-auto rounded-full bg-background w-12 h-12 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
            <p className="text-muted-foreground text-sm">
              You don't have any pending booking requests at the moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Booking Requests</h2>
        <Badge variant="outline" className="px-2 py-1">
          {bookingRequests.length} pending
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {bookingRequests.map((booking) => {
          const isProcessing = processingIds.includes(booking.id);
          const startDate = new Date(booking.start_date);
          const endDate = new Date(booking.end_date);
          const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.listing_title}</CardTitle>
                      <CardDescription>
                        Request received {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="whitespace-nowrap">
                        <Clock className="mr-1 h-3 w-3" />
                        {days} {days === 1 ? 'day' : 'days'}
                      </Badge>
                      <Badge variant="outline" className="whitespace-nowrap">
                        <DollarSign className="mr-1 h-3 w-3" />
                        ${booking.total_price.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={booking.renter_avatar} alt={booking.renter_name} />
                      <AvatarFallback>
                        <User className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{booking.renter_name}</h4>
                      <p className="text-sm text-muted-foreground">Renter</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/40 p-3 rounded-lg text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="font-medium">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your payout:</span>
                      <span className="font-medium">
                        ${(booking.total_price * 0.93).toFixed(2)}
                        <span className="text-xs text-muted-foreground ml-1">(after 7% renter fee)</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform fee (3%):</span>
                      <span className="font-medium text-red-600">
                        -${(booking.total_price * 0.03).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span className="text-muted-foreground">Final payout:</span>
                      <span className="font-bold text-green-600">
                        ${(booking.total_price * 0.90).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 bg-muted/20 border-t">
                  <Button 
                    variant="outline"
                    className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleBookingAction(booking.id, false)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                    Reject
                  </Button>
                  <Button 
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleBookingAction(booking.id, true)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    Approve
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
} 