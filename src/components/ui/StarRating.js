import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
const StarRating = ({ rating: rawRating, totalReviews, size = 'md', showEmpty = true, interactive = false, isEditable = false, onRatingChange, className }) => {
    // Convert rating to number if it's a string
    const rating = typeof rawRating === 'string' ? parseFloat(rawRating) : rawRating;
    // Use either interactive or isEditable
    const isInteractive = interactive || isEditable;
    // Size classes for the stars
    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    };
    // Get the appropriate size class or use inline style for numeric sizes
    const getSizeClass = (size) => {
        if (typeof size === 'number') {
            return `h-[${size}px] w-[${size}px]`;
        }
        return sizeClasses[size];
    };
    // Determine if we're using a predefined size or custom numeric size
    const isPresetSize = typeof size === 'string';
    const sizeClass = isPresetSize ? sizeClasses[size] : undefined;
    const sizeStyle = !isPresetSize ? { height: `${size}px`, width: `${size}px` } : undefined;
    // Generate an array of 5 stars
    const stars = Array.from({ length: 5 }, (_, i) => {
        // Calculate if this star should be full, half, or empty
        const starValue = i + 1;
        const isFilled = rating >= starValue;
        const isHalf = !isFilled && rating > starValue - 0.5;
        return (_jsxs(motion.span, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay: i * 0.05, duration: 0.2 }, className: cn("relative cursor-default", isInteractive && "cursor-pointer hover:scale-110 transition-transform"), onClick: () => isInteractive && onRatingChange?.(starValue), children: [_jsx(Star, { className: cn(sizeClass, "text-muted stroke-[1.5px]", (isFilled || isHalf) && "text-amber-400", !showEmpty && !isFilled && !isHalf && "hidden"), style: sizeStyle, fill: isFilled || isHalf ? "currentColor" : "none" }), isHalf && (_jsx("span", { className: "absolute inset-0 overflow-hidden w-[50%]", children: _jsx(Star, { className: cn(sizeClass, "text-amber-400"), style: sizeStyle, fill: "currentColor" }) }))] }, i));
    });
    return (_jsxs("div", { className: cn("flex items-center gap-1.5", className), children: [_jsx("div", { className: "flex items-center", children: stars }), typeof rating === 'number' && !isNaN(rating) && (_jsx("span", { className: cn("font-medium", isPresetSize && size === 'sm' && "text-xs", isPresetSize && size === 'md' && "text-sm", isPresetSize && size === 'lg' && "text-base", !isPresetSize && "text-sm"), children: rating.toFixed(1) })), totalReviews !== undefined && (_jsxs("span", { className: cn("text-muted-foreground", isPresetSize && size === 'sm' && "text-xs", isPresetSize && size === 'md' && "text-xs", isPresetSize && size === 'lg' && "text-sm", !isPresetSize && "text-xs"), children: ["(", totalReviews, ")"] }))] }));
};
export default StarRating;
