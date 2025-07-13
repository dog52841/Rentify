import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Loader2, MapPin, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

type WishlistItem = {
    listing_id: string;
    listing: {
        id: string;
        image_urls: string[];
        price_per_day: number;
        category: string;
        title: string;
        location_text: string;
        user_reviews: { rating: number }[];
    };
};

const WishlistPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getAverageRating = (reviews: {rating: number}[]) => {
        if (!reviews || reviews.length === 0) return 0;
        return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    };

    const fetchWishlist = async () => {
        if (!user) {
            setError("Please log in to see your wishlist.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    listing_id,
                    listings!inner (
                        id,
                        image_urls,
                        price_per_day,
                        category,
                        title,
                        location_text,
                        user_reviews (rating)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            setWishlistItems(data?.map(item => ({
                listing_id: item.listing_id,
                listing: item.listings
            })) || []);

        } catch(err: any) {
            setError(err.message || "Failed to fetch wishlist.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, [user]);

    const handleRemoveFromWishlist = async (listingId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const previousWishlist = wishlistItems;
        setWishlistItems(current => current.filter(item => item.listing?.id !== listingId));
        
        const { error } = await supabase.from('favorites').delete().match({ user_id: user?.id, listing_id: listingId });

        if(error) {
            setWishlistItems(previousWishlist);
            toast({
                variant: 'destructive',
                title: 'Error removing item',
                description: 'Could not remove the item from your wishlist. Please try again.'
            });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
    }

    if (error) {
        return <div className="text-center py-20 text-destructive">{error}</div>
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-12">
                    <h1 className="text-4xl font-bold">My Wishlist</h1>
                    <p className="text-muted-foreground mt-1">Items you've saved for later.</p>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-lg">
                        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Your wishlist is empty.</h3>
                        <p className="text-muted-foreground mb-6">Browse items and click the heart icon to save them for later.</p>
                        <Link to="/browse">
                            <Button>Start Browsing</Button>
                        </Link>
                    </div>
                ) : (
                    <motion.div 
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                    >
                        {wishlistItems.map(({ listing }) => {
                            if (!listing) return null;
                            const listingData = listing;
                            const averageRating = getAverageRating(listingData.user_reviews);
                            return (
                                <motion.div 
                                    key={listingData.id}
                                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                >
                                    <Link
                                        to={`/listings/${listingData.id}`}
                                        className="group bg-card rounded-xl overflow-hidden border transition-all duration-300 h-full flex flex-col hover:shadow-xl relative"
                                    >
                                        <button 
                                            onClick={(e) => handleRemoveFromWishlist(listingData.id, e)} 
                                            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/60 backdrop-blur-sm hover:bg-destructive/20 text-destructive transition-all"
                                            aria-label="Remove from wishlist"
                                        >
                                            <Heart className="h-5 w-5 fill-current" />
                                        </button>
                                        <div className="aspect-video w-full overflow-hidden relative">
                                            <img 
                                                src={listingData.image_urls?.[0] || 'https://placehold.co/600x400/e2e8f0/e2e8f0'} 
                                                alt={listingData.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                                <p>
                                                <span className="font-bold text-xl text-white">${listingData.price_per_day}</span>
                                                <span className="text-white/80 text-sm">/day</span>
                                                </p>
                                                <Button variant="secondary" size="sm" className="h-8">View</Button>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-1 flex-grow flex flex-col">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-sm text-primary font-semibold">{listingData.category}</span>
                                                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">{listingData.title}</h3>
                                                </div>
                                                {averageRating > 0 && (
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                                        <span className="text-sm font-bold">{averageRating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow"></div>
                                            <div className="flex items-center text-sm text-muted-foreground pt-1">
                                                <MapPin className="h-4 w-4 mr-1.5" /> <span>{listingData.location_text || "Location not available"}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default WishlistPage; 