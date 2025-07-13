import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Star, ThumbsUp, ThumbsDown, Camera as CameraIcon, Send } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import StarRating from './StarRating';
import { Button } from './Button';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Review {
    id: number;
    rating: number;
    comment: string;
    created_at: string;
    images_urls: string[] | null;
    reviewer_name: string;
    reviewer_avatar_url: string;
    reviewer_id: string;
}

interface ReviewsProps {
    listingId: number;
    ownerId: string;
}

const Reviews = ({ listingId, ownerId }: ReviewsProps) => {
    const { user, profile } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New review state
    const [newReviewText, setNewReviewText] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [reviewImages, setReviewImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Check if user has booked this item before
    const [canReview, setCanReview] = useState(false);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            // Get reviews with reviewer information
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('user_reviews')
                .select(`
                    id,
                    rating,
                    review_text,
                    created_at,
                    reviewer_id,
                    listing_id
                `)
                .eq('listing_id', listingId)
                .order('created_at', { ascending: false });

            if (reviewsError) {
                setError('Failed to fetch reviews.');
                console.error(reviewsError);
                setLoading(false);
                return;
            }

            // Get reviewer profiles for each review
            const reviewsWithProfiles = await Promise.all(
                (reviewsData || []).map(async (review) => {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('id', review.reviewer_id)
                        .single();

                    return {
                        id: review.id,
                        rating: review.rating,
                        comment: review.review_text,
                        created_at: review.created_at,
                        images_urls: null, // No images in current schema
                        reviewer_name: profileData?.full_name || 'Anonymous',
                        reviewer_avatar_url: profileData?.avatar_url || '',
                        reviewer_id: review.reviewer_id
                    };
                })
            );

            setReviews(reviewsWithProfiles);
        } catch (error) {
            setError('Failed to fetch reviews.');
            console.error(error);
        }
        setLoading(false);
    }, [listingId]);
    
    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);
    
    useEffect(() => {
        const checkIfUserCanReview = async () => {
            if (!user) {
                setCanReview(false);
                return;
            }
            // A user can review if they have a 'confirmed' booking for this item.
            const { data, error } = await supabase
                .from('bookings')
                .select('id')
                .eq('listing_id', listingId)
                .eq('renter_id', user.id)
                .in('status', ['confirmed', 'completed']) // Or whatever status means they used it
                .limit(1);

            if (!error && data && data.length > 0) {
                setCanReview(true);
            } else {
                setCanReview(false);
            }
        };

        checkIfUserCanReview();
    }, [user, listingId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setReviewImages(Array.from(e.target.files));
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newReviewRating === 0 || newReviewText.trim() === '' || !user) {
            alert("Please provide a rating and a review text.");
            return;
        }

        setIsSubmitting(true);
        
        const imageUrls: string[] = [];
        if (reviewImages.length > 0) {
            for (const image of reviewImages) {
                const fileName = `reviews/${listingId}/${user.id}/${Date.now()}_${image.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('listing-images') // Changed from 'listings' to 'listing-images'
                    .upload(fileName, image);
                
                if (uploadError) {
                    setError(`Failed to upload image: ${uploadError.message}`);
                    setIsSubmitting(false);
                    return;
                }
                const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(uploadData.path);
                imageUrls.push(urlData.publicUrl);
            }
        }
        
        const { error: insertError } = await supabase.from('user_reviews').insert({
            listing_id: listingId,
            reviewer_id: user.id,
            rating: newReviewRating,
            review_text: newReviewText,
            reviewee_id: ownerId, // Add the owner as the person being reviewed
        });

        if (insertError) {
            setError(`Failed to submit review: ${insertError.message}`);
        } else {
            setNewReviewText('');
            setNewReviewRating(0);
            setReviewImages([]);
            await fetchReviews(); // Re-fetch reviews to show the new one
        }
        setIsSubmitting(false);
    };

    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-3xl font-bold">Reviews ({reviews.length})</h2>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                        <StarRating rating={averageRating} />
                        <span className="font-bold text-lg">{averageRating.toFixed(1)} out of 5</span>
                    </div>
                )}
            </div>

            {/* --- Review Submission Form --- */}
            {user && canReview && user.id !== ownerId && (
                 <motion.div layout className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                        <StarRating
                            rating={newReviewRating}
                            onRatingChange={setNewReviewRating}
                            isEditable
                            size={24}
                        />
                        <textarea
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            className="w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring"
                            rows={4}
                            placeholder="Share your experience with this item and owner..."
                            required
                        />
                         <div>
                            <label htmlFor="review-images" className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer">
                                <CameraIcon size={16} /> Add photos (optional)
                            </label>
                            <input
                                id="review-images"
                                type="file"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/*"
                            />
                            {reviewImages.length > 0 && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                    {reviewImages.length} photo(s) selected.
                                </div>
                            )}
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </form>
                </motion.div>
            )}

            {/* --- List of Reviews --- */}
            <div className="space-y-6">
                {loading && <p>Loading reviews...</p>}
                {error && <p className="text-destructive">{error}</p>}
                <AnimatePresence>
                    {reviews.map(review => (
                        <motion.div
                            key={review.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex gap-4 border-b pb-6"
                        >
                            <Avatar>
                                <AvatarImage src={review.reviewer_avatar_url} alt={review.reviewer_name} />
                                <AvatarFallback>{review.reviewer_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">{review.reviewer_name}</h4>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</p>
                                </div>
                                <StarRating rating={review.rating} size={16} className="my-1" />
                                <p className="text-foreground/90">{review.comment}</p>
                                {review.images_urls && review.images_urls.length > 0 && (
                                    <div className="flex gap-2 mt-3">
                                        {review.images_urls.map(url => (
                                            <img key={url} src={url} alt="Review image" className="w-24 h-24 object-cover rounded-md border" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Reviews; 