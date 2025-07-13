import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Users, Package, Calendar, Star, Activity as ActivityIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
const ActivitySkeleton = () => (_jsxs("div", { className: "flex gap-4", children: [_jsx(Skeleton, { className: "h-10 w-10 rounded-full" }), _jsxs("div", { className: "space-y-2 flex-1", children: [_jsx(Skeleton, { className: "h-4 w-3/4" }), _jsx(Skeleton, { className: "h-3 w-1/2" })] })] }));
export const ActivityFeed = ({ activities, loading }) => {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'new_user':
                return _jsx(Users, { className: "h-4 w-4" });
            case 'new_listing':
                return _jsx(Package, { className: "h-4 w-4" });
            case 'new_booking':
                return _jsx(Calendar, { className: "h-4 w-4" });
            case 'new_review':
                return _jsx(Star, { className: "h-4 w-4" });
        }
    };
    const getActivityContent = (activity) => {
        const { type, data } = activity;
        switch (type) {
            case 'new_user':
                return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: data.user_avatar }), _jsx(AvatarFallback, { children: data.user_name?.[0] })] }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium", children: [data.user_name, " joined"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(data.created_at), { addSuffix: true }) })] })] }));
            case 'new_listing':
                return (_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium", children: "New listing added" }), _jsx("p", { className: "text-xs text-muted-foreground", children: data.listing_title }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(data.created_at), { addSuffix: true }) })] }));
            case 'new_booking':
                return (_jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "text-sm font-medium", children: ["New booking for ", data.listing_title] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [new Date(data.booking_dates?.start_date || '').toLocaleDateString(), " - ", new Date(data.booking_dates?.end_date || '').toLocaleDateString()] }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(data.created_at), { addSuffix: true }) })] }));
            case 'new_review':
                return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("p", { className: "text-sm font-medium", children: ["New review for ", data.listing_title] }), _jsxs(Badge, { variant: "secondary", children: [data.rating, "\u2605"] })] }), _jsxs("p", { className: "text-xs text-muted-foreground italic", children: ["\"", data.review_text, "\""] }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(data.created_at), { addSuffix: true }) })] }));
        }
    };
    return (_jsxs(Card, { className: "p-6 bg-card/80 backdrop-blur-sm h-full", children: [_jsx(CardHeader, { className: "p-0 mb-6", children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(ActivityIcon, { className: "h-5 w-5" }), "Recent Activity"] }) }), _jsx("div", { className: "space-y-6", children: loading ? ([...Array(5)].map((_, i) => _jsx(ActivitySkeleton, {}, i))) : activities.length === 0 ? (_jsx("div", { className: "text-center py-10 text-muted-foreground", children: _jsx("p", { children: "No recent activity." }) })) : (activities.map((activity, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.1 }, className: "flex gap-4", children: [_jsx("div", { className: "mt-1", children: _jsx("div", { className: "p-2 rounded-full bg-primary/10 text-primary", children: getActivityIcon(activity.type) }) }), getActivityContent(activity)] }, activity.data.id)))) })] }));
};
