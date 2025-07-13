import { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, CalendarCheck, Handshake, Search, Star, MapPin, Heart, Sparkles, CheckCircle, Laptop, Bike, Home as HomeIcon, Car, Wrench, PartyPopper, Shirt, Drone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { AnimatedGradient } from '../components/ui/AnimatedGradient';

type Listing = {
  id: number;
  images_urls: string[];
  title: string;
  category: string;
  price_per_day: number;
  owner_id: string;
  location_text?: string;
  average_rating: number;
  review_count: number;
  is_verified: boolean;
  image_urls: string[];
};

const Home = () => {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<number[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Try to get featured listings using the RPC
        let { data: listingsData, error: listingsError } = await supabase.rpc('get_featured_listings', { p_limit: 4, p_offset: 0 });

        // If no featured listings, fallback to most recent approved listings
        if (!listingsData || listingsData.length === 0) {
          const fallback = await supabase.rpc('get_listings_paged', {
            p_sort_column: 'created_at',
            p_sort_direction: 'desc',
            p_limit: 4,
            p_offset: 0
          });
          listingsData = fallback.data;
        }

        if (listingsError) throw listingsError;

        // Process listings to handle image fields and calculate ratings
        const processedListings = (listingsData || []).map((listing) => {
          const images = listing.image_urls || listing.images_urls || [];
          return {
            id: listing.id,
            title: listing.title,
            category: listing.category || 'Other',
            price_per_day: listing.price_per_day,
            user_id: listing.owner_id,
            image_urls: images,
            average_rating: listing.average_rating || 0,
            review_count: listing.review_count || 0,
            location_text: listing.location_text || listing.location,
            owner_id: listing.owner_id,
            is_verified: listing.is_verified || false
          };
        });

        setFeaturedListings(processedListings);

        if (user) {
          const { data: favData, error: favError } = await supabase
            .from('favorites')
            .select('listing_id')
            .eq('user_id', user.id);
          if (favError) throw favError;
          setFavorites(favData.map(fav => fav.listing_id));
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load listings.', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user, toast]);

  const handleToggleFavorite = async (listingId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to save listings.' });
      return;
    }

    const isFavorited = favorites.includes(listingId);
    if (isFavorited) {
      setFavorites(prev => prev.filter(id => id !== listingId));
      const { error } = await supabase.from('favorites').delete().match({ user_id: user.id, listing_id: listingId });
      if (error) {
        setFavorites(prev => [...prev, listingId]); // Revert
        toast({ variant: 'destructive', title: 'Error removing from favorites.' });
      } else {
        toast({ title: "Removed from favorites." });
      }
    } else {
      setFavorites(prev => [...prev, listingId]);
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
      if (error) {
        setFavorites(prev => prev.filter(id => id !== listingId)); // Revert
        toast({ variant: 'destructive', title: 'Error adding to favorites.' });
      } else {
        toast({ title: "Added to favorites!" });
      }
    }
  };
  
  const categories = [
    { name: 'Electronics', icon: Laptop, link: '/browse?category=Electronics' },
    { name: 'Sports & Outdoors', icon: Bike, link: '/browse?category=Sports+%26+Outdoors' },
    { name: 'Home & Garden', icon: HomeIcon, link: '/browse?category=Home+%26+Garden' },
    { name: 'Vehicles', icon: Car, link: '/browse?category=Vehicles' },
    { name: 'Tools & Equipment', icon: Wrench, link: '/browse?category=Tools+%26+Equipment' },
    { name: 'Events & Parties', icon: PartyPopper, link: '/browse?category=Events+%26+Parties' },
    { name: 'Fashion', icon: Shirt, link: '/browse?category=Fashion'},
    { name: 'Drones', icon: Drone, link: '/browse?category=Drones'}
  ];
  
  const features = [
    { icon: Search, title: "Find Anything", description: "From professional drones to party supplies, find exactly what you need from trusted locals." },
    { icon: CalendarCheck, title: "Book Instantly", description: "Check availability and book your rental for the perfect time, all in a few clicks." },
    { icon: Handshake, title: "Rent with Confidence", description: "Coordinate directly with owners and enjoy a secure rental experience from start to finish." },
  ];

  const SkeletonCard = () => (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/50">
        <div className="aspect-square w-full bg-muted/50 animate-pulse"></div>
        <div className="p-4 space-y-3">
            <div className="h-4 w-1/3 bg-muted/50 rounded animate-pulse"></div>
            <div className="h-6 w-full bg-muted/50 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse"></div>
        </div>
    </div>
  );

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32">
        <AnimatedGradient />
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, staggerChildren: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight">
              Don't Buy It. <span className="text-primary">Just Rent It.</span>
            </motion.h1>
            <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Access thousands of items from people nearby. Save money, reduce waste, and live more by owning less.
            </motion.p>
            <motion.form variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row items-center max-w-lg mx-auto gap-3">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for drones, cameras, party supplies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 h-14 rounded-full text-lg border-2 border-border/50 focus-visible:ring-primary/50"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-full w-full sm:w-auto h-14 text-lg font-semibold">
                Search
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map(cat => (
            <Link to={cat.link} key={cat.name} className="group flex flex-col items-center justify-center bg-card/80 border border-border/30 rounded-xl p-4 hover:bg-primary/10 transition-all shadow-card hover:shadow-lg">
              <cat.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform mb-2" />
              <span className="font-medium text-foreground text-sm text-center group-hover:text-primary transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <AnimatedSection className="bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight">A seamless, secure experience.</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Renting on Rentify is simple and safe. Here's how it works.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i} 
                className="flex flex-col items-center text-center p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true, amount: 0.5 }}
              >
                <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-primary/10 text-primary">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Featured Listings */}
      <AnimatedSection className="container mx-auto px-4 py-16 sm:py-24">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight flex items-center gap-3"><Sparkles className="h-8 w-8 text-primary"/>Featured Rentals</h2>
          <Button asChild variant="ghost">
            <Link to="/browse">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredListings.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    <Link to={`/listings/${listing.id}`} className="group block bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 ease-in-out">
                        <div className="aspect-square w-full overflow-hidden relative">
                          <img src={listing.image_urls?.[0] || 'https://placehold.co/600x400'} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"/>
                          {/* Instantly Available Badge */}
                          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-4 w-4"/> Instantly Available
                          </div>
                          {listing.is_verified && (
                            <div className="absolute top-3 right-12 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                              <ShieldCheck className="h-4 w-4"/> Verified
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-background/70 backdrop-blur-sm" onClick={(e) => handleToggleFavorite(listing.id, e)}>
                                <Heart className={favorites.includes(listing.id) ? "h-5 w-5 text-red-500 fill-current" : "h-5 w-5"}/>
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-muted-foreground">{listing.category}</p>
                            <h3 className="font-semibold text-lg text-foreground truncate mt-1">{listing.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center mt-2 gap-1.5"><MapPin className="h-4 w-4" /> {listing.location_text || "Worldwide"}</p>
                            <div className="flex items-center mt-2">
                                <Star className="h-4 w-4 text-primary fill-current" />
                                <span className="text-sm font-bold ml-1">{listing.average_rating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground ml-1.5">({listing.review_count} reviews)</span>
                            </div>
                            <p className="font-bold text-lg text-foreground mt-4">${listing.price_per_day}<span className="font-normal text-sm text-muted-foreground">/day</span></p>
                        </div>
                    </Link>
                  </motion.div>
                ))}
            </div>
        )}
      </AnimatedSection>

      {/* Final CTA */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
            <div className="bg-primary/10 rounded-2xl p-8 sm:p-16 border border-primary/20">
              <h2 className="text-4xl font-bold tracking-tight">Ready to start renting?</h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Have something you're not using? Earn extra cash by listing it on Rentify. It's free and takes just a few minutes.</p>
              <div className="mt-8 flex justify-center gap-4">
                <Button asChild size="lg" className="rounded-full text-lg">
                  <Link to="/list-item">List an Item</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full text-lg">
                  <Link to="/browse">Browse Items</Link>
                </Button>
              </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 