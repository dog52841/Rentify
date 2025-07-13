interface UserProfileCardProps {
    user: {
        id: string;
        avatar_url?: string;
        full_name: string;
        email?: string;
        location?: string;
        created_at: string;
        is_verified?: boolean;
        role?: string;
        bio?: string;
        listings_count?: number;
        reviews_count?: number;
        average_rating?: number;
    };
    variant?: 'default' | 'compact';
    className?: string;
    showReportButton?: boolean;
}
export declare const UserProfileCard: ({ user, variant, className, showReportButton, }: UserProfileCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
