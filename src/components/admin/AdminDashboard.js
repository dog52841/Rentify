import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Package, Star, BarChart2, Shield, Settings, LifeBuoy, LogOut, ArrowUpRight, DollarSign, ShoppingCart, UserPlus, TrendingUp, CalendarCheck2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserManagementTab } from './UserManagementTab';
import { ListingsManagementTab } from './ListingsManagementTab';
import { ReviewsManagementTab } from './ReviewsTab';
import { BookingsManagementTab } from './BookingsManagementTab';
import { UserReportingTab } from './UserReportingTab';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { StatsChart } from './StatsChart';
import { ActivityFeed } from './ActivityFeed';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
const AdminDashboard = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(30); // 30 days default
    const { toast } = useToast();
    const navItems = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'listings', label: 'Listings', icon: Package },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'bookings', label: 'Bookings', icon: CalendarCheck2 },
        { id: 'user-reports', label: 'User Reports', icon: AlertTriangle },
    ];
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_admin_detailed_stats', {
                    p_days_range: timeRange
                });
                if (error)
                    throw error;
                setStats(data);
            }
            catch (error) {
                toast({
                    title: "Error fetching stats",
                    description: error.message,
                    variant: "destructive",
                });
            }
            finally {
                setLoading(false);
            }
        };
        fetchStats();
        // Set up real-time subscription for updates
        const subscription = supabase
            .channel('admin-updates')
            .on('postgres_changes', { event: '*', schema: 'public' }, fetchStats)
            .subscribe();
        return () => {
            subscription.unsubscribe();
        };
    }, [timeRange, toast]);
    if (profile && !loading && profile.role !== 'admin') {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8", children: [_jsx(ShieldAlert, { className: "h-16 w-16 text-destructive mb-4" }), _jsx("h1", { className: "text-3xl font-bold", children: "Access Denied" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "You do not have permission to view this page." }), _jsx(Button, { asChild: true, className: "mt-6", children: _jsx(Link, { to: "/", children: "Go to Homepage" }) })] }));
    }
    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return _jsx(UserManagementTab, {});
            case 'listings':
                return _jsx(ListingsManagementTab, {});
            case 'reviews':
                return _jsx(ReviewsManagementTab, {});
            case 'bookings':
                return _jsx(BookingsManagementTab, {});
            case 'user-reports':
                return _jsx(UserReportingTab, {});
            case 'overview':
            default:
                return _jsx(OverviewTab, { stats: stats, loading: loading || !profile, timeRange: timeRange, setTimeRange: setTimeRange });
        }
    };
    return (_jsxs("div", { className: "flex min-h-screen bg-background text-foreground", children: [_jsx(Sidebar, { activeTab: activeTab, setActiveTab: setActiveTab, navItems: navItems }), _jsx("main", { className: "flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden", children: _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.3 }, children: renderContent() }, activeTab) }) })] }));
};
const StatCard = ({ title, value, icon: Icon, loading }) => (_jsxs(Card, { className: "p-6 bg-card/80 backdrop-blur-sm border-border/10 relative overflow-hidden group transition-all duration-300 ease-in-out hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1", children: [_jsx("div", { className: "absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:scale-150" }), _jsx("div", { className: "relative z-10 flex flex-col justify-between h-full", children: _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("p", { className: "text-sm font-medium text-muted-foreground", children: title }), _jsx("div", { className: "p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors", children: _jsx(Icon, { className: "h-5 w-5 text-primary" }) })] }), loading ? (_jsx(Skeleton, { className: "h-9 w-28" })) : (_jsx("p", { className: "text-4xl font-bold tracking-tight text-foreground", children: value }))] }) })] }));
const OverviewTab = ({ stats, loading, timeRange, setTimeRange }) => {
    if (!stats && !loading)
        return null;
    const overview = stats?.overview || {
        total_users: 0,
        total_listings: 0,
        total_reviews: 0,
        total_bookings: 0,
        total_revenue: 0,
        average_rating: 0,
        active_listings: 0,
        pending_bookings: 0,
    };
    const dailyStats = stats?.daily_stats || [];
    const activities = stats?.recent_activities || [];
    return (_jsxs("div", { className: "space-y-8", children: [_jsx(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: _jsxs("div", { className: "flex flex-col md:flex-row items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-bold tracking-tight", children: "Dashboard Overview" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Monitor your platform's performance and growth." })] }), _jsx(Tabs, { value: timeRange.toString(), onValueChange: (v) => setTimeRange(parseInt(v)), children: _jsxs(TabsList, { className: "bg-card/80", children: [_jsx(TabsTrigger, { value: "7", children: "7D" }), _jsx(TabsTrigger, { value: "30", children: "30D" }), _jsx(TabsTrigger, { value: "90", children: "90D" })] }) })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(StatCard, { title: "Total Revenue", value: loading ? '...' : `$${overview.total_revenue?.toLocaleString()}`, icon: DollarSign, loading: loading }), _jsx(StatCard, { title: "Active Listings", value: loading ? '...' : overview.active_listings, icon: Package, loading: loading }), _jsx(StatCard, { title: "Total Users", value: loading ? '...' : overview.total_users, icon: Users, loading: loading }), _jsx(StatCard, { title: "Pending Bookings", value: loading ? '...' : overview.pending_bookings, icon: ShoppingCart, loading: loading })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-8", children: [_jsxs(Card, { className: "lg:col-span-3 p-6 bg-card/80 backdrop-blur-sm", children: [_jsx("h3", { className: "text-lg font-semibold mb-6", children: "Performance Overview" }), loading ? (_jsx(Skeleton, { className: "w-full h-[300px]" })) : (_jsx(StatsChart, { data: dailyStats.map((day) => ({
                                    name: new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                                    users: day.new_users,
                                    listings: day.new_listings,
                                    bookings: day.new_bookings,
                                    revenue: day.revenue
                                })), type: "line" }))] }), _jsx("div", { className: "lg:col-span-2", children: _jsx(ActivityFeed, { activities: activities, loading: loading }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "p-6 bg-card/80 backdrop-blur-sm", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Top Categories" }), loading ? (_jsx("div", { className: "space-y-4", children: [1, 2, 3].map(i => _jsx(Skeleton, { className: "h-8 w-full" }, i)) })) : (_jsx("div", { className: "space-y-4", children: stats?.top_categories?.map((cat, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: cat.category }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [cat.listing_count, " listings"] })] }), _jsxs(Badge, { variant: index === 0 ? "default" : "secondary", children: [cat.avg_rating.toFixed(1), " \u2605"] })] }, cat.category))) }))] }), _jsxs(Card, { className: "p-6 bg-card/80 backdrop-blur-sm", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Popular Locations" }), loading ? (_jsx("div", { className: "space-y-4", children: [1, 2, 3].map(i => _jsx(Skeleton, { className: "h-8 w-full" }, i)) })) : (_jsx("div", { className: "space-y-4", children: stats?.top_locations?.map((loc) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: loc.location_text }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [loc.listing_count, " listings"] })] }), _jsxs(Badge, { variant: "outline", children: [loc.avg_rating.toFixed(1), " \u2605"] })] }, loc.location_text))) }))] })] })] }));
};
const Sidebar = ({ activeTab, setActiveTab, navItems }) => (_jsxs("aside", { className: "w-64 flex-shrink-0 bg-card border-r border-border/10 p-6 flex flex-col justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-10", children: [_jsx("div", { className: "p-2 bg-primary/10 rounded-lg", children: _jsx(Shield, { className: "h-7 w-7 text-primary" }) }), _jsx("h1", { className: "text-xl font-bold", children: "Admin Panel" })] }), _jsx("nav", { className: "space-y-2", children: navItems.map((item) => (_jsxs(Button, { onClick: () => setActiveTab(item.id), variant: activeTab === item.id ? "default" : "ghost", className: "w-full justify-start gap-3", children: [_jsx(item.icon, { className: "h-5 w-5" }), _jsx("span", { children: item.label })] }, item.id))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Button, { variant: "ghost", className: "w-full justify-start gap-3", children: [_jsx(Settings, { className: "h-5 w-5" }), _jsx("span", { children: "Settings" })] }), _jsxs(Button, { variant: "ghost", className: "w-full justify-start gap-3", children: [_jsx(LifeBuoy, { className: "h-5 w-5" }), _jsx("span", { children: "Support" })] }), _jsxs(Button, { variant: "ghost", className: "w-full justify-start gap-3", children: [_jsx(LogOut, { className: "h-5 w-5" }), _jsx("span", { children: "Logout" })] })] })] }));
export default AdminDashboard;
