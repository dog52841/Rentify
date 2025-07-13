import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, Home, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { motion } from 'framer-motion';
import { capturePayPalOrder, findBookingByPayPalOrder } from '../lib/paypal';
import { useToast } from '../hooks/use-toast';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { format } from 'date-fns';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [bookingDetails, setBookingDetails] = useState<{
        listingTitle?: string;
        listingImage?: string;
        startDate?: string;
        endDate?: string;
        totalPrice?: number;
    }>({});

    useEffect(() => {
        const confirmBooking = async () => {
            // PayPal returns token in the URL
            const token = searchParams.get('token');
            
            if (!token || !user) {
                setStatus('error');
                setMessage('Invalid payment information or user not logged in.');
                return;
            }

            try {
                // Capture the PayPal order
                const result = await capturePayPalOrder(token);
                
                if ('error' in result) {
                    throw new Error(result.error);
                }
                
                // Find the booking using our function
                const bookingData = await findBookingByPayPalOrder(token);
                
                if (!bookingData) {
                    throw new Error('Booking not found for this order');
                }
                
                // Get more booking details
                const { data: booking, error: bookingError } = await supabase
                    .from('bookings')
                    .select('*, listings(title, image_urls)')
                    .eq('id', bookingData.id)
                    .single();
                
                if (bookingError || !booking) {
                    throw new Error('Failed to load booking details');
                }
                
                // Set booking details for display
                setBookingDetails({
                    listingTitle: booking.listings?.title,
                    listingImage: booking.listings?.image_urls?.[0],
                    startDate: booking.start_date,
                    endDate: booking.end_date,
                    totalPrice: booking.total_price,
                });
                
                setStatus('success');
                setMessage('Your booking has been confirmed! You can view it in your dashboard.');
                
                // Show success toast
                toast({
                    title: "Payment Successful!",
                    description: "Your booking has been confirmed.",
                });
                
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'An unexpected error occurred.');
                console.error('Booking confirmation failed:', err);
                
                // Show error toast
                toast({
                    variant: "destructive",
                    title: "Payment Error",
                    description: err.message || 'An unexpected error occurred.',
                });
            }
        };

        confirmBooking();
    }, [searchParams, user, toast]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-8"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Loader2 className="h-16 w-16 text-primary" />
                            </motion.div>
                        </div>
                        <h2 className="text-2xl font-semibold mt-4">Processing Your Payment</h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            We're confirming your payment with PayPal. This should only take a moment...
                        </p>
                    </motion.div>
                );
            case 'success':
                return (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-6 py-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: 0.1
                            }}
                            className="bg-green-100 p-4 rounded-full"
                        >
                            <CheckCircle className="h-16 w-16 text-green-600" />
                        </motion.div>
                        
                        <div className="text-center">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Payment Successful!
                            </h2>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                {message}
                            </p>
                        </div>
                        
                        {bookingDetails.listingTitle && (
                            <Card className="w-full max-w-md mt-4 overflow-hidden border-primary/20">
                                {bookingDetails.listingImage && (
                                    <div className="w-full h-48 overflow-hidden">
                                        <img 
                                            src={bookingDetails.listingImage} 
                                            alt={bookingDetails.listingTitle}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-semibold">{bookingDetails.listingTitle}</h3>
                                    
                                    <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <div className="flex items-center gap-2">
                                            <span>{bookingDetails.startDate && format(new Date(bookingDetails.startDate), 'MMM d, yyyy')}</span>
                                            <ArrowRight className="h-3 w-3" />
                                            <span>{bookingDetails.endDate && format(new Date(bookingDetails.endDate), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex justify-between font-medium">
                                            <span>Total Paid:</span>
                                            <span className="text-lg">${bookingDetails.totalPrice?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-md">
                            <Button 
                                asChild 
                                className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                            >
                                <Link to="/dashboard?tab=my-rentals">View My Bookings</Link>
                            </Button>
                            <Button asChild variant="outline" className="flex-1">
                                <Link to="/browse">Continue Browsing</Link>
                            </Button>
                        </div>
                    </motion.div>
                );
            case 'error':
                return (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-6 py-8 text-center"
                    >
                        <div className="bg-red-100 p-4 rounded-full">
                            <XCircle className="h-16 w-16 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-600">Payment Error</h2>
                            <p className="text-muted-foreground mt-2 max-w-md">{message}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <Button 
                                asChild 
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => navigate(-1)}
                            >
                                <Link to="/browse">Try Again</Link>
                            </Button>
                            <Button asChild>
                                <Link to="/browse">Browse Other Listings</Link>
                            </Button>
                        </div>
                    </motion.div>
                );
        }
    };
    
    return (
        <AnimatedSection>
            <div className="container mx-auto px-4 py-12">
                <Card className="max-w-2xl mx-auto shadow-xl border-primary/10">
                    <CardContent className="p-8 sm:p-12">
                        {renderContent()}
                    </CardContent>
                </Card>
            </div>
        </AnimatedSection>
    );
};

export default PaymentSuccessPage; 