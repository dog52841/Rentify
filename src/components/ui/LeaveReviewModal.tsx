import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { Button } from './Button';
import StarRating from './StarRating';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any; // Consider creating a more specific type for this
  reviewerId: string;
  revieweeId: string;
  onReviewSubmitted: () => void;
}

const LeaveReviewModal = ({ isOpen, onClose, booking, reviewerId, revieweeId, onReviewSubmitted }: LeaveReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (error) throw error;
      
      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
      });
      onReviewSubmitted();
      onClose();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: err.message || 'Could not submit your review.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="bg-card rounded-2xl p-8 w-full max-w-lg relative border"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <X size={20} />
          </Button>

          <h2 className="text-2xl font-bold mb-4">Leave a Review</h2>
          <p className="text-muted-foreground mb-6">
            Share your experience renting "{booking.listings.title}" from {booking.listings.profiles.full_name}.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Your Rating</label>
              <StarRating rating={rating} onRatingChange={setRating} size={32} isEditable />
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-2">Your Comment (Optional)</label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your experience..."
                className="w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LeaveReviewModal; 