import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface StarRatingProps {
  rating: number | string;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating = ({ 
  rating: rawRating, 
  totalReviews, 
  size = 'md', 
  showEmpty = true,
  interactive = false,
  onRatingChange
}: StarRatingProps) => {
  // Convert rating to number if it's a string
  const rating = typeof rawRating === 'string' ? parseFloat(rawRating) : rawRating;
  
  // Size classes for the stars
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  // Generate an array of 5 stars
  const stars = Array.from({ length: 5 }, (_, i) => {
    // Calculate if this star should be full, half, or empty
    const starValue = i + 1;
    const isFilled = rating >= starValue;
    const isHalf = !isFilled && rating > starValue - 0.5;
    
    return (
      <motion.span 
        key={i}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: i * 0.05, duration: 0.2 }}
        className={cn(
          "relative cursor-default",
          interactive && "cursor-pointer hover:scale-110 transition-transform"
        )}
        onClick={() => interactive && onRatingChange?.(starValue)}
      >
        <Star 
          className={cn(
            sizeClasses[size],
            "text-muted stroke-[1.5px]",
            (isFilled || isHalf) && "text-amber-400",
            !showEmpty && !isFilled && !isHalf && "hidden"
          )}
          fill={isFilled || isHalf ? "currentColor" : "none"}
        />
        
        {/* Half star overlay */}
        {isHalf && (
          <span className="absolute inset-0 overflow-hidden w-[50%]">
            <Star className={cn(sizeClasses[size], "text-amber-400")} fill="currentColor" />
          </span>
        )}
      </motion.span>
    );
  });
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {stars}
      </div>
      
      {typeof rating === 'number' && !isNaN(rating) && (
        <span className={cn(
          "font-medium",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          {rating.toFixed(1)}
        </span>
      )}
      
      {totalReviews !== undefined && (
        <span className={cn(
          "text-muted-foreground",
          size === 'sm' && "text-xs",
          size === 'md' && "text-xs",
          size === 'lg' && "text-sm"
        )}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

export default StarRating; 