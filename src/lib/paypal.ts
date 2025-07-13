import { supabase } from './supabaseClient';

// Configuration for platform fees
export const FEE_CONFIG = {
  RENTER_FEE_PERCENTAGE: 7, // 7% fee charged to renters
  LISTER_FEE_PERCENTAGE: 3, // 3% fee charged to listers
  TOTAL_FEE_PERCENTAGE: 10, // Total platform fee (7% + 3%)
};

// Function to create a PayPal order
export async function createPayPalOrder(
  amount: number, // Total amount in cents
  listingId: string,
  startDate: string,
  endDate: string
): Promise<{ orderId: string } | { error: string }> {
  try {
    // Call the Supabase Edge Function to create a PayPal order
    const { data, error } = await supabase.functions.invoke('create-paypal-order', {
      body: {
        amount: amount / 100, // Convert from cents to dollars
        listingId,
        startDate,
        endDate,
      },
    });

    if (error) throw new Error(error.message);
    
    if (!data || !data.orderId) {
      throw new Error('Failed to create PayPal order');
    }

    return { orderId: data.orderId };
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return { error: error.message || 'Failed to create PayPal order' };
  }
}

// Function to capture a PayPal order after approval
export async function capturePayPalOrder(
  orderId: string
): Promise<{ success: boolean, transactionId?: string } | { error: string }> {
  try {
    // Call the Supabase Edge Function to capture the PayPal order
    const { data, error } = await supabase.functions.invoke('capture-paypal-order', {
      body: { orderId },
    });

    if (error) throw new Error(error.message);
    
    if (!data || !data.success) {
      throw new Error('Failed to capture PayPal order');
    }

    return { 
      success: true, 
      transactionId: data.transactionId 
    };
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error);
    return { error: error.message || 'Failed to capture PayPal payment' };
  }
}

// Function to check if a user has a PayPal merchant account
export async function checkPayPalMerchantStatus(userId: string): Promise<{ 
  hasMerchantId: boolean, 
  merchantId?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('paypal_merchant_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    return { 
      hasMerchantId: !!data?.paypal_merchant_id,
      merchantId: data?.paypal_merchant_id
    };
  } catch (error) {
    console.error('Error checking PayPal merchant status:', error);
    return { hasMerchantId: false };
  }
}

// Function to update booking status after successful payment
export async function updateBookingAfterPayment(
  bookingId: string,
  paymentId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_id: paymentId,
        payment_provider: 'paypal'
      })
      .eq('id', bookingId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating booking after payment:', error);
    return { error: error.message || 'Failed to update booking status' };
  }
}

// Function to get the PayPal client ID from environment variables
export function getPayPalClientId(): string {
  // This should be set in your .env file and exposed by Vite
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  
  if (!clientId) {
    console.error('PayPal client ID is not defined in environment variables');
    return '';
  }
  
  return clientId;
}

// Function to find a booking by PayPal order ID
export async function findBookingByPayPalOrder(
  orderId: string
): Promise<{ id: string, status: string } | null> {
  try {
    const { data, error } = await supabase
      .rpc('find_booking_by_paypal_order', { p_order_id: orderId });

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return null;
    }
    
    return {
      id: data[0].id,
      status: data[0].status
    };
  } catch (error) {
    console.error('Error finding booking by order ID:', error);
    return null;
  }
} 