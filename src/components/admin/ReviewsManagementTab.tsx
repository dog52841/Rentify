import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { useDebounce } from '../../hooks/use-debounce';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../ui/input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Search, Trash, MessageSquare, Star, User, Building, Loader2, List, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Review = {
    id: number;
    created_at: string;
    listing_id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    content: string;
    listing_title: string;
    reviewer_name: string;
    reviewee_name: string;
};

const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
        ))}
    </div>
);

export const ReviewsManagementTab = () => {
    const { profile: adminProfile } = useAuth();
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

    const fetchReviews = useCallback(async (search: string) => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_reviews_admin', { 
            p_search_term: search || ''
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch reviews', description: error.message });
        } else {
            setReviews(data || []);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchReviews(debouncedSearchTerm);
    }, [debouncedSearchTerm, fetchReviews]);

    const handleDeleteReview = async (reviewId: number) => {
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting review', description: error.message });
        } else {
            toast({ title: 'Review deleted successfully' });
            fetchReviews(debouncedSearchTerm);
        }
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20">
                    <CardHeader>
                        <CardTitle>Reviews Management</CardTitle>
                        <CardDescription>Search, view, and manage all user-submitted reviews.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Search by content, user, or listing..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="border rounded-lg mt-4 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Review</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Listing</TableHead>
                                        <TableHead>Reviewer</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><div className="h-5 w-48 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                                <TableCell><div className="h-5 w-24 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                                <TableCell><div className="h-5 w-32 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                                <TableCell><div className="h-5 w-24 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                                <TableCell><div className="h-8 w-8 ml-auto bg-muted/50 rounded animate-pulse"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : reviews.length > 0 ? (
                                        reviews.map((review) => (
                                            <TableRow key={review.id} className="hover:bg-primary/5 transition-colors">
                                                <TableCell className="max-w-xs">
                                                    <p className="truncate font-medium text-foreground">{review.content}</p>
                                                </TableCell>
                                                <TableCell><RatingStars rating={review.rating} /></TableCell>
                                                <TableCell>
                                                    <Link to={`/listings/${review.listing_id}`} className="hover:underline flex items-center gap-1.5 text-sm">
                                                        {review.listing_title} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link to={`/profile/${review.reviewer_id}`} className="hover:underline flex items-center gap-1.5 text-sm">
                                                        {review.reviewer_name} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this review.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteReview(review.id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center">
                                                <List className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <h3 className="mt-2 text-lg font-medium">No reviews found</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    No reviews match your search term.
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}; 