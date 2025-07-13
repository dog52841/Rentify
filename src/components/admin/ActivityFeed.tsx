import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Users, Package, Calendar, Star, Activity as ActivityIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

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

const ActivitySkeleton = () => (
    <div className="flex gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    </div>
)

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, loading }) => {
    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'new_user':
                return <Users className="h-4 w-4" />;
            case 'new_listing':
                return <Package className="h-4 w-4" />;
            case 'new_booking':
                return <Calendar className="h-4 w-4" />;
            case 'new_review':
                return <Star className="h-4 w-4" />;
        }
    };

    const getActivityContent = (activity: Activity) => {
        const { type, data } = activity;
        switch (type) {
            case 'new_user':
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={data.user_avatar} />
                            <AvatarFallback>{data.user_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{data.user_name} joined</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                );
            case 'new_listing':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium">New listing added</p>
                        <p className="text-xs text-muted-foreground">{data.listing_title}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
                        </p>
                    </div>
                );
            case 'new_booking':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium">New booking for {data.listing_title}</p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(data.booking_dates?.start_date || '').toLocaleDateString()} - {new Date(data.booking_dates?.end_date || '').toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
                        </p>
                    </div>
                );
            case 'new_review':
                return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">New review for {data.listing_title}</p>
                            <Badge variant="secondary">{data.rating}★</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground italic">"{data.review_text}"</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
                        </p>
                    </div>
                );
        }
    };

    return (
        <Card className="p-6 bg-card/80 backdrop-blur-sm h-full">
            <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <div className="space-y-6">
                {loading ? (
                    [...Array(5)].map((_, i) => <ActivitySkeleton key={i} />)
                ) : activities.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No recent activity.</p>
                    </div>
                ) : (
                    activities.map((activity, index) => (
                        <motion.div
                            key={activity.data.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4"
                        >
                            <div className="mt-1">
                                <div className="p-2 rounded-full bg-primary/10 text-primary">
                                    {getActivityIcon(activity.type)}
                                </div>
                            </div>
                            {getActivityContent(activity)}
                        </motion.div>
                    ))
                )}
            </div>
        </Card>
    );
}; 