import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, type LatLngTuple } from 'leaflet';
import { Star, MapPin, Calendar as CalendarIcon, MessageSquare, ChevronLeft, User as UserIcon, Check, Info, Camera, Heart, Search as SearchIcon, Loader2, X, ShieldCheck, CheckCircle, XCircle, Share2, Compass, Award, MoreHorizontal, ShieldAlert, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, differenceInCalendarDays, addDays, isValid } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import Reviews from '../components/ui/Reviews';
import StarRating from '../components/ui/StarRating';
import PannellumViewer from '../components/ui/PannellumViewer';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { PayPalCheckoutButton } from "../components/ui/PayPalCheckoutButton";
import { createPayPalOrder, FEE_CONFIG } from '../lib/paypal';
import Lightbox from '../components/ui/Lightbox';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Textarea } from '../components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip";
import {
    Alert,
    AlertDescription,
} from "../components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

// Leaflet marker icon fix
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

interface Listing {
  id: string;
  title: string;
  description: string;
  price_per_day: number;
  image_urls: string[];
  location: string;
  location_geom: string;
  location_lat: number;
  location_lng: number;
  user_id: string;
  owner_id: string;
  owner_name: string;
  owner_avatar_url: string;
  owner_is_verified: boolean;
  average_rating?: number;
  review_count?: number;
  status: string;
  is_verified: boolean;
  image_360_url?: string;
  created_at: string;
  updated_at: string;
}

const parsePoint = (pointString?: string): LatLngTuple | null => {
  if (!pointString) return null;
  const match = /POINT\(([-\d\.]+) ([-\d\.]+)\)/.exec(pointString);
  if (!match) return null;
  // Note: PostGIS is (lng, lat), Leaflet is (lat, lng)
  return [parseFloat(match[2]), parseFloat(match[1])];
}

const Skeleton = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="mb-8">
            <div className="h-12 w-3/4 bg-muted rounded-lg mb-4"></div>
            <div className="flex items-center gap-4">
                <div className="h-6 w-1/3 bg-muted rounded-lg"></div>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
                <div className="aspect-video w-full bg-muted rounded-2xl"></div>
                <div className="hidden md:flex gap-2 mt-2">
                    <div className="w-20 h-20 bg-muted rounded-lg"></div>
                    <div className="w-20 h-20 bg-muted rounded-lg"></div>
                    <div className="w-20 h-20 bg-muted rounded-lg"></div>
                </div>
            </div>
            <div className="lg:col-span-2">
                <div className="sticky top-24 space-y-6">
                    <div className="bg-muted border rounded-xl shadow-lg p-6 space-y-6 h-96"></div>
                    <div className="bg-muted border rounded-2xl p-6 h-24"></div>
                </div>
            </div>
        </div>
    </div>
);

const ListingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [show360View, setShow360View] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | '360' | 'map'>('gallery');

  // Booking state
  const [bookingDate, setBookingDate] = useState<DateRange | undefined>();
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // PayPal integration state
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) {
        setError("No listing ID provided.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get listing with owner information using direct query
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            description,
            price_per_day,
            location,
            location_geom,
            user_id,
            status,
            is_verified,
            image_urls,
            image_360_url,
            created_at,
            updated_at,
            category,
            view_count
          `)
          .eq('id', listingId)
          .single();

        if (listingError) throw listingError;
        if (!listingData) throw new Error("Listing not found.");

        // Get owner profile information
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, is_verified')
          .eq('id', listingData.user_id)
          .single();

        if (profileError) throw profileError;

        // Get reviews for rating calculation
        const { data: reviews, error: reviewsError } = await supabase
          .from('user_reviews')
          .select('rating')
          .eq('listing_id', listingId);

        if (reviewsError) throw reviewsError;

        const averageRating = reviews && reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0;

        // Increment view count
        await supabase
          .from('listings')
          .update({ view_count: (listingData.view_count || 0) + 1 })
          .eq('id', listingId);

        // Parse location coordinates
        let location_lat = null;
        let location_lng = null;
        if (listingData.location_geom) {
          const match = /POINT\(([-\d\.]+) ([-\d\.]+)\)/.exec(listingData.location_geom);
          if (match) {
            location_lng = parseFloat(match[1]);
            location_lat = parseFloat(match[2]);
          }
        }

        setListing({
          ...listingData,
          image_urls: listingData.image_urls || [],
          owner_id: listingData.user_id,
          owner_name: profileData.full_name,
          owner_avatar_url: profileData.avatar_url,
          owner_is_verified: profileData.is_verified,
          average_rating: averageRating,
          review_count: reviews?.length || 0,
          location_lat,
          location_lng
        });

      } catch (error: any) {
        console.error("Error fetching listing:", error);
        setError(error.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  useEffect(() => {
    const checkFavorite = async () => {
        if (!user || !listing) return;

        setIsFavoriteLoading(true);
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('listing_id', listing.id)
                .maybeSingle();
            
            if (error) throw error;
            setIsFavorited(!!data);

        } catch(error: any) {
            console.error("Error checking favorite status:", error);
        } finally {
            setIsFavoriteLoading(false);
        }
    }
    checkFavorite();
  }, [user, listing]);

  const handleNextImage = () => {
    if (!listing) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % listing.image_urls.length);
  };
  
  const handlePrevImage = () => {
    if (!listing) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + listing.image_urls.length) % listing.image_urls.length);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  }

  const mapPosition = useMemo((): LatLngTuple | null => {
    if (listing?.location_geom) {
      return parsePoint(listing.location_geom);
    } else if (listing?.location_lat && listing?.location_lng) {
      return [listing.location_lat, listing.location_lng] as LatLngTuple;
    }
    return null;
  }, [listing]);
  
  const handleContactOwner = async () => {
    if (!user || !listing) {
      toast({
        variant: "destructive",
        title: "Please sign in",
        description: "You need to be logged in to start a conversation.",
      });
      return;
    }
    
    // Prevent owner from contacting themselves
    if (user.id === listing.owner_id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not start a conversation.",
        });
        return;
    }

    try {
        // Check if a conversation already exists
        const { data: existingConversation, error: existingError } = await supabase
            .from('conversations')
            .select('id')
            .eq('listing_id', listing.id)
            .eq('renter_id', user.id)
            .maybeSingle();

        if (existingError) throw existingError;

        if (existingConversation) {
            navigate(`/messages/${existingConversation.id}`);
        } else {
            // Create a new conversation
            const { data: newConversation, error: insertError } = await supabase
                .from('conversations')
                .insert({
                    listing_id: listing.id,
                    owner_id: listing.owner_id,
                    renter_id: user.id,
                })
                .select()
                .single();
            
            if (insertError) throw insertError;
            
            if(newConversation) {
              navigate(`/messages/${newConversation.id}`);
            }
        }
    } catch (error: any) {
        console.error("Error handling contact owner:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not start a conversation.",
        });
    }
};

  const handleToggleFavorite = async () => {
    if (!user || !listing) {
        toast({
            variant: 'destructive',
            title: 'Please log in',
            description: 'You need to be logged in to save listings.'
        });
        return;
    }

    setIsFavoriteLoading(true);
    try {
        if(isFavorited) {
            // unfavorite
            const { error } = await supabase
                .from('favorites')
                .delete()
                .match({ user_id: user.id, listing_id: listing.id });
            if (error) throw error;
            setIsFavorited(false);
            toast({ title: "Removed from favorites." });
        } else {
            // favorite
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: user.id, listing_id: listing.id });
            if (error) throw error;
            setIsFavorited(true);
            toast({ title: "Added to favorites!" });
        }
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message,
        });
    } finally {
        setIsFavoriteLoading(false);
    }
  };

  const handleRequestToBook = async () => {
    // This function is no longer needed with the PayPal implementation
    // We're now showing the PayPal button directly when the user clicks "Request to Book"
    // The PayPalCheckoutButton component handles the payment flow
  };

  const handleSuccessfulPayment = async (orderId: string) => {
    try {
      if (!user || !listing || !bookingDate?.from || !bookingDate?.to) {
        return;
      }

      toast({
        title: "Payment successful!",
        description: "Your booking has been confirmed.",
      });

      // Reset the booking form
      setBookingDate(undefined);

      // Redirect to bookings page
      navigate("/dashboard/bookings");
    } catch (error) {
      console.error("Error handling successful payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error finalizing your booking. Please contact support.",
      });
    }
  };

  const handleVerifyListing = async (verify: boolean) => {
    if (!user || profile?.role !== 'admin' || !listing) return;

    setIsVerifying(true);
    try {
        const { error } = await supabase.rpc('set_listing_verification', {
            p_listing_id: listing.id,
            p_is_verified: verify,
        });

        if (error) throw error;
        
        setListing(prev => prev ? { ...prev, is_verified: verify } : null);
        toast({
            title: `Listing ${verify ? 'Verified' : 'Unverified'}`,
            description: `This listing is now ${verify ? 'marked as verified' : 'no longer verified'}.`,
        });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Verification Failed',
            description: error.message,
        });
    } finally {
        setIsVerifying(false);
    }
  };

  const handleReportListing = async () => {
    if (!user) {
        toast({ title: "Authentication required", description: "You must be logged in to report a listing.", variant: "destructive" });
        return;
    }
    if (!listing) {
        toast({ title: "Error", description: "Listing information not available.", variant: "destructive" });
        return;
    }
    if (!reportReason.trim()) {
        toast({ title: "Reason required", description: "Please provide a reason for reporting this listing.", variant: "destructive" });
        return;
    }

    const listingId = listing.id; // Store in a constant to help TypeScript understand it's not null
    
    setIsReporting(true);
    try {
        const { error } = await supabase.rpc('report_listing', {
            p_listing_id: listingId,
            p_reporter_id: user.id,
            p_reason: reportReason
        });

        if (error) throw error;
        
        toast({ title: "Listing Reported", description: "Thank you for your feedback. Our team will review this listing shortly." });
        setIsReportModalOpen(false);
        setReportReason("");

    } catch (error: any) {
        toast({ title: "Reporting Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsReporting(false);
    }
  };
  
  // Helper for Google Maps link
  const getGoogleMapsUrl = () => {
    if (!listing) return '#';
    if (listing.location_lat && listing.location_lng) {
      return `https://www.google.com/maps/search/?api=1&query=${listing.location_lat},${listing.location_lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location)}`;
  };

  if (loading) return <Skeleton />;
  if (error || !listing) return (
    <div className="max-w-2xl mx-auto py-24 text-center">
      <Alert variant="destructive">
        <AlertCircle className="h-6 w-6 mr-2" />
        <AlertDescription>{error || 'Listing not found.'}</AlertDescription>
      </Alert>
      <Button asChild className="mt-8"><Link to="/browse">Back to Browse</Link></Button>
    </div>
  );

  const mainImage = listing.image_urls?.[currentImageIndex];
  const thumbImages = listing.image_urls?.slice(0, 5) || [];

  return (
    <div className="bg-background text-foreground">
        <AnimatePresence>
            {isLightboxOpen && listing.image_urls.length > 0 && (
                <Lightbox 
                    images={listing.image_urls} 
                    selectedIndex={lightboxIndex}
                    onClose={() => setIsLightboxOpen(false)}
                    onNext={handleNextImage}
                    onPrev={handlePrevImage}
                />
            )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Tabs for Gallery, 360, Map */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <TabsList className="flex gap-2 bg-muted/60 rounded-xl p-1 shadow-lg w-full max-w-lg mx-auto">
                        <TabsTrigger value="gallery" className="flex-1">Gallery</TabsTrigger>
                        <TabsTrigger value="360" className="flex-1">360° View</TabsTrigger>
                        <TabsTrigger value="map" className="flex-1">Map</TabsTrigger>
                    </TabsList>
                    <div className="mt-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'gallery' && (
                                <TabsContent value="gallery" forceMount>
                                    {/* Gallery with thumbnails and lightbox */}
                                    <motion.div
                                        key="gallery"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted mb-4 shadow-xl">
                                            <img
                                                src={listing.image_urls?.[currentImageIndex] || '/placeholder-image.jpg'}
                                                alt={listing.title}
                                                className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                                                onClick={() => setIsLightboxOpen(true)}
                                            />
                                            {/* Left/Right navigation */}
                                            {listing.image_urls.length > 1 && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="absolute top-1/2 left-3 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full shadow-lg"
                                                        onClick={e => { e.stopPropagation(); setCurrentImageIndex((currentImageIndex - 1 + listing.image_urls.length) % listing.image_urls.length); }}
                                                        aria-label="Previous image"
                                                    >
                                                        <ChevronLeft className="h-6 w-6" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="absolute top-1/2 right-3 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full shadow-lg"
                                                        onClick={e => { e.stopPropagation(); setCurrentImageIndex((currentImageIndex + 1) % listing.image_urls.length); }}
                                                        aria-label="Next image"
                                                    >
                                                        <ChevronLeft className="h-6 w-6 rotate-180" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                        {/* Thumbnails */}
                                        {listing.image_urls.length > 1 && (
                                            <div className="flex gap-2 justify-center mt-2">
                                                {listing.image_urls.map((img, idx) => (
                                                    <button
                                                        key={img + idx}
                                                        className={cn(
                                                            "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                                                            idx === currentImageIndex ? "border-primary scale-110 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                                                        )}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                    >
                                                        <img src={img} alt={listing.title + ' thumbnail'} className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {/* Lightbox modal */}
                                        <Lightbox
                                            images={listing.image_urls}
                                            isOpen={isLightboxOpen}
                                            initialIndex={currentImageIndex}
                                            onClose={() => setIsLightboxOpen(false)}
                                            onIndexChange={setCurrentImageIndex}
                                        />
                                    </motion.div>
                                </TabsContent>
                            )}
                            {activeTab === '360' && (
                                <TabsContent value="360" forceMount>
                                    <motion.div
                                        key="360"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {listing.image_360_url ? (
                                            <div className="rounded-2xl overflow-hidden shadow-xl bg-muted">
                                                <PannellumViewer imageSource={listing.image_360_url} />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-96 bg-muted/60 rounded-2xl shadow-inner">
                                                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                                                <p className="text-lg font-semibold text-muted-foreground">No 360° view available for this listing.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </TabsContent>
                            )}
                            {activeTab === 'map' && (
                                <TabsContent value="map" forceMount>
                                    <motion.div
                                        key="map"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="rounded-2xl overflow-hidden shadow-xl bg-muted">
                                            {listing.location_lat && listing.location_lng ? (
                                                <MapContainer
                                                    center={[listing.location_lat, listing.location_lng]}
                                                    zoom={15}
                                                    scrollWheelZoom={false}
                                                    style={{ height: 400, width: '100%' }}
                                                    className="rounded-2xl"
                                                    dragging={false}
                                                    doubleClickZoom={false}
                                                    zoomControl={false}
                                                    attributionControl={false}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution="&copy; OpenStreetMap contributors"
                                                    />
                                                    <Marker position={[listing.location_lat, listing.location_lng]} icon={defaultIcon}>
                                                        <Popup>
                                                            <div className="font-semibold">{listing.title}</div>
                                                            <div className="text-xs text-muted-foreground">{listing.location}</div>
                                                        </Popup>
                                                    </Marker>
                                                </MapContainer>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-96">
                                                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                                                    <p className="text-lg font-semibold text-muted-foreground">Location not available.</p>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-4 px-4 pb-4">
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {listing.location}
                                                </div>
                                                <Button asChild variant="outline" size="sm" className="ml-2">
                                                    <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
                                                        <Compass className="h-4 w-4 mr-1" /> Open in Google Maps
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </TabsContent>
                            )}
                        </AnimatePresence>
                    </div>
                </Tabs>
                {/* Header */}
                <AnimatedSection delay={0.1}>
                    <div className="mb-8">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-muted-foreground">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back to results
                        </Button>
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">{listing.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Star className="h-5 w-5 text-primary fill-current" />
                                <span className="font-bold text-foreground">{listing.average_rating?.toFixed(1) || "New"}</span>
                                ({listing.review_count || 0} reviews)
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-5 w-5" />
                                {listing.location}
                            </div>
                            {listing.is_verified && (
                                <Badge variant="success" className="gap-1.5 pl-2">
                                    <ShieldCheck className="h-4 w-4" /> Verified
                                </Badge>
                            )}
                        </div>
                    </div>
                </AnimatedSection>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Left Column: Images & Details */}
                    <div className="lg:col-span-3">
                        {/* Image Gallery */}
                        <Card className="relative group overflow-hidden shadow-2xl rounded-2xl border-border/10">
                            <AnimatePresence initial={false}>
                                <motion.img
                                    key={currentImageIndex}
                                    src={listing.image_urls[currentImageIndex]}
                                    alt={`Listing image ${currentImageIndex + 1}`}
                                    className="w-full object-cover aspect-video cursor-pointer"
                                    onClick={() => openLightbox(currentImageIndex)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </AnimatePresence>
                            
                            {/* Navigation Arrows */}
                            {listing.image_urls.length > 1 && (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                        onClick={handlePrevImage}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                        onClick={handleNextImage}
                                    >
                                        <ChevronLeft className="h-6 w-6 rotate-180" />
                                    </Button>
                                </>
                            )}
                            
                            {/* Image Counter */}
                            {listing.image_urls.length > 1 && (
                                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                                    {currentImageIndex + 1} / {listing.image_urls.length}
                                </div>
                            )}
                            
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-background/70 backdrop-blur-sm hover:bg-background/90">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                                            <Share2 className="mr-2 h-4 w-4" /> Share
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="text-red-500 focus:bg-red-50 focus:text-red-600">
                                            <ShieldAlert className="mr-2 h-4 w-4" /> Report
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-background/70 backdrop-blur-sm hover:bg-background/90" onClick={handleToggleFavorite} disabled={isFavoriteLoading}>
                                    {isFavorited ? <Heart className="h-5 w-5 text-red-500 fill-current" /> : <Heart className="h-5 w-5" />}
                                </Button>
                            </div>
                        </Card>
                        
                        {/* Thumbnail Navigation */}
                        {listing.image_urls.length > 1 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                {listing.image_urls.map((image, index) => (
                                    <motion.div
                                        key={index}
                                        className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                            index === currentImageIndex 
                                                ? 'border-primary scale-105' 
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                        onClick={() => setCurrentImageIndex(index)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <img
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-20 h-20 object-cover"
                                        />
                                        {index === currentImageIndex && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        <AnimatedSection delay={0.3}>
                            <Card className="border-0 bg-transparent shadow-none">
                                <CardHeader className="p-0 mb-4">
                                    <CardTitle className="text-2xl">About this item</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 text-muted-foreground whitespace-pre-wrap">
                                    {listing.description}
                                </CardContent>
                            </Card>
                        </AnimatedSection>
                        
                        <div className="my-8 border-t"></div>

                        {/* Reviews */}
                        <AnimatedSection delay={0.4}>
                            <Reviews listingId={listing.id} ownerId={listing.owner_id}/>
                        </AnimatedSection>

                        <div className="my-8 border-t"></div>

                        {/* Map */}
                        <AnimatedSection delay={0.5}>
                            <h2 className="text-2xl font-bold mb-4">Location</h2>
                            <div className="h-96 w-full rounded-2xl overflow-hidden">
                                {mapPosition ? (
                                    <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Marker position={mapPosition} icon={defaultIcon}></Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="h-full w-full bg-muted flex items-center justify-center">
                                        <p className="text-muted-foreground">Location not available.</p>
                                    </div>
                                )}
                            </div>
                        </AnimatedSection>

                    </div>

                    {/* Right Column: Booking & Owner */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24 space-y-6">
                            <BookingCard 
                                listing={listing}
                                bookingDate={bookingDate}
                                setBookingDate={(date) => {
                                    setBookingDate(date);
                                    // Reset payment state if date changes
                                    setPaymentError(null);
                                }}
                                bookingLoading={isBookingLoading}
                                setIsBookingLoading={setIsBookingLoading}
                                handleRequestToBook={handleRequestToBook}
                                paymentError={paymentError}
                                onSuccessfulPayment={handleSuccessfulPayment}
                            />
                            
                            <OwnerCard 
                                listing={listing}
                                user={user}
                                handleContactOwner={handleContactOwner}
                            />
                            
                            {profile?.role === 'admin' && (
                                <AdminVerificationCard 
                                    listing={listing} 
                                    onVerify={handleVerifyListing}
                                    loading={isVerifying}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        <AnimatePresence>
            {show360View && listing.image_360_url && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                >
                    <PannellumViewer imageSource={listing.image_360_url} />
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-4 right-4 rounded-full"
                        onClick={() => setShow360View(false)}
                    >
                        <X className="h-6 w-6"/>
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Reporting Modal */}
        <AlertDialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <ShieldAlert className="h-5 w-5" />
                        Report this listing
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Please select a reason for reporting this listing. Your feedback helps us maintain a safe and trustworthy marketplace.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 gap-2">
                        {["Inaccurate description", "Suspicious user", "Prohibited item", "Scam", "Other"].map((reason) => (
                            <Button
                                key={reason}
                                type="button"
                                variant={reportReason === reason ? "default" : "outline"}
                                className={cn(
                                    "justify-start text-left",
                                    reportReason === reason ? "border-primary" : "border-input"
                                )}
                                onClick={() => setReportReason(reason)}
                            >
                                {reportReason === reason && <Check className="mr-2 h-4 w-4" />}
                                {reason}
                            </Button>
                        ))}
                    </div>
                    
                    {reportReason === "Other" && (
                        <Textarea 
                            placeholder="Please provide details about your concern..."
                            value={reportReason === "Other" ? reportReason : ""}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    )}
                    
                    <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            Our team will review this report within 24-48 hours
                        </p>
                    </div>
                </div>
                
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isReporting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleReportListing} 
                        disabled={isReporting || !reportReason}
                        className={cn(
                            "relative overflow-hidden",
                            !reportReason && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isReporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-destructive/0 via-destructive/30 to-destructive/0 animate-shimmer" style={{ transform: 'translateX(-100%)' }}></span>
                                Submit Report
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

interface BookingCardProps {
  listing: Listing;
  bookingDate: DateRange | undefined;
  setBookingDate: (date: DateRange | undefined) => void;
  bookingLoading: boolean;
  setIsBookingLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleRequestToBook: () => void;
  paymentError: string | null;
  onSuccessfulPayment: (orderId: string) => void;
}

const BookingCard = ({ 
  listing, 
  bookingDate, 
  setBookingDate, 
  bookingLoading, 
  setIsBookingLoading,
  handleRequestToBook, 
  paymentError, 
  onSuccessfulPayment 
}: BookingCardProps) => {
  const days = bookingDate?.from && bookingDate?.to ? differenceInCalendarDays(bookingDate.to, bookingDate.from) + 1 : 0;
  const subtotal = days * listing.price_per_day;
  const renterServiceFee = subtotal * 0.07; // 7% renter fee
  const total = subtotal + renterServiceFee;
  const listerPayout = subtotal * 0.97; // 97% of subtotal (3% lister fee deducted)

  // State to track if we're in payment mode
  const [showPayment, setShowPayment] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loadingUnavailableDates, setLoadingUnavailableDates] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // Fetch unavailable dates
  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (!listing.id) return;
      try {
        setLoadingUnavailableDates(true);
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-unavailable-dates?listing_id=${listing.id}`,
          session ? {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          } : undefined
        );
        if (response.ok) {
          const { dates: dateStrings } = await response.json();
          // Convert string dates to Date objects
          const dates = dateStrings.map((dateStr: string) => {
            const date = new Date(dateStr);
            return isValid(date) ? date : undefined;
          }).filter(Boolean) as Date[];
          setUnavailableDates(dates);
        } else {
          console.error('Failed to fetch unavailable dates');
          setUnavailableDates([]);
        }
      } catch (error) {
        console.error('Error fetching unavailable dates:', error);
      } finally {
        setLoadingUnavailableDates(false);
      }
    };
    fetchUnavailableDates();
  }, [listing.id]);

  const submitBookingRequest = async () => {
    if (!user || !bookingDate?.from || !bookingDate?.to) return;
    
    try {
      setIsBookingLoading(true);
      
      // Check if the date range is available by checking unavailable dates
      const unavailableDateStrings = unavailableDates.map(date => 
        format(date, 'yyyy-MM-dd')
      );
      
      const startDate = format(bookingDate.from, 'yyyy-MM-dd');
      const endDate = format(bookingDate.to, 'yyyy-MM-dd');
      
      // Check if any date in the range is unavailable
      const hasUnavailableDates = unavailableDateStrings.some(date => 
        date >= startDate && date <= endDate
      );
      
      if (hasUnavailableDates) {
        toast({
          variant: "destructive",
          title: "Dates Unavailable",
          description: "Some of your selected dates are unavailable. Please select different dates.",
        });
        return;
      }
      
      // Create a booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          listing_id: listing.id,
          renter_id: user.id,
          start_date: startDate,
          end_date: endDate,
          total_price: total,
          status: 'confirmed'
        })
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      
      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been confirmed successfully.",
      });
      
      // Reset the booking form
      setBookingDate(undefined);
      
    } catch (error) {
      console.error('Error submitting booking request:', error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
      });
    } finally {
      setIsBookingLoading(false);
    }
  };



  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
    <Card className="shadow-2xl shadow-primary/10 border-border/20 bg-card/80 backdrop-blur-lg overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <div className="flex justify-between items-baseline">
          <CardTitle className="text-2xl">
            <span className="font-extrabold text-3xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">${listing.price_per_day}</span>
            <span className="text-muted-foreground font-normal text-base">/day</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 text-primary fill-current"/>
            <span className="font-bold">{listing.average_rating?.toFixed(1) || "New"}</span>
            <span className="text-muted-foreground">({listing.review_count || 0} reviews)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
          {!requestSent ? (
            <>
        <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
          <div className="p-2 bg-muted/50 border-b flex items-center justify-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Select Rental Dates</span>
          </div>
          {loadingUnavailableDates ? (
            <div className="p-6 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <DayPicker
              mode="range"
              selected={bookingDate}
              onSelect={setBookingDate}
              numberOfMonths={1}
              disabled={[
                { before: new Date() },
                ...unavailableDates.map(date => new Date(date))
              ]}
              className="p-3"
              classNames={{
                day_selected: "bg-primary text-primary-foreground",
                day_range_middle: "bg-primary/20",
                day_range_end: "bg-primary text-primary-foreground",
                day_range_start: "bg-primary text-primary-foreground"
              }}
              modifiers={{
                unavailable: unavailableDates
              }}
              modifiersStyles={{
                unavailable: {
                  textDecoration: 'line-through',
                  color: 'var(--muted-foreground)',
                  backgroundColor: 'var(--muted)'
                }
              }}
            />
          )}
        </div>
        {bookingDate?.from && bookingDate?.to && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3 p-4 rounded-lg border bg-muted/20"
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">${listing.price_per_day.toFixed(2)} × {days} {days === 1 ? 'day' : 'days'}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                Renter service fee (7%)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">This 7% fee helps us run our platform and offer services like 24/7 support.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span>${renterServiceFee.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t mt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-lg">${total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You won't be charged until the owner approves and you complete payment
              </p>
            </div>
          </motion.div>
              )}
            </>
          ) : (
            <AnimatePresence mode="wait">
              {approvalStatus === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 flex flex-col items-center text-center space-y-4"
                >
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <Clock className="h-6 w-6 text-primary absolute inset-0 m-auto" />
                  </div>
                  <h3 className="text-xl font-semibold">Awaiting Owner Approval</h3>
                  <p className="text-muted-foreground">
                    Your request has been sent to the owner. You'll be notified once they respond.
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse w-1/3"></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Most owners respond within 24 hours
                  </p>
                </motion.div>
              )}
              
              {approvalStatus === 'approved' && (
                <motion.div
                  key="approved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 flex flex-col items-center text-center space-y-4"
                >
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Booking Approved!</h3>
                  <p className="text-muted-foreground">
                    Great news! The owner has approved your booking request.
                  </p>
                  
                  <div className="w-full p-4 rounded-lg border bg-muted/20 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(bookingDate?.from!), 'MMM d')} - {format(new Date(bookingDate?.to!), 'MMM d, yyyy')}
                      </span>
                      <span>{days} {days === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee (7%)</span>
                      <span>${renterServiceFee.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-lg">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {showPayment ? (
                    <PayPalCheckoutButton 
                      amount={Math.round(total * 100)} // Convert to cents
                      listingId={listing.id}
                      startDate={bookingDate?.from ? format(bookingDate.from, 'yyyy-MM-dd') : ''}
                      endDate={bookingDate?.to ? format(bookingDate.to, 'yyyy-MM-dd') : ''}
                      onSuccess={onSuccessfulPayment}
                      onError={() => setShowPayment(false)}
                    />
                  ) : (
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium"
                      onClick={() => setShowPayment(true)}
                    >
                      Proceed to Payment
                    </Button>
                  )}
                </motion.div>
              )}
              
              {approvalStatus === 'rejected' && (
                <motion.div
                  key="rejected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 flex flex-col items-center text-center space-y-4"
                >
                  <div className="bg-red-100 p-3 rounded-full">
                    <XCircle className="h-12 w-12 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Booking Rejected</h3>
                  <p className="text-muted-foreground">
                    Unfortunately, the owner has rejected your booking request.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setRequestSent(false);
                      setApprovalStatus(null);
                      setBookingId(null);
                    }}
                    className="w-full"
                  >
                    Try Different Dates
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => navigate('/browse')}
                  >
                    Browse Other Listings
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
        )}
        
        {paymentError && (
          <Alert variant="destructive" className="animate-pulse">
            <AlertDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {paymentError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch bg-gradient-to-r from-primary/5 to-purple-500/5 p-6 pt-4">
          {!requestSent ? (
          <Button 
            size="lg" 
              className="w-full font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white" 
              onClick={submitBookingRequest}
            disabled={bookingLoading || !bookingDate?.from || !bookingDate?.to}
          >
            {bookingLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : null}
            {bookingDate?.from && bookingDate?.to ? 'Request to Book' : 'Select Dates'}
          </Button>
          ) : (
            approvalStatus === 'pending' && (
              <Button 
                variant="outline"
                size="lg"
                className="w-full font-medium"
                onClick={() => {
                  // Logic to cancel booking request if needed
                  // For now, we'll just reset the state
                  setRequestSent(false);
                  setApprovalStatus(null);
                  setBookingId(null);
                }}
              >
                Cancel Request
              </Button>
            )
        )}
      </CardFooter>
    </Card>
    </motion.div>
  );
};

interface OwnerCardProps {
  listing: Listing;
  user: any; // from useAuth
  handleContactOwner: () => void;
}

const OwnerCard = ({ listing, user, handleContactOwner }: OwnerCardProps) => {
    return (
        <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardDescription className="text-sm">Listing Owner</CardDescription>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20 ring-2 ring-background shadow-md">
                        <AvatarImage src={listing.owner_avatar_url} alt={listing.owner_name} />
                        <AvatarFallback>{listing.owner_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            {listing.owner_name}
                            {listing.owner_is_verified && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <ShieldCheck className="h-5 w-5 text-green-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Verified Owner</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Member since {format(new Date(listing.created_at), 'MMM yyyy')}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>Quick responses</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Reliable rentals</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                {user?.id !== listing.owner_id ? (
                    <Button 
                        onClick={handleContactOwner} 
                        className="w-full group relative overflow-hidden"
                        variant="default"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 group-hover:animate-shimmer" style={{ transform: 'translateX(-100%)' }}></span>
                        <MessageSquare className="mr-2 h-4 w-4" /> Contact Owner
                    </Button>
                ) : (
                    <div className="w-full p-2 bg-muted/50 rounded-md text-center text-sm text-muted-foreground">
                        This is your listing
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

interface AdminVerificationCardProps {
    listing: Listing;
    onVerify: (verify: boolean) => void;
    loading: boolean;
}

const AdminVerificationCard = ({ listing, onVerify, loading }: AdminVerificationCardProps) => {
    return (
        <Card className={cn(
            "border-2 shadow-lg overflow-hidden transition-all duration-300",
            listing.is_verified 
                ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
        )}>
            <CardHeader className={cn(
                "pb-3",
                listing.is_verified 
                    ? "bg-gradient-to-r from-green-100/50 to-green-200/30 dark:from-green-900/20 dark:to-green-800/10" 
                    : "bg-gradient-to-r from-amber-100/50 to-amber-200/30 dark:from-amber-900/20 dark:to-amber-800/10"
            )}>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <ShieldCheck className={cn(
                        listing.is_verified ? "text-green-600" : "text-amber-600"
                    )}/>
                    Admin Controls
                </CardTitle>
                <CardDescription>
                    Manage verification status for this listing
                </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                        "p-2 rounded-full",
                        listing.is_verified ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                    )}>
                        {listing.is_verified ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                            <ShieldAlert className="h-6 w-6 text-amber-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium">
                            {listing.is_verified ? "Verified Listing" : "Unverified Listing"}
                        </h3>
                        <p className={cn(
                            "text-sm",
                            listing.is_verified ? "text-green-600" : "text-amber-600"
                        )}>
                            {listing.is_verified 
                                ? "This listing is verified and featured" 
                                : "This listing is not verified"}
                        </p>
                    </div>
                </div>
                
                <Button
                    variant={listing.is_verified ? "outline" : "default"}
                    className={cn(
                        "w-full relative overflow-hidden group",
                        listing.is_verified 
                            ? "border-green-300 hover:border-red-300 hover:text-red-600" 
                            : "bg-green-600 hover:bg-green-700 text-white"
                    )}
                    onClick={() => onVerify(!listing.is_verified)}
                    disabled={loading}
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" style={{ transform: 'translateX(-100%)' }}></span>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    ) : (
                        listing.is_verified ? <XCircle className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4"/>
                    )}
                    {listing.is_verified ? 'Remove Verification' : 'Verify Listing'}
                </Button>
            </CardContent>
        </Card>
    )
};

export default ListingPage;