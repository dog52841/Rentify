import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Star, 
  Heart, 
  Shield, 
  Zap,
  ChevronUp,
  X,
  SlidersHorizontal,
  Sparkles,
  ImageIcon,
  Grid3X3,
  List,
  Eye,
  Clock,
  TrendingUp,
  Award,
  CheckCircle,
  FilterX,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RangeSlider } from '../components/ui/RangeSlider';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';

interface Listing {
    id: string;
    title: string;
  description: string;
  price_per_day: number;
  location: string;
  image_urls: string[];
    category: string;
    user_id: string;
  is_verified: boolean;
  created_at: string;
  average_rating?: number;
  review_count?: number;
  owner_name?: string;
  owner_avatar_url?: string;
    view_count?: number;
  is_featured?: boolean;
}

const Browse = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [minRating, setMinRating] = useState<number>(0);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
    const { user } = useAuth();
    const { toast } = useToast();
  const navigate = useNavigate();

  const categories = [
    { value: 'all', label: 'All Categories', icon: '🎯' },
    { value: 'electronics', label: 'Electronics', icon: '📱' },
    { value: 'tools', label: 'Tools & Equipment', icon: '🔧' },
    { value: 'sports', label: 'Sports & Recreation', icon: '⚽' },
    { value: 'furniture', label: 'Furniture', icon: '🪑' },
    { value: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { value: 'clothing', label: 'Clothing & Accessories', icon: '👕' },
    { value: 'books', label: 'Books & Media', icon: '📚' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: Clock },
    { value: 'price-asc', label: 'Price: Low to High', icon: TrendingUp },
    { value: 'price-desc', label: 'Price: High to Low', icon: TrendingUp },
    { value: 'rating-desc', label: 'Top Rated', icon: Star },
    { value: 'popular', label: 'Most Popular', icon: Eye }
  ];

  useEffect(() => {
    fetchListings();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

    useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      console.log('Initial load starting...');

      // Prepare filter params
      const categoryFilter = selectedCategory !== 'all' ? selectedCategory : null;
      const [minPrice, maxPrice] = priceRange;
      let sortColumn = 'created_at';
      let sortDirection = 'desc';
      if (sortBy === 'price-asc') {
        sortColumn = 'price_per_day';
        sortDirection = 'asc';
      } else if (sortBy === 'price-desc') {
        sortColumn = 'price_per_day';
        sortDirection = 'desc';
      } else if (sortBy === 'rating-desc') {
        sortColumn = 'average_rating';
        sortDirection = 'desc';
      } else if (sortBy === 'popular') {
        sortColumn = 'view_count';
        sortDirection = 'desc';
      }

      // Use the get_listings_paged RPC for advanced filtering
      const { data, error } = await supabase.rpc('get_listings_paged', {
        p_sort_column: sortColumn,
        p_sort_direction: sortDirection,
        p_limit: 50,
        p_offset: 0,
        p_search_term: searchTerm || null,
        p_category: categoryFilter,
        p_min_price: minPrice,
        p_max_price: maxPrice,
        p_min_rating: minRating,
        p_user_lon: null,
        p_user_lat: null,
        p_nearby_radius: null
      });

      if (error) throw error;

      // Map the data to the Listing type
      let listingsWithOwners = (data || []).map((listing: any) => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price_per_day: listing.price_per_day,
        location: listing.location_text || listing.location,
        image_urls: listing.image_urls || listing.images_urls || [],
        category: listing.category,
        user_id: listing.owner_id,
        is_verified: listing.is_verified || false,
        is_featured: listing.is_featured || false,
        created_at: listing.created_at,
        average_rating: listing.average_rating || 0,
        review_count: listing.review_count || 0,
        owner_name: listing.owner_name || '',
        owner_avatar_url: listing.owner_avatar_url || '',
        view_count: listing.view_count || 0
      }));
      // Sort featured listings to the top
      listingsWithOwners = [
        ...listingsWithOwners.filter(l => l.is_featured),
        ...listingsWithOwners.filter(l => !l.is_featured)
      ];
      setListings(listingsWithOwners);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error",
        description: "Failed to load listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
            
            try {
                const { data, error } = await supabase
                    .from('favorites')
                    .select('listing_id')
                    .eq('user_id', user.id);
                
      if (error) throw error;
      
      const favoriteIds = new Set(data?.map(fav => fav.listing_id) || []);
      setFavorites(favoriteIds);
    } catch (error) {
                    console.error('Error fetching favorites:', error);
    }
  };

  const handleToggleFavorite = async (listingId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to save listings.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newFavorites = new Set(favorites);
      
      if (newFavorites.has(listingId)) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, listing_id: listingId });
        
        newFavorites.delete(listingId);
        toast({ title: "Removed from favorites" });
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: listingId });
        
        newFavorites.add(listingId);
        toast({ title: "Added to favorites!" });
      }
      
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };

  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           listing.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
      
      const matchesPrice = listing.price_per_day >= priceRange[0] && listing.price_per_day <= priceRange[1];
      
      const matchesRating = listing.average_rating >= minRating;
      
      const matchesLocation = !locationFilter || listing.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesVerified = !showVerifiedOnly || listing.is_verified;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesLocation && matchesVerified;
    });

    // Sort listings
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price_per_day - b.price_per_day);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price_per_day - a.price_per_day);
        break;
      case 'rating-desc':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [listings, searchTerm, selectedCategory, priceRange, sortBy, minRating, locationFilter, showVerifiedOnly]);

  const clearAllFilters = () => {
        setSearchTerm('');
    setSelectedCategory('all');
        setPriceRange([0, 1000]);
        setMinRating(0);
    setLocationFilter('');
    setShowVerifiedOnly(false);
    setShowFeaturedOnly(false);
    setSortBy('newest');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ListingCard = ({ listing, isFeatured = false }: { listing: Listing; isFeatured?: boolean }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300
          border border-border/30 shadow-2xl hover:shadow-3xl hover:scale-[1.03] hover:-translate-y-1
          bg-gradient-to-br from-background/80 via-card/90 to-background/90
          rounded-2xl group/listing
          ${isFeatured ? 'ring-4 ring-amber-400/60 animate-pulse-slow' : ''}
        `}
        onClick={() => navigate(`/listings/${listing.id}`)}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
          <img
            src={listing.image_urls?.[0] || '/placeholder-image.jpg'}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/listing:scale-105"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {listing.is_featured && (
              <Badge className="bg-amber-400/90 text-white border-0 shadow-lg px-2 py-1 text-xs font-bold flex items-center gap-1 rounded-full animate-glow">
                <Zap className="w-3 h-3 mr-1 animate-spin-slow" />
                Featured
              </Badge>
            )}
            {listing.is_verified && (
              <Badge className="bg-emerald-600/90 text-white border-0 shadow-lg px-2 py-1 text-xs font-bold flex items-center gap-1 rounded-full">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/80 hover:bg-background/90 shadow-lg rounded-full p-2 border border-border/40 transition-all group-hover/listing:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(listing.id);
            }}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${favorites.has(listing.id) ? 'fill-red-500 text-red-500 drop-shadow' : 'text-muted-foreground group-hover/listing:text-primary'}`}
            />
          </Button>
        </div>
        <CardContent className="p-5 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover/listing:text-primary transition-colors flex items-center gap-2">
            {listing.title}
            {listing.is_featured && <span className="ml-2 text-amber-400 animate-glow">★</span>}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {listing.average_rating ? (
                <>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-foreground">{listing.average_rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({listing.review_count})</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">No reviews yet</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                ${listing.price_per_day}
              </div>
              <div className="text-xs text-muted-foreground">per day</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ListingListItem = ({ listing }: { listing: Listing }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="relative overflow-hidden cursor-pointer transition-all duration-300 border border-border/30 shadow-card hover:shadow-lg hover:scale-[1.01] bg-card/80 backdrop-blur-xl rounded-xl group/listing"
        onClick={() => navigate(`/listings/${listing.id}`)}
      >
        <div className="flex">
          <div className="relative w-48 h-32 overflow-hidden rounded-l-xl">
            <img
              src={listing.image_urls?.[0] || '/placeholder-image.jpg'}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/listing:scale-105"
            />
            <div className="absolute top-2 left-2 flex gap-1">
              {listing.is_verified && (
                <Badge className="bg-emerald-600/90 text-white border-0 shadow-lg px-2 py-1 text-xs font-bold flex items-center gap-1 rounded-full">
                  <Shield className="w-3 h-3" />
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background/90 shadow-lg rounded-full p-1 border border-border/40 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(listing.id);
              }}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${favorites.has(listing.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground group-hover/listing:text-primary'}`}
              />
            </Button>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/10 text-primary font-semibold px-2 py-1 rounded-lg text-xs">
                  {listing.category}
                </Badge>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{listing.location}</span>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover/listing:text-primary transition-colors">
                {listing.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {listing.description}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {listing.average_rating ? (
                    <>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{listing.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({listing.review_count})</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No reviews yet</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>{listing.view_count || 0} views</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">
                  ${listing.price_per_day}
                </div>
                <div className="text-xs text-muted-foreground">per day</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-48 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] animate-gradient-x text-foreground pt-24 transition-colors duration-300">
      {/* Sticky Search and Filter Bar */}
      <div className="sticky top-20 z-40 bg-card/80 backdrop-blur-lg border-b border-border shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <form onSubmit={e => { e.preventDefault(); fetchListings(); }} className="relative flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-muted/70 border border-border focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            </form>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted/70 rounded-xl p-1 border border-border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-lg"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-lg"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 rounded-xl bg-muted/70 border border-border focus:ring-2 focus:ring-primary/40 transition-all">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-card/90 shadow-xl">
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Button for mobile */}
            <Button
              variant="ghost"
              className="lg:hidden rounded-xl border border-border bg-muted/70 hover:bg-muted/90 transition-all"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="mr-2" size={18} /> Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full px-0">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-80 flex-shrink-0`}>
            <div className="sticky top-32 space-y-6">
              <Card className="p-8 bg-white/20 backdrop-blur-2xl border border-white/30 shadow-3xl rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Filter className="w-6 h-6" />
                    Filters
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    <FilterX className="w-5 h-5 mr-1" />
                    Clear All
                  </Button>
                </div>

                {/* Category Filter */}
                <div className="space-y-3">
                <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full rounded-xl bg-muted/70 border border-border focus:ring-2 focus:ring-primary/40 transition-all">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-card/90 shadow-xl">
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value} className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Price Range</label>
                  <div className="space-y-2">
                <RangeSlider
                      min={0} 
                      max={1000} 
                      step={10} 
                    value={priceRange}
                      onValueChange={setPriceRange} 
                      className="w-full" 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="space-y-3">
                <label className="text-sm font-medium">Minimum Rating</label>
                  <div className="space-y-2">
                    <RangeSlider 
                      min={0} 
                      max={5} 
                      step={0.5} 
                      value={[minRating]} 
                      onValueChange={(value) => setMinRating(value[0])} 
                      className="w-full" 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Any</span>
                      <span>{minRating}+ stars</span>
                    </div>
                  </div>
                </div>

                {/* Location Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    type="text"
                    placeholder="Enter location..."
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    className="rounded-xl bg-muted/70 border border-border focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>

                {/* Additional Filters */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Additional Filters</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showVerifiedOnly}
                        onChange={e => setShowVerifiedOnly(e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="text-sm">Verified listings only</span>
                    </label>
                  </div>
                </div>

                {/* Apply Filters Button */}
                <Button 
                  onClick={fetchListings}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 transition-all"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </Card>
            </div>
                        </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Browse Listings</h2>
                <p className="text-muted-foreground">
                  {filteredAndSortedListings.length} listing{filteredAndSortedListings.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="rounded-full">
                    {categories.find(c => c.value === selectedCategory)?.label}
                  </Badge>
                )}
                {showVerifiedOnly && (
                  <Badge variant="secondary" className="rounded-full">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Only
                  </Badge>
                )}
                {minRating > 0 && (
                  <Badge variant="secondary" className="rounded-full">
                    <Star className="w-3 h-3 mr-1" />
                    {minRating}+ Stars
                  </Badge>
                )}
              </div>
                                    </div>
                                    
            {/* Listings Grid/List */}
            {filteredAndSortedListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">No listings found</h2>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search term.</p>
                <Button onClick={clearAllFilters} className="rounded-xl">
                  <FilterX className="w-4 h-4 mr-2" />
                                                Clear All Filters
                                            </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                <AnimatePresence>
                  {filteredAndSortedListings.map(listing => (
                    viewMode === 'grid' ? (
                      <ListingCard key={listing.id} listing={listing} />
                    ) : (
                      <ListingListItem key={listing.id} listing={listing} />
                    )
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
                                            <Button 
          className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          size="icon"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <ChevronUp className="h-6 w-6" />
                                            </Button>
                            )}
            </div>
  );
};

export default Browse; 