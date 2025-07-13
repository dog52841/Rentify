interface StarRatingProps {
    rating: number | string;
    totalReviews?: number;
    size?: 'sm' | 'md' | 'lg' | number;
    showEmpty?: boolean;
    interactive?: boolean;
    isEditable?: boolean;
    onRatingChange?: (rating: number) => void;
    className?: string;
}
declare const StarRating: ({ rating: rawRating, totalReviews, size, showEmpty, interactive, isEditable, onRatingChange, className }: StarRatingProps) => import("react/jsx-runtime").JSX.Element;
export default StarRating;
