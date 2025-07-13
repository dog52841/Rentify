export interface Activity {
    type: 'new_user' | 'new_listing' | 'new_booking' | 'new_review';
    data: {
        id: string;
        created_at: string;
        user_name?: string;
        user_avatar?: string;
        listing_title?: string;
        rating?: number;
        review_text?: string;
        booking_dates?: {
            start_date: string;
            end_date: string;
        };
    };
}
interface ActivityFeedProps {
    activities: Activity[];
    loading: boolean;
}
export declare const ActivityFeed: React.FC<ActivityFeedProps>;
export {};
