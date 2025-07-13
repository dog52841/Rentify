import { supabase } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// API client for edge functions
export const api = {
  // Unavailable dates management
  async addUnavailableDate(listingId: string, date: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/add-unavailable-date`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId, date }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add unavailable date');
    }

    return response.json();
  },

  async removeUnavailableDate(listingId: string, date: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/remove-unavailable-date`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId, date }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove unavailable date');
    }

    return response.json();
  },

  async getUnavailableDates(listingId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-unavailable-dates?listing_id=${listingId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch unavailable dates');
    }

    return response.json();
  },

  async checkAvailability(listingId: string, startDate: string, endDate: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId, start_date: startDate, end_date: endDate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check availability');
    }

    return response.json();
  },

  // Listing management
  async getListingDetails(listingId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-listing-details?listing_id=${listingId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch listing details');
    }

    return response.json();
  },

  async getListings(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-listings?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch listings');
    }

    return response.json();
  },

  // Booking management
  async createBooking(bookingData: {
    listing_id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    message?: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create booking');
    }

    return response.json();
  },

  // Direct Supabase calls for operations that don't need edge functions
  async createListing(listingData: any) {
    const { data, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateListing(listingId: string, updates: any) {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteListing(listingId: string) {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) throw error;
  },

  async getUserListings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user listings with correct schema
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        price_per_day,
        location,
        image_urls,
        user_id,
        created_at,
        status,
        category,
        view_count
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process listings
    return data?.map(listing => {
      const images = listing.image_urls || [];

      return {
        ...listing,
        images
      };
    }) || [];
  },

  async getBookings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        listing_id,
        renter_id,
        start_date,
        end_date,
        total_price,
        status,
        created_at,
        listings(
          id,
          title,
          price_per_day,
          image_urls,
          user_id
        )
      `)
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process bookings
    return data?.map(booking => {
      const listing = booking.listings;
      const images = listing.image_urls || [];

      return {
        ...booking,
        listing: {
          ...listing,
          images
        }
      };
    }) || [];
  },

  async getReceivedBookings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get bookings for listings owned by the user
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        listing_id,
        renter_id,
        start_date,
        end_date,
        total_price,
        status,
        created_at,
        listings(
          id,
          title,
          price_per_day,
          image_urls,
          user_id
        )
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process bookings
    return data?.map(booking => {
      const listing = booking.listings;
      const images = listing.image_urls || [];

      return {
        ...booking,
        listing: {
          ...listing,
          images
        }
      };
    }) || [];
  },

  async updateBookingStatus(bookingId: string, status: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createReview(reviewData: {
    listing_id: string;
    booking_id: string;
    rating: number;
    comment: string;
  }) {
    const { data, error } = await supabase
      .from('user_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReviews(listingId: string) {
    const { data, error } = await supabase
      .from('user_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer_id
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async sendMessage(messageData: {
    receiver_id: string;
    listing_id?: string;
    booking_id?: string;
    content: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...messageData,
        sender_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMessages(otherUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        is_read
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        is_read
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group messages by conversation
    const conversations = new Map();
    data?.forEach(message => {
      const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          user: { id: otherUserId },
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    return Array.from(conversations.values());
  }
}; 