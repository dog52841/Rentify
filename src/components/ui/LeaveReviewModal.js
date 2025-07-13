import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { Button } from './Button';
import StarRating from './StarRating';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
const LeaveReviewModal = ({ isOpen, onClose, booking, reviewerId, revieweeId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast({
                variant: 'destructive',
                title: 'Please select a rating',
                description: 'You must provide a star rating.',
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('user_reviews').insert({
                booking_id: booking.id,
                reviewer_id: reviewerId,
                reviewee_id: revieweeId,
                rating: rating,
                comment: comment,
            });
            if (error)
                throw error;
            toast({
                title: 'Review Submitted!',
                description: 'Thank you for your feedback.',
            });
            onReviewSubmitted();
            onClose();
        }
        catch (err) {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: err.message || 'Could not submit your review.',
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx(AnimatePresence, { children: _jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { opacity: 0, y: 30, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 30, scale: 0.95 }, className: "bg-card rounded-2xl p-8 w-full max-w-lg relative border", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: onClose, className: "absolute top-4 right-4", children: _jsx(X, { size: 20 }) }), _jsx("h2", { className: "text-2xl font-bold mb-4", children: "Leave a Review" }), _jsxs("p", { className: "text-muted-foreground mb-6", children: ["Share your experience renting \"", booking.listings.title, "\" from ", booking.listings.profiles.full_name, "."] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Your Rating" }), _jsx(StarRating, { rating: rating, onRatingChange: setRating, size: 32, isEditable: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "comment", className: "block text-sm font-medium mb-2", children: "Your Comment (Optional)" }), _jsx("textarea", { id: "comment", rows: 4, value: comment, onChange: (e) => setComment(e.target.value), placeholder: "Describe your experience...", className: "w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring" })] }), _jsxs("div", { className: "flex justify-end gap-4", children: [_jsx(Button, { variant: "outline", type: "button", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Submitting...' : 'Submit Review' })] })] })] }) }) }));
};
export default LeaveReviewModal;
