import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Compass, X, Star, Heart, SlidersHorizontal, Package, RefreshCw, ShieldCheck, Filter, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Switch } from '../components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { RangeSlider } from '../components/ui/RangeSlider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Categories } from '../components/Categories';
const predefinedCategories = [
    "Electronics",
    "Vehicles",
    "Furniture",
    "Appliances",
    "Clothing",
    "Sports Equipment",
    "Tools",
    "Books",
    "Outdoor Gear",
    "Event Supplies",
    "Other"
];
const PAGE_SIZE = 8;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;
const ListingSkeleton = () => (_jsxs(Card, { className: "h-full border shadow-sm transform transition-all duration-300 overflow-hidden", children: [_jsx("div", { className: "aspect-video relative bg-muted", children: _jsx(Skeleton, { className: "h-full w-full" }) }), _jsxs(CardHeader, { className: "p-4 pb-2", children: [_jsx(Skeleton, { className: "h-6 w-3/4 mb-2" }), _jsx(Skeleton, { className: "h-4 w-1/2" })] }), _jsxs(CardContent, { className: "p-4 pt-0", children: [_jsx(Skeleton, { className: "h-4 w-full mb-2" }), _jsx(Skeleton, { className: "h-4 w-3/4" })] }), _jsxs(CardFooter, { className: "p-4 pt-0 flex items-center justify-between", children: [_jsx(Skeleton, { className: "h-6 w-16" }), _jsx(Skeleton, { className: "h-8 w-8 rounded-full" })] })] }));
const ListingCard = ({ listing }) => {
    const thumbnailUrl = listing.images_urls?.[0] || '/placeholder-image.jpg';
    const truncatedDescription = listing.location_text && listing.location_text.length > 120
        ? `${listing.location_text.substring(0, 120)}...`
        : listing.location_text;
    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: _jsxs(Card, { className: "h-full border shadow-sm hover:shadow-md transform transition-all duration-300 hover:-translate-y-1 overflow-hidden", children: [_jsxs("div", { className: "aspect-video relative bg-muted", children: [_jsx("img", { src: thumbnailUrl, alt: listing.title, className: "object-cover w-full h-full", onError: (e) => {
                                e.target.src = '/placeholder-image.jpg';
                            } }), _jsxs(Badge, { className: "absolute top-2 right-2 bg-primary/90 hover:bg-primary", children: ["$", listing.price_per_day, "/day"] })] }), _jsxs(CardHeader, { className: "p-4 pb-2", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { className: "text-lg font-semibold line-clamp-1", children: listing.title }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-primary", children: _jsx(Heart, { size: 18 }) })] }), _jsx(CardDescription, { className: "flex items-center gap-1", children: _jsx("span", { children: listing.location_text }) })] }), _jsxs(CardContent, { className: "p-4 pt-0", children: [_jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: truncatedDescription }), listing.average_rating && (_jsxs("div", { className: "flex items-center mt-2 text-sm", children: [_jsx(Star, { className: "h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" }), _jsx("span", { className: "font-medium", children: listing.average_rating.toFixed(1) }), listing.review_count && (_jsxs("span", { className: "text-muted-foreground ml-1", children: ["(", listing.review_count, ")"] }))] }))] }), _jsx(CardFooter, { className: "p-4 pt-0 flex items-center justify-between", children: _jsx(Button, { asChild: true, variant: "default", className: "w-full", children: _jsx(Link, { to: `/listings/${listing.id}`, children: "View Details" }) }) })] }) }));
};
const ErrorMessage = ({ message, onRetry }) => (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "flex flex-col items-center justify-center p-8 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 w-full my-8", children: [_jsx(AlertCircle, { className: "h-10 w-10 text-red-500 mb-4" }), _jsx("h3", { className: "text-lg font-medium text-red-800 dark:text-red-300 mb-2", children: "Unable to load listings" }), _jsx("p", { className: "text-red-600 dark:text-red-400 mb-4 text-center max-w-md", children: message }), _jsxs(Button, { onClick: onRetry, variant: "outline", className: "gap-2", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "Retry"] })] }));
const Browse = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const [favorites, setFavorites] = useState([]);
    // State for fetched data
    const [listings, setListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [sortBy, setSortBy] = useState('created_at-desc');
    const [nearbyOnly, setNearbyOnly] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [minRating, setMinRating] = useState(0);
    const initialLoadComplete = useRef(false);
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) {
                setFavorites([]);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('favorites')
                    .select('listing_id')
                    .eq('user_id', user.id);
                if (error) {
                    console.error('Error fetching favorites:', error);
                    return;
                }
                if (data) {
                    setFavorites(data.map(fav => fav.listing_id));
                }
            }
            catch (err) {
                console.error('Exception in fetchFavorites:', err);
            }
        };
        fetchFavorites();
    }, [user]);
    const fetchListings = async (reset = false, retry = false) => {
        if (reset) {
            setPage(1);
            setListings([]);
            setFilteredListings([]);
            setHasMore(true);
        }
        if (retry) {
            setIsRetrying(true);
        }
        setLoading(true);
        setError(null);
        try {
            const [sortColumn, sortDirection] = sortBy.split('-');
            const { data: listingsData, error: listingsError } = await supabase.rpc('get_listings_paged', {
                p_sort_column: sortColumn,
                p_sort_direction: sortDirection,
                p_limit: PAGE_SIZE,
                p_offset: reset ? 0 : (page - 1) * PAGE_SIZE,
                p_search_term: searchTerm || null,
                p_category: (!selectedCategory || selectedCategory === 'all-categories') ? null : selectedCategory,
                p_min_price: priceRange[0] > 0 ? priceRange[0] : null,
                p_max_price: priceRange[1] < 1000 ? priceRange[1] : null,
                p_min_rating: minRating > 0 ? minRating : null,
                p_user_lon: nearbyOnly && userLocation ? userLocation.lon : null,
                p_user_lat: nearbyOnly && userLocation ? userLocation.lat : null,
                p_nearby_radius: nearbyOnly && userLocation ? 50000 : null,
            });
            if (listingsError) {
                throw listingsError;
            }
            if (Array.isArray(listingsData)) {
                const newListings = reset ? listingsData : [...listings, ...listingsData];
                setListings(newListings);
                applyFilters(newListings, searchTerm, selectedCategory || null);
                if (!reset) {
                    setPage(prev => prev + 1);
                }
                setHasMore(listingsData.length === PAGE_SIZE);
            }
            else {
                console.error("Unexpected response format from get_listings_paged:", listingsData);
                setListings([]);
                setFilteredListings([]);
            }
            setRetryCount(0);
            initialLoadComplete.current = true;
        }
        catch (err) {
            console.error('Exception fetching listings:', err);
            const errorMessage = err instanceof Error
                ? err.message
                : 'An unexpected error occurred. Please try again.';
            if (retryCount < MAX_RETRIES) {
                console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}...`);
                const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    fetchListings(reset);
                }, delay);
            }
            else {
                setError(errorMessage);
            }
        }
        finally {
            setLoading(false);
            setIsRetrying(false);
        }
    };
    const applyFilters = (listingsToFilter, search, category) => {
        let filtered = [...listingsToFilter];
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(listing => listing.title.toLowerCase().includes(searchLower) ||
                (listing.location_text && listing.location_text.toLowerCase().includes(searchLower)));
        }
        if (category) {
            filtered = filtered.filter(listing => listing.category === category);
        }
        setFilteredListings(filtered);
    };
    const handleSearch = (term) => {
        setSearchTerm(term);
        applyFilters(listings, term, selectedCategory || null);
    };
    const handleCategorySelect = (category) => {
        setSelectedCategory(category || '');
        applyFilters(listings, searchTerm, category);
    };
    const loadMore = () => {
        if (!loading && hasMore) {
            fetchListings();
        }
    };
    const handleManualRetry = () => {
        setRetryCount(0);
        fetchListings(true, true);
    };
    useEffect(() => {
        if (!initialLoadComplete.current) {
            fetchListings(true);
        }
    }, []);
    const handleToggleFavorite = async (listingId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Please log in',
                description: 'You need to be logged in to save listings.'
            });
            return;
        }
        const isFavorited = favorites.includes(listingId);
        let newFavorites;
        if (isFavorited) {
            newFavorites = favorites.filter(id => id !== listingId);
            setFavorites(newFavorites); // Optimistic update
            const { error } = await supabase.from('favorites').delete().match({ user_id: user.id, listing_id: listingId });
            if (error) {
                setFavorites(favorites); // Revert on error
                toast({ variant: 'destructive', title: 'Error removing from favorites.' });
            }
        }
        else {
            newFavorites = [...favorites, listingId];
            setFavorites(newFavorites); // Optimistic update
            const { error } = await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
            if (error) {
                setFavorites(favorites); // Revert on error
                toast({ variant: 'destructive', title: 'Error adding to favorites.' });
            }
        }
    };
    const handleNearbyToggle = (checked) => {
        setNearbyOnly(checked);
        if (checked) {
            setLocationError(null);
            setLoading(true); // Show loading while we get location
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
                setLoading(false);
            }, (error) => {
                setLocationError("Could not get your location. Please enable location services in your browser.");
                setNearbyOnly(false); // Toggle back off
                setLoading(false);
            });
        }
        else {
            setUserLocation(null);
            setLocationError(null);
        }
    };
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setPriceRange([0, 1000]);
        setSortBy('created_at-desc');
        setNearbyOnly(false);
        setMinRating(0);
        setSearchParams({});
    };
    const FilterSidebar = () => (_jsxs("aside", { className: "lg:sticky top-24 h-fit space-y-6 p-6 bg-card/80 backdrop-blur-lg rounded-2xl border border-border/20 shadow-xl", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h3", { className: "text-xl font-semibold flex items-center gap-2", children: [_jsx(SlidersHorizontal, { className: "w-5 h-5" }), "Filters"] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: clearFilters, className: "text-xs", children: "Clear All" })] }), _jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children: _jsxs("form", { onSubmit: (e) => { e.preventDefault(); fetchListings(); }, className: "relative", children: [_jsx(Input, { placeholder: "Search listings...", value: searchTerm, onChange: (e) => handleSearch(e.target.value), className: "pl-9 bg-background/50" }), _jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" })] }) }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: [_jsx("label", { className: "text-sm font-medium", children: "Category" }), _jsxs(Select, { value: selectedCategory, onValueChange: (value) => handleCategorySelect(value === "all-categories" ? null : value), children: [_jsx(SelectTrigger, { className: "w-full mt-1 bg-background/50", children: _jsx(SelectValue, { placeholder: "Select a category" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all-categories", children: "All Categories" }), predefinedCategories.map(cat => _jsx(SelectItem, { value: cat, children: cat }, cat))] })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, children: [_jsx("label", { className: "text-sm font-medium", children: "Price Range" }), _jsxs("div", { className: "flex justify-between items-center mt-1 text-xs text-muted-foreground", children: [_jsxs("span", { children: ["$", priceRange[0]] }), _jsxs("span", { children: ["$", priceRange[1], priceRange[1] === 1000 ? '+' : ''] })] }), _jsx(RangeSlider, { className: "mt-2", min: 0, max: 1000, step: 10, value: priceRange, onValueChange: (newRange) => setPriceRange(newRange) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 }, children: [_jsx("label", { className: "text-sm font-medium", children: "Minimum Rating" }), _jsx("div", { className: "flex justify-center items-center mt-2 space-x-1", children: [1, 2, 3, 4, 5].map(star => (_jsx(Star, { onClick: () => setMinRating(star === minRating ? 0 : star), className: cn('w-7 h-7 cursor-pointer transition-all', minRating >= star ? 'text-primary fill-current' : 'text-muted-foreground/50 hover:text-primary/70') }, star))) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5 }, className: "pt-4 border-t border-border/20", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("label", { htmlFor: "nearby", className: "flex items-center gap-2 text-sm font-medium", children: [_jsx(Compass, { className: "w-4 h-4" }), " Search Nearby"] }), _jsx(Switch, { id: "nearby", checked: nearbyOnly, onCheckedChange: handleNearbyToggle })] }), locationError && _jsx("p", { className: "text-xs text-destructive mt-2", children: locationError })] })] }));
    return (_jsx(AnimatedSection, { children: _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs(motion.div, { className: "text-center mb-12", initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsx("h1", { className: "text-5xl font-bold tracking-tight", children: "Browse Rentals" }), _jsx("p", { className: "text-muted-foreground mt-2 max-w-2xl mx-auto", children: "Discover the perfect item to rent from our huge selection of local listings." })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-8", children: [_jsx(FilterSidebar, {}), _jsxs("main", { className: "lg:col-span-3", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: loading ? 'Searching...' : `Showing ${listings.length} results` }), _jsxs(Select, { value: sortBy, onValueChange: setSortBy, children: [_jsx(SelectTrigger, { className: "w-[180px] bg-card/80 backdrop-blur-lg", children: _jsx(SelectValue, { placeholder: "Sort by..." }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "created_at-desc", children: "Newest" }), _jsx(SelectItem, { value: "price_per_day-asc", children: "Price: Low to High" }), _jsx(SelectItem, { value: "price_per_day-desc", children: "Price: High to Low" }), _jsx(SelectItem, { value: "average_rating-desc", children: "Highest Rated" })] })] })] }), _jsx(AnimatePresence, { children: error ? (_jsx(ErrorMessage, { message: error, onRetry: handleManualRetry })) : (_jsxs(_Fragment, { children: [_jsx(Categories, { selected: selectedCategory || null, onSelect: handleCategorySelect }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6", children: [(filteredListings.length > 0 ? filteredListings : listings).map(listing => (_jsx(ListingCard, { listing: listing }, listing.id))), loading && (!isRetrying || listings.length === 0) && (_jsx(_Fragment, { children: Array.from({ length: PAGE_SIZE }).map((_, index) => (_jsx(ListingSkeleton, {}, `skeleton-${index}`))) }))] }), !loading && filteredListings.length === 0 && listings.length === 0 && (_jsxs("div", { className: "text-center p-12 border rounded-lg bg-muted/30 my-8", children: [_jsx("h3", { className: "text-xl font-medium mb-2", children: "No listings found" }), _jsx("p", { className: "text-muted-foreground mb-4", children: selectedCategory
                                                            ? `No items available in the ${selectedCategory} category.`
                                                            : searchTerm
                                                                ? `No results for "${searchTerm}".`
                                                                : "There are no listings available at the moment." }), _jsx(Button, { onClick: () => {
                                                            setSearchTerm('');
                                                            setSelectedCategory('');
                                                            fetchListings(true);
                                                        }, variant: "outline", children: "Clear filters" })] })), !loading && filteredListings.length === 0 && listings.length > 0 && (_jsxs("div", { className: "text-center p-12 border rounded-lg bg-muted/30 my-8", children: [_jsx("h3", { className: "text-xl font-medium mb-2", children: "No matches found" }), _jsx("p", { className: "text-muted-foreground mb-4", children: selectedCategory
                                                            ? `No items matching "${searchTerm}" in the ${selectedCategory} category.`
                                                            : `No results matching "${searchTerm}".` }), _jsx(Button, { onClick: () => {
                                                            setSearchTerm('');
                                                            setSelectedCategory('');
                                                            applyFilters(listings, '', null);
                                                        }, variant: "outline", children: "Clear filters" })] })), hasMore && filteredListings.length > 0 && (_jsx("div", { className: "flex justify-center mt-8", children: _jsxs(Button, { onClick: loadMore, disabled: loading, variant: "outline", className: "gap-2", children: [loading && _jsx(RefreshCw, { className: "h-4 w-4 animate-spin" }), loading ? 'Loading...' : 'Load More'] }) }))] })) })] })] })] }) }));
};
export default Browse;
