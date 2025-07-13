import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Loader2, RefreshCw, Star, Trash2, Filter, Search, FileBarChart2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';
import StarRating from '../ui/StarRating';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '../ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Skeleton } from '../ui/skeleton';
export const ReviewsManagementTab = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const { toast } = useToast();
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_reviews_admin');
            if (error) {
                throw error;
            }
            setReviews(data || []);
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch reviews',
                description: error.message,
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteReview = async () => {
        if (!reviewToDelete)
            return;
        try {
            const { error } = await supabase.from('reviews').delete().eq('id', reviewToDelete.id);
            if (error) {
                throw error;
            }
            setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
            toast({
                title: 'Review deleted successfully',
                variant: 'default',
            });
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error deleting review',
                description: error.message
            });
        }
        finally {
            setReviewToDelete(null);
        }
    };
    useEffect(() => {
        fetchReviews();
    }, []);
    // Calculate review statistics
    const stats = useMemo(() => {
        if (reviews.length === 0)
            return { average: 0, distribution: [0, 0, 0, 0, 0] };
        const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
        const average = totalRating / reviews.length;
        const distribution = [0, 0, 0, 0, 0];
        reviews.forEach(review => {
            distribution[review.rating - 1]++;
        });
        return { average, distribution };
    }, [reviews]);
    // Apply filters and sorting with useMemo for performance
    const filteredReviews = useMemo(() => {
        // Apply filters
        let result = [...reviews];
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(review => review.reviewer_name.toLowerCase().includes(query) ||
                review.listing_title.toLowerCase().includes(query) ||
                review.comment.toLowerCase().includes(query));
        }
        // Rating filter
        if (ratingFilter !== 'all') {
            const ratingValue = parseInt(ratingFilter);
            result = result.filter(review => review.rating === ratingValue);
        }
        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'highest':
                    return b.rating - a.rating;
                case 'lowest':
                    return a.rating - b.rating;
                default:
                    return 0;
            }
        });
        return result;
    }, [searchQuery, ratingFilter, reviews, sortBy]);
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        },
        exit: {
            opacity: 0,
            y: -10,
            transition: {
                duration: 0.2
            }
        }
    };
    // Loading skeleton
    if (loading) {
        return (_jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20 overflow-hidden", children: [_jsx(CardHeader, { className: "flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent", children: _jsxs("div", { children: [_jsx(Skeleton, { className: "h-7 w-48" }), _jsx(Skeleton, { className: "h-5 w-72 mt-1" })] }) }), _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "mb-6 flex flex-col sm:flex-row gap-4 items-end", children: [_jsx(Skeleton, { className: "h-10 w-full sm:w-64" }), _jsx(Skeleton, { className: "h-10 w-[180px]" })] }), _jsxs("div", { className: "rounded-md border overflow-hidden", children: [_jsx("div", { className: "bg-muted/50 p-3", children: _jsx(Skeleton, { className: "h-6 w-full" }) }), [1, 2, 3, 4, 5].map(i => (_jsxs("div", { className: "p-4 border-b flex items-center justify-between", children: [_jsx(Skeleton, { className: "h-8 w-8 rounded-full" }), _jsx(Skeleton, { className: "h-4 w-32" }), _jsx(Skeleton, { className: "h-4 w-24" }), _jsx(Skeleton, { className: "h-4 w-48" }), _jsx(Skeleton, { className: "h-4 w-20" }), _jsx(Skeleton, { className: "h-8 w-8 rounded-full" })] }, i)))] })] })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "space-y-6", children: [_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4, delay: 0.2 }, children: _jsxs(Card, { className: "bg-gradient-to-br from-primary/5 to-background border-border/10 shadow-lg", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-primary", children: [_jsx(FileBarChart2, { className: "h-5 w-5" }), _jsx("span", { children: "Review Statistics" })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "flex flex-col items-center justify-center space-y-2", children: [_jsx("span", { className: "text-muted-foreground text-sm", children: "Average Rating" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Star, { className: "h-6 w-6 fill-primary text-primary" }), _jsx("span", { className: "text-3xl font-bold", children: stats.average.toFixed(1) })] }), _jsx(StarRating, { rating: stats.average, size: 20, className: "gap-1" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("span", { className: "text-muted-foreground text-sm mb-2 block", children: "Rating Distribution" }), _jsx("div", { className: "space-y-2", children: [5, 4, 3, 2, 1].map((rating) => {
                                                            const count = stats.distribution[rating - 1];
                                                            const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
                                                            return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-1 w-16", children: [_jsx("span", { className: "font-medium", children: rating }), _jsx(Star, { className: "h-4 w-4 fill-primary text-primary" })] }), _jsx("div", { className: "w-full bg-muted rounded-full h-2 overflow-hidden", children: _jsx(motion.div, { className: "h-full bg-primary", initial: { width: 0 }, animate: { width: `${percentage}%` }, transition: { duration: 1, delay: 0.3 + (5 - rating) * 0.1 } }) }), _jsxs("span", { className: "text-xs text-muted-foreground w-12", children: [count, " (", percentage.toFixed(0), "%)"] })] }, rating));
                                                        }) })] })] }) })] }) }), _jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20 overflow-hidden", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-primary", children: [_jsx(ShieldAlert, { className: "h-5 w-5" }), _jsx("span", { children: "Reviews Management" })] }), _jsx(CardDescription, { children: "View and moderate all reviews on the platform." })] }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { onClick: fetchReviews, variant: "ghost", size: "icon", disabled: loading, className: "rounded-full hover:bg-primary/20", children: _jsx(RefreshCw, { className: `h-4 w-4 ${loading ? 'animate-spin' : ''}` }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Refresh reviews" }) })] }) })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "mb-6 flex flex-col sm:flex-row gap-4 items-end flex-wrap", children: [_jsxs("div", { className: "relative w-full sm:w-64", children: [_jsx(Search, { className: "absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search reviews...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-8 bg-background/50 border-border/50 focus:border-primary/50" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "h-4 w-4 text-muted-foreground" }), _jsxs(Select, { value: ratingFilter, onValueChange: setRatingFilter, children: [_jsx(SelectTrigger, { className: "w-[180px] bg-background/50 border-border/50", children: _jsx(SelectValue, { placeholder: "Filter by rating" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All ratings" }), _jsx(SelectItem, { value: "5", children: "5 stars" }), _jsx(SelectItem, { value: "4", children: "4 stars" }), _jsx(SelectItem, { value: "3", children: "3 stars" }), _jsx(SelectItem, { value: "2", children: "2 stars" }), _jsx(SelectItem, { value: "1", children: "1 star" })] })] })] }), _jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Sort by:" }), _jsxs(Select, { value: sortBy, onValueChange: (value) => setSortBy(value), children: [_jsx(SelectTrigger, { className: "w-[150px] bg-background/50 border-border/50", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "newest", children: "Newest first" }), _jsx(SelectItem, { value: "oldest", children: "Oldest first" }), _jsx(SelectItem, { value: "highest", children: "Highest rated" }), _jsx(SelectItem, { value: "lowest", children: "Lowest rated" })] })] }), _jsxs(Badge, { variant: "outline", className: "bg-background/50 ml-2", children: [filteredReviews.length, " ", filteredReviews.length === 1 ? 'review' : 'reviews'] })] })] }), filteredReviews.length === 0 ? (_jsxs(motion.div, { className: "text-center py-16 px-4 rounded-lg border-2 border-dashed border-muted", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 }, children: [_jsx(Star, { className: "mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" }), _jsx("h3", { className: "text-xl font-medium mb-1", children: "No reviews found" }), _jsx("p", { className: "text-muted-foreground", children: searchQuery || ratingFilter !== 'all'
                                                    ? 'Try adjusting your filters to see more results.'
                                                    : 'No reviews have been submitted yet.' })] })) : (_jsx(motion.div, { className: "rounded-md border overflow-hidden", variants: containerVariants, initial: "hidden", animate: "visible", children: _jsxs(Table, { children: [_jsx(TableHeader, { className: "bg-muted/50", children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Reviewer" }), _jsx(TableHead, { children: "Listing" }), _jsx(TableHead, { children: "Rating" }), _jsx(TableHead, { children: "Comment" }), _jsx(TableHead, { children: "Time" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: _jsx(AnimatePresence, { mode: "popLayout", children: filteredReviews.map((review) => (_jsxs(motion.tr, { layout: true, initial: "hidden", animate: "visible", exit: "exit", variants: itemVariants, className: "group border-b last:border-0 hover:bg-muted/30 transition-colors", children: [_jsx(TableCell, { className: "font-medium", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Avatar, { className: "h-8 w-8 border border-border/50 ring-2 ring-background", children: [_jsx(AvatarImage, { src: review.reviewer_avatar }), _jsx(AvatarFallback, { className: "bg-primary/10 text-primary", children: review.reviewer_name.substring(0, 2).toUpperCase() })] }), _jsx("span", { children: review.reviewer_name })] }) }), _jsx(TableCell, { className: "max-w-[200px] truncate font-medium text-muted-foreground", children: _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { className: "cursor-default", children: review.listing_title }), _jsx(TooltipContent, { children: _jsx("p", { children: review.listing_title }) })] }) }) }), _jsx(TableCell, { children: _jsx(StarRating, { rating: review.rating, size: 16, className: "gap-0.5" }) }), _jsx(TableCell, { className: "max-w-[300px]", children: _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { className: "cursor-default", children: _jsx("p", { className: "truncate text-sm", children: review.comment }) }), _jsx(TooltipContent, { className: "max-w-sm", children: _jsx("p", { children: review.comment }) })] }) }) }), _jsx(TableCell, { className: "text-sm text-muted-foreground", children: _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { className: "cursor-default", children: formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) }), _jsx(TooltipContent, { children: _jsx("p", { children: new Date(review.created_at).toLocaleString() }) })] }) }) }), _jsx(TableCell, { className: "text-right", children: _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setReviewToDelete(review), className: "opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200", children: _jsx(Trash2, { className: "h-4 w-4" }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Delete review" }) })] }) }) })] }, review.id))) }) })] }) }))] }), _jsxs(CardFooter, { className: "flex justify-between border-t bg-muted/30 px-6 py-3", children: [_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Showing ", filteredReviews.length, " of ", reviews.length, " total reviews"] }), filteredReviews.length > 0 && (_jsxs("p", { className: "text-xs font-medium", children: ["Average rating: ", _jsx("span", { className: "text-primary", children: stats.average.toFixed(1) })] }))] })] })] }), _jsx(AnimatePresence, { children: reviewToDelete && (_jsx(AlertDialog, { open: !!reviewToDelete, onOpenChange: (open) => !open && setReviewToDelete(null), children: _jsx(AlertDialogContent, { className: "bg-card/95 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20", asChild: true, children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 10 }, transition: { type: "spring", damping: 20, stiffness: 300 }, children: [_jsxs(AlertDialogHeader, { children: [_jsxs(AlertDialogTitle, { className: "flex items-center gap-2 text-destructive", children: [_jsx(Trash2, { className: "h-5 w-5" }), " Delete Review"] }), _jsxs(AlertDialogDescription, { children: ["This action cannot be undone. This will permanently delete the review", reviewToDelete?.listing_title && (_jsxs(_Fragment, { children: [" for ", _jsxs("span", { className: "font-medium text-foreground", children: ["\"", reviewToDelete.listing_title, "\""] })] })), "."] })] }), reviewToDelete && (_jsxs("div", { className: "my-4 p-3 rounded-lg bg-muted/50 border border-border/50", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Avatar, { className: "h-6 w-6", children: _jsx(AvatarFallback, { className: "bg-primary/10 text-primary text-xs", children: reviewToDelete.reviewer_name.substring(0, 2).toUpperCase() }) }), _jsx("span", { className: "font-medium", children: reviewToDelete.reviewer_name })] }), _jsx(StarRating, { rating: reviewToDelete.rating, size: 16, className: "gap-0.5 mb-1" }), _jsx("p", { className: "text-sm text-muted-foreground italic", children: reviewToDelete.comment })] })), _jsxs(AlertDialogFooter, { className: "mt-4", children: [_jsx(AlertDialogCancel, { className: "bg-background hover:bg-muted transition-colors", children: "Cancel" }), _jsx(AlertDialogAction, { onClick: handleDeleteReview, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors", children: "Delete Review" })] })] }) }) })) })] }));
};
