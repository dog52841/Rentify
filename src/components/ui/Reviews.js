import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Star, ThumbsUp, ThumbsDown, Camera as CameraIcon, Send } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import StarRating from './StarRating';
import { Button } from './Button';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
const Reviews = ({ listingId, ownerId }) => {
    const { user, profile } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // New review state
    const [newReviewText, setNewReviewText] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [reviewImages, setReviewImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Check if user has booked this item before
    const [canReview, setCanReview] = useState(false);
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .rpc('get_reviews_for_listing', { p_listing_id: listingId });
        if (error) {
            setError('Failed to fetch reviews.');
            console.error(error);
        }
        else {
            setReviews(data);
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
            }
            else {
                setCanReview(false);
            }
        };
        checkIfUserCanReview();
    }, [user, listingId]);
    const handleImageChange = (e) => {
        if (e.target.files) {
            setReviewImages(Array.from(e.target.files));
        }
    };
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (newReviewRating === 0 || newReviewText.trim() === '' || !user) {
            alert("Please provide a rating and a review text.");
            return;
        }
        setIsSubmitting(true);
        const imageUrls = [];
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
        const { error: insertError } = await supabase.from('reviews').insert({
            listing_id: listingId,
            reviewer_id: user.id, // Changed from user_id
            rating: newReviewRating,
            comment: newReviewText, // changed from review_text
            images_urls: imageUrls.length > 0 ? imageUrls : null,
        });
        if (insertError) {
            setError(`Failed to submit review: ${insertError.message}`);
        }
        else {
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
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("h2", { className: "text-3xl font-bold", children: ["Reviews (", reviews.length, ")"] }), reviews.length > 0 && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(StarRating, { rating: averageRating }), _jsxs("span", { className: "font-bold text-lg", children: [averageRating.toFixed(1), " out of 5"] })] }))] }), user && canReview && user.id !== ownerId && (_jsxs(motion.div, { layout: true, className: "bg-card border rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Leave a Review" }), _jsxs("form", { onSubmit: handleSubmitReview, className: "space-y-4", children: [_jsx(StarRating, { rating: newReviewRating, onRatingChange: setNewReviewRating, isEditable: true, size: 24 }), _jsx("textarea", { value: newReviewText, onChange: (e) => setNewReviewText(e.target.value), className: "w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring", rows: 4, placeholder: "Share your experience with this item and owner...", required: true }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "review-images", className: "flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer", children: [_jsx(CameraIcon, { size: 16 }), " Add photos (optional)"] }), _jsx("input", { id: "review-images", type: "file", multiple: true, onChange: handleImageChange, className: "hidden", accept: "image/*" }), reviewImages.length > 0 && (_jsxs("div", { className: "mt-2 text-sm text-muted-foreground", children: [reviewImages.length, " photo(s) selected."] }))] }), _jsx(Button, { type: "submit", disabled: isSubmitting, className: "w-full sm:w-auto", children: isSubmitting ? 'Submitting...' : 'Submit Review' })] })] })), _jsxs("div", { className: "space-y-6", children: [loading && _jsx("p", { children: "Loading reviews..." }), error && _jsx("p", { className: "text-destructive", children: error }), _jsx(AnimatePresence, { children: reviews.map(review => (_jsxs(motion.div, { layout: true, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "flex gap-4 border-b pb-6", children: [_jsxs(Avatar, { children: [_jsx(AvatarImage, { src: review.reviewer_avatar_url, alt: review.reviewer_name }), _jsx(AvatarFallback, { children: review.reviewer_name.charAt(0) })] }), _jsxs("div", { className: "flex-grow", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-semibold", children: review.reviewer_name }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) })] }), _jsx(StarRating, { rating: review.rating, size: 16, className: "my-1" }), _jsx("p", { className: "text-foreground/90", children: review.comment }), review.images_urls && review.images_urls.length > 0 && (_jsx("div", { className: "flex gap-2 mt-3", children: review.images_urls.map(url => (_jsx("img", { src: url, alt: "Review image", className: "w-24 h-24 object-cover rounded-md border" }, url))) }))] })] }, review.id))) })] })] }));
};
export default Reviews;
