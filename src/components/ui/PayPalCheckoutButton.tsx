import { useState, useEffect } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { createPayPalOrder, capturePayPalOrder, getPayPalClientId, updateBookingAfterPayment, findBookingByPayPalOrder } from '../../lib/paypal';
import { Card, CardContent } from './card';
import { cn } from '../../lib/utils';

interface PayPalCheckoutButtonProps {
  amount: number; // Amount in cents
  listingId: string;
  startDate: string;
  endDate: string;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  className?: string;
}

export const PayPalCheckoutButton = ({
  amount,
  listingId,
  startDate,
  endDate,
  onSuccess,
  onError,
  className
}: PayPalCheckoutButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [orderID, setOrderID] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const clientId = getPayPalClientId();
  
  // Reset component state when props change
  useEffect(() => {
    setOrderID(null);
    setPaymentStatus('idle');
    setErrorMessage(null);
  }, [amount, listingId, startDate, endDate]);

  // Function to create the PayPal order
  const handleCreateOrder = async () => {
    setLoading(true);
    setPaymentStatus('processing');
    
    try {
      const result = await createPayPalOrder(amount, listingId, startDate, endDate);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      setOrderID(result.orderId);
      return result.orderId;
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Failed to create PayPal order');
      onError(error.message || 'Failed to create PayPal order');
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || 'Failed to create PayPal order',
      });
      return '';
    } finally {
      setLoading(false);
    }
  };

  // Function to handle the approved PayPal order
  const handleApprove = async (data: any) => {
    setLoading(true);
    setPaymentStatus('processing');
    
    try {
      // Capture the funds from the transaction
      const result = await capturePayPalOrder(data.orderID);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // Update the booking status
      if (result.transactionId) {
        // Find the booking ID associated with this order
        const bookingData = await findBookingByPayPalOrder(data.orderID);
        
        if (bookingData?.id) {
          await updateBookingAfterPayment(bookingData.id, result.transactionId);
        }
      }
      
      setPaymentStatus('success');
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully!",
      });
      
      // Call the onSuccess callback
      onSuccess(data.orderID);
      
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Failed to process payment');
      onError(error.message || 'Failed to process payment');
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || 'Failed to process payment',
      });
    } finally {
      setLoading(false);
    }
  };

  // If there's no client ID, show an error
  if (!clientId) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Payment Configuration Error</h3>
          <p className="text-muted-foreground">
            PayPal checkout is not properly configured. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <PayPalScriptProvider options={{ 
        clientId,
        currency: "USD",
        intent: "capture",
        components: "buttons",
        disableFunding: "credit,card"
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {paymentStatus === 'success' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
            >
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
              <p className="text-green-700">
                Your payment has been processed successfully. Thank you for your booking!
              </p>
            </motion.div>
          ) : paymentStatus === 'error' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
            >
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Failed</h3>
              <p className="text-red-700 mb-4">
                {errorMessage || 'There was an error processing your payment. Please try again.'}
              </p>
              <PayPalButtons
                style={{ 
                  layout: 'vertical',
                  shape: 'rect',
                  color: 'gold'
                }}
                createOrder={handleCreateOrder}
                onApprove={handleApprove}
                disabled={loading}
              />
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700 text-sm">
                  You'll be redirected to PayPal to complete your payment securely.
                </p>
              </div>
              
              <PayPalButtons
                style={{ 
                  layout: 'vertical',
                  shape: 'rect',
                  color: 'gold'
                }}
                createOrder={handleCreateOrder}
                onApprove={handleApprove}
                disabled={loading}
              />
              
              {loading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm font-medium">Processing payment...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </PayPalScriptProvider>
    </div>
  );
}; 