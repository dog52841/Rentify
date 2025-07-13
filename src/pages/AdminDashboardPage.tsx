import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, ListChecks, ShoppingBag, Activity, Star, Shield, Ban, 
    CheckCircle, AlertCircle, Clock, DollarSign, TrendingUp, Eye,
    ChevronDown, ChevronUp, Search, Filter, RefreshCw, MoreVertical,
    Calendar, User, MapPin, CreditCard, MessageSquare, Settings, 
    BarChart2, PieChart, LineChart, Flag, Bell, Mail, Send, Inbox
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/Skeleton';
import { AnimatedSection, AnimatedItem, AnimatedCard, PageTransition } from '../components/ui/AnimatedSection';
import { Progress } from '../components/ui/progress';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement,
    ArcElement,
    Title, 
    Tooltip, 
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement,
    ArcElement,
    Title, 
    Tooltip, 
    Legend,
    Filler
);

// Enhanced Types
type AdminUser = {
    id: string;
    created_at: string;
    full_name: string;
    email: string;
    role: string;
    is_banned: boolean;
    is_verified: boolean;
    stripe_connect_id: string | null;
    total_listings: number;
    total_bookings: number;
    total_earnings: number;
    last_active: string;
};

type AdminListing = {
    id: string;
    created_at: string;
    title: string;
    description: string;
    price_per_day: number;
    status: string;
    is_verified: boolean;
    owner_id: string;
    owner_name: string;
    owner_email: string;
    total_bookings: number;
    total_revenue: number;
    average_rating: number;
    view_count: number;
    location_text: string;
    image_urls: string[];
};

type DashboardStats = {
    total_users: number;
    total_listings: number;
    total_bookings: number;
    total_revenue: number;
    active_users_last_30_days: number;
    new_users_last_30_days: number;
    new_listings_last_30_days: number;
    completed_bookings_last_30_days: number;
    platform_earnings_last_30_days: number;
    average_listing_rating: number;
    // New fields for enhanced overview
    new_users_last_7_days?: number;
    bookings_last_7_days?: number;
    revenue_last_7_days?: number;
    revenue_last_30_days?: number;
    pending_listings?: number;
    active_listings?: number;
    inactive_listings?: number;
    pending_reports?: number;
    total_reviews?: number;
    reviews_last_30_days?: number;
};

type AdminActivity = {
    id: number;
    admin_id: string;
    admin_name: string;
    action: string;
    target_id: string;
    target_type: string;
    details: any;
    created_at: string;
    target_name: string;
    target_status: string;
};

type UserActivity = {
    activity_type: string;
    activity_date: string;
    details: any;
};

// Add a new type for reviews
type AdminReview = {
    id: string;
    created_at: string;
    rating: number;
    comment: string;
    listing_id: string;
    listing_title: string;
    reviewer_id: string;
    reviewer_name: string;
    reviewee_id: string;
    reviewee_name: string;
};

// Add a new type for reports
type Report = {
    id: string;
    created_at: string;
    reporter_id: string;
    reporter_name: string;
    reported_id: string;
    reported_name: string;
    report_type: string;
    reason: string;
    status: string;
    details: any;
};

// Add types for messages and notifications
type AdminMessage = {
    id: string;
    created_at: string;
    sender_id: string;
    sender_name: string;
    recipient_id: string;
    recipient_name: string;
    content: string;
    is_read: boolean;
    attachment_url: string | null;
};

type Notification = {
    id: string;
    created_at: string;
    type: string;
    title: string;
    content: string;
    is_read: boolean;
    action_link: string | null;
    related_id: string | null;
};

type Conversation = {
    conversation_id: string;
    other_user_id: string;
    other_user_name: string;
    other_user_avatar: string | null;
    last_message_content: string;
    last_message_time: string;
    unread_count: number;
};

// Enhanced OverviewTab component
const OverviewTab = ({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) => {
    // Create safe stats object to avoid undefined errors
    const safeStats = {
        total_users: stats?.total_users || 0,
        total_listings: stats?.total_listings || 0,
        total_bookings: stats?.total_bookings || 0,
        total_revenue: stats?.total_revenue || 0,
        active_users_last_30_days: stats?.active_users_last_30_days || 0,
        new_users_last_30_days: stats?.new_users_last_30_days || 0,
        new_listings_last_30_days: stats?.new_listings_last_30_days || 0,
        completed_bookings_last_30_days: stats?.completed_bookings_last_30_days || 0,
        platform_earnings_last_30_days: stats?.platform_earnings_last_30_days || 0,
        average_listing_rating: stats?.average_listing_rating || 0,
        new_users_last_7_days: stats?.new_users_last_7_days || 0,
        bookings_last_7_days: stats?.bookings_last_7_days || 0,
        revenue_last_7_days: stats?.revenue_last_7_days || 0,
        revenue_last_30_days: stats?.revenue_last_30_days || 0,
        pending_listings: stats?.pending_listings || 0,
        active_listings: stats?.active_listings || 0,
        inactive_listings: stats?.inactive_listings || 0,
        pending_reports: stats?.pending_reports || 0,
        total_reviews: stats?.total_reviews || 0,
        reviews_last_30_days: stats?.reviews_last_30_days || 0,
    };

    // Monthly revenue data for the chart
    const revenueData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Monthly Revenue',
                data: [
                    safeStats.revenue_last_30_days * 0.7, 
                    safeStats.revenue_last_30_days * 0.8, 
                    safeStats.revenue_last_30_days * 0.6, 
                    safeStats.revenue_last_30_days * 0.9, 
                    safeStats.revenue_last_30_days * 0.75, 
                    safeStats.revenue_last_30_days
                ],
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ]
    };

    // User activity data for the chart
    const userActivityData = {
        labels: ['New Users', 'Active Users'],
        datasets: [
            {
                label: 'Last 30 Days',
                data: [safeStats.new_users_last_30_days, safeStats.active_users_last_30_days],
                backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(59, 130, 246, 0.8)'],
            }
        ]
    };

    // Listings by status data for the chart - All listings are instantly available
    const listingStatusData = {
        labels: ['Active', 'Featured', 'Verified'],
        datasets: [
            {
                data: [safeStats.active_listings, safeStats.active_listings * 0.3, safeStats.active_listings * 0.6],
                backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(59, 130, 246, 0.8)'],
                borderWidth: 0,
            }
        ]
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array(8).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[120px] w-full" />
                ))}
            </div>
        );
    }

    return (
        <AnimatedSection staggerChildren staggerDelay={0.05}>
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AnimatedCard className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start">
                            <div>
                            <p className="text-white/80 text-sm font-medium">Total Users</p>
                            <h3 className="text-3xl font-bold mt-2">{safeStats.total_users.toLocaleString()}</h3>
                            <p className="text-white/70 text-xs mt-2">
                                    +{safeStats.new_users_last_30_days} in last 30 days
                                </p>
                            </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <Users className="h-6 w-6 text-white" />
                            </div>
                        </div>
                </AnimatedCard>

                <AnimatedCard className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start">
                            <div>
                            <p className="text-white/80 text-sm font-medium">Total Listings</p>
                            <h3 className="text-3xl font-bold mt-2">{safeStats.total_listings.toLocaleString()}</h3>
                            <p className="text-white/70 text-xs mt-2">
                                    +{safeStats.new_listings_last_30_days} in last 30 days
                                </p>
                            </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <ListChecks className="h-6 w-6 text-white" />
                            </div>
                        </div>
                </AnimatedCard>

                <AnimatedCard className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start">
                            <div>
                            <p className="text-white/80 text-sm font-medium">Total Bookings</p>
                            <h3 className="text-3xl font-bold mt-2">{safeStats.total_bookings.toLocaleString()}</h3>
                            <p className="text-white/70 text-xs mt-2">
                                +{safeStats.completed_bookings_last_30_days} in last 30 days
                                </p>
                            </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <Calendar className="h-6 w-6 text-white" />
                            </div>
                        </div>
                </AnimatedCard>

                <AnimatedCard className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start">
                            <div>
                            <p className="text-white/80 text-sm font-medium">Total Revenue</p>
                            <h3 className="text-3xl font-bold mt-2">
                                ${safeStats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-white/70 text-xs mt-2">
                                +${safeStats.platform_earnings_last_30_days.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in last 30 days
                                </p>
                            </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                            </div>
                        </div>
                </AnimatedCard>
                            </div>

            {/* Charts and Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Trend */}
                <AnimatedCard className="rounded-xl shadow-md bg-card text-card-foreground p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                        <TrendingUp className="h-5 w-5 mr-2 text-indigo-500" />
                        Revenue Trend
                    </h3>
                    <div className="h-[300px]">
                        <Line 
                            data={revenueData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                    },
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: function(value) {
                                                return '$' + value;
                                            }
                                        }
                                    }
                                }
                            }} 
                            />
                        </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Last 7 Days</p>
                            <p className="text-lg font-semibold">${safeStats.revenue_last_7_days.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Last 30 Days</p>
                            <p className="text-lg font-semibold">${safeStats.revenue_last_30_days.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Platform Fee</p>
                            <p className="text-lg font-semibold">${safeStats.platform_earnings_last_30_days.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </AnimatedCard>

                {/* Reviews & Ratings */}
                <AnimatedCard className="rounded-xl shadow-md bg-card text-card-foreground p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                        <Star className="h-5 w-5 mr-2 text-amber-500" />
                        Reviews & Ratings
                    </h3>
                    <div className="flex items-center justify-center h-[200px]">
                        <div className="text-center">
                            <div className="text-6xl font-bold text-amber-500">{safeStats.average_listing_rating.toFixed(1)}</div>
                            <div className="flex items-center justify-center mt-2">
                                {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                        className={`h-6 w-6 ${i < Math.round(safeStats.average_listing_rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
                                />
                            ))}
                        </div>
                            <p className="text-sm text-muted-foreground mt-2">Average Rating</p>
                            </div>
                        </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Reviews</p>
                            <p className="text-lg font-semibold">{safeStats.total_reviews.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Last 30 Days</p>
                            <p className="text-lg font-semibold">{safeStats.reviews_last_30_days.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Review Rate</p>
                            <p className="text-lg font-semibold">{((safeStats.total_reviews / safeStats.total_bookings) * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                </AnimatedCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Activity */}
                <AnimatedCard className="rounded-xl shadow-md bg-card text-card-foreground p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                        <User className="h-5 w-5 mr-2 text-blue-500" />
                        User Activity
                    </h3>
                    <div className="h-[200px]">
                        <Bar 
                            data={userActivityData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                    }
                                }
                            }} 
                        />
                        </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">New Users</p>
                            <p className="text-lg font-semibold">{safeStats.new_users_last_30_days.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Active Users</p>
                            <p className="text-lg font-semibold">{safeStats.active_users_last_30_days.toLocaleString()}</p>
                        </div>
                    </div>
                </AnimatedCard>

                {/* Listings by Status */}
                <AnimatedCard className="rounded-xl shadow-md bg-white p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <ListChecks className="h-5 w-5 mr-2 text-green-500" />
                        Listings by Status
                    </h3>
                    <div className="h-[200px] flex items-center justify-center">
                        <div style={{ width: '80%', height: '80%' }}>
                            <Doughnut 
                                data={listingStatusData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                    cutout: '70%',
                                }} 
                            />
                        </div>
                        </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                        <div>
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                            <p className="text-lg font-semibold mt-1">{safeStats.active_listings.toLocaleString()}</p>
                        </div>
                        <div>
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>
                            <p className="text-lg font-semibold mt-1">{safeStats.pending_listings.toLocaleString()}</p>
                        </div>
                        <div>
                            <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
                            <p className="text-lg font-semibold mt-1">{safeStats.inactive_listings.toLocaleString()}</p>
                        </div>
                    </div>
                </AnimatedCard>

                {/* Pending Reports Alert */}
                <AnimatedCard className="rounded-xl shadow-md bg-white p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                        Pending Reports
                    </h3>
                    {safeStats.pending_reports > 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] bg-red-50 rounded-lg p-6">
                            <div className="bg-red-100 p-3 rounded-full mb-4">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                            <h4 className="text-xl font-bold text-red-700">{safeStats.pending_reports} Reports Need Attention</h4>
                            <p className="text-sm text-red-600 text-center mt-2">
                                There are pending reports that require your review.
                            </p>
                            <Button variant="destructive" className="mt-4" onClick={() => document.querySelector('[value="reports"]')?.dispatchEvent(new Event('click'))}>
                                Review Reports
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] bg-green-50 rounded-lg p-6">
                            <div className="bg-green-100 p-3 rounded-full mb-4">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h4 className="text-xl font-bold text-green-700">No Pending Reports</h4>
                            <p className="text-sm text-green-600 text-center mt-2">
                                All reports have been addressed. Great job!
                            </p>
                        </div>
                    )}
                    <div className="mt-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Last checked: {format(new Date(), 'MMM dd, yyyy HH:mm')}
                        </p>
            </div>
                </AnimatedCard>
        </div>
        </AnimatedSection>
    );
};

const ListingsTab = ({
    listings,
    loading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortOrder,
    setSortOrder,
    sortField,
    setSortField,
    onRefresh
}: {
    listings: AdminListing[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (order: 'asc' | 'desc') => void;
    sortField: string;
    setSortField: (field: string) => void;
    onRefresh: () => void;
}) => {
    const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const normalizedListings = listings.map(listing => ({
        ...listing,
        image_urls: listing.image_urls || [],
        owner_id: listing.owner_id || listing.user_id,
    }));
    
    // Filter and sort listings
    const filteredListings = useMemo(() => {
        if (!normalizedListings || normalizedListings.length === 0) return [];
        
        return normalizedListings
            .filter(listing => 
                (filterStatus === 'all' || 
                 (filterStatus === 'featured' && listing.is_verified) ||
                 (filterStatus === 'regular' && !listing.is_verified)) &&
                (
                    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    listing.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    listing.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
            .sort((a, b) => {
                let aValue = a[sortField as keyof AdminListing];
                let bValue = b[sortField as keyof AdminListing];
                
                // Handle numeric fields
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                }
                
                // Handle date fields
                if (sortField === 'created_at') {
                    return sortOrder === 'asc' 
                        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                
                // Handle string fields
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            });
    }, [normalizedListings, searchTerm, filterStatus, sortField, sortOrder]);

    const handleVerificationToggle = async (listing: AdminListing) => {
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('listings')
                .update({ is_verified: !listing.is_verified })
                .eq('id', listing.id);
            
            if (error) {
                console.error('Error toggling verification:', error);
                toast({
                    title: "Error",
                    description: `Failed to ${listing.is_verified ? 'unverify' : 'verify'} listing: ${error.message}`,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success",
                    description: `Listing ${listing.is_verified ? 'removed from' : 'added to'} featured listings successfully`,
                    variant: "success"
                });
                onRefresh();
            }
        } catch (err) {
            console.error('Exception in handleVerificationToggle:', err);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteListing = async (listing: AdminListing) => {
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listing.id);
            
            if (error) {
                console.error('Error deleting listing:', error);
                toast({
                    title: "Error",
                    description: `Failed to delete listing: ${error.message}`,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success",
                    description: "Listing deleted successfully",
                    variant: "success"
                });
                setIsDeleteDialogOpen(false);
                onRefresh();
            }
        } catch (err) {
            console.error('Exception in handleDeleteListing:', err);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViewListing = (listing: AdminListing) => {
        navigate(`/listings/${listing.id}`);
    };

    // If there are no listings, show a message
    if (!loading && (!normalizedListings || normalizedListings.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No listings found</h3>
                <p className="text-muted-foreground mb-4 text-center">
                    There are no listings in the system yet.
                </p>
                <Button onClick={onRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <Input
                        placeholder="Search listings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-[300px]"
                    />
                    <Select onValueChange={(value) => setFilterStatus(value)} value={filterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter listings" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Listings</SelectItem>
                            <SelectItem value="featured">Featured Listings</SelectItem>
                            <SelectItem value="regular">Regular Listings</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md p-1">
                        <Button 
                            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                            </svg>
                        </Button>
                        <Button 
                            variant={viewMode === 'list' ? 'default' : 'ghost'} 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </Button>
                    </div>
                    <Button onClick={onRefresh} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {filteredListings.length === 0 ? (
                <div className="text-center py-10">
                    <ListChecks className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filter to find what you're looking for.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredListings.map(listing => (
                        <Card key={listing.id} className="overflow-hidden h-full flex flex-col">
                            <div className="relative h-48 bg-gray-100">
                                {listing.image_urls && listing.image_urls.length > 0 ? (
                                    <img 
                                        src={listing.image_urls[0]} 
                                        alt={listing.title}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                        <Eye className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    {listing.is_verified ? (
                                        <Badge variant="success" className="bg-blue-100 text-blue-800 border-blue-300">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Featured
                                        </Badge>
                                    ) : null}
                                </div>
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                                        <CardDescription className="line-clamp-1">
                                            <MapPin className="h-3 w-3 inline mr-1" />
                                            {listing.location_text || 'No location'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewListing(listing)}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleVerificationToggle(listing)}>
                                                    {listing.is_verified ? 'Remove from Featured' : 'Add to Featured'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteListing(listing)} className="text-red-600">
                                                    Delete Listing
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="py-2 flex-grow">
                                <div className="flex justify-between mb-2">
                                    <div className="text-sm">
                                        <span className="font-medium">${listing.price_per_day}</span> / day
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                        {listing.average_rating ? listing.average_rating.toFixed(1) : 'N/A'}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                            </CardContent>
                            <CardFooter className="pt-2 border-t">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                        <Avatar className="h-6 w-6 mr-2">
                                            <AvatarFallback>{listing.owner_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{listing.owner_name}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-4 py-2 px-4 font-medium text-sm text-muted-foreground border-b">
                        <div className="col-span-4">Listing</div>
                        <div className="col-span-2">Owner</div>
                        <div className="col-span-1 text-center">Price</div>
                        <div className="col-span-1 text-center">Rating</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-1 text-center">Bookings</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    {filteredListings.map(listing => (
                        <div key={listing.id} className="grid grid-cols-12 gap-4 py-3 px-4 items-center border rounded-md hover:bg-muted/50">
                            <div className="col-span-4">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
                                        {listing.image_urls && listing.image_urls.length > 0 ? (
                                            <img 
                                                src={listing.image_urls[0]} 
                                                alt={listing.title}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <Eye className="h-4 w-4 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium line-clamp-1">{listing.title}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">
                                            <MapPin className="h-3 w-3 inline mr-1" />
                                            {listing.location_text || 'No location'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="flex items-center">
                                    <Avatar className="h-6 w-6 mr-2">
                                        <AvatarFallback>{listing.owner_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm line-clamp-1">{listing.owner_name}</span>
                                </div>
                            </div>
                            <div className="col-span-1 text-center font-medium">
                                ${listing.price_per_day}
                            </div>
                            <div className="col-span-1 text-center">
                                <div className="flex items-center justify-center">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                    <span>{listing.average_rating ? listing.average_rating.toFixed(1) : 'N/A'}</span>
                                </div>
                            </div>
                            <div className="col-span-1 text-center">
                                {listing.is_verified ? (
                                    <Badge variant="success" className="bg-blue-100 text-blue-800 border-blue-300">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Featured
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        Regular
                                    </Badge>
                                )}
                            </div>
                            <div className="col-span-1 text-center">
                                {listing.total_bookings}
                            </div>
                            <div className="col-span-2 flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewListing(listing)}>
                                    View
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleVerificationToggle(listing)}>
                                            {listing.is_verified ? 'Remove from Featured' : 'Add to Featured'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteListing(listing)} className="text-red-600">
                                            Delete Listing
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedListing && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedListing.title}</DialogTitle>
                            <DialogDescription>
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedListing.is_verified ? (
                                        <Badge variant="success" className="bg-blue-100 text-blue-800 border-blue-300">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Featured
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">
                                            Regular
                                        </Badge>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                                    {selectedListing.image_urls && selectedListing.image_urls.length > 0 ? (
                                        <img 
                                            src={selectedListing.image_urls[0]} 
                                            alt={selectedListing.title}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=No+Image';
                                            }}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <Eye className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {selectedListing.image_urls && selectedListing.image_urls.length > 1 && (
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {selectedListing.image_urls.slice(1, 5).map((url, index) => (
                                            <div key={index} className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                                                <img 
                                                    src={url} 
                                                    alt={`${selectedListing.title} ${index + 2}`}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                                    <p className="mt-1">{selectedListing.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                                        <p className="mt-1 font-semibold">${selectedListing.price_per_day} / day</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                                        <p className="mt-1">{selectedListing.location_text || 'No location'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Rating</h3>
                                        <div className="flex items-center mt-1">
                                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                            <span>{selectedListing.average_rating ? selectedListing.average_rating.toFixed(1) : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Views</h3>
                                        <p className="mt-1">{selectedListing.view_count || 0}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Total Bookings</h3>
                                        <p className="mt-1">{selectedListing.total_bookings}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                                        <p className="mt-1">${selectedListing.total_revenue?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-medium text-muted-foreground">Owner Information</h3>
                                    <div className="flex items-center mt-2">
                                        <Avatar className="h-10 w-10 mr-3">
                                            <AvatarFallback>{selectedListing.owner_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{selectedListing.owner_name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedListing.owner_email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                    <p className="mt-1">{format(new Date(selectedListing.created_at), 'PPP')}</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Close
                            </Button>
                            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => handleVerificationToggle(selectedListing)}
                                >
                                    {selectedListing.is_verified ? 'Remove from Featured' : 'Add to Featured'}
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    onClick={() => {
                                        handleDeleteListing(selectedListing);
                                        setIsDialogOpen(false);
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

const UsersTab = ({
    users,
    loading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortOrder,
    setSortOrder,
    sortField,
    setSortField,
    onRefresh,
    onUserSelect
}: {
    users: AdminUser[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (order: 'asc' | 'desc') => void;
    sortField: string;
    setSortField: (field: string) => void;
    onRefresh: () => void;
    onUserSelect: (user: AdminUser | null) => void;
}) => {
    const { toast } = useToast();

    const handleVerificationToggle = async (user: AdminUser) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_verified: !user.is_verified })
                .eq('id', user.id);

            if (error) throw error;

            toast({
                title: 'Success',
                description: `User ${user.is_verified ? 'unverified' : 'verified'} successfully.`
            });

            onRefresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearchTerm = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilterStatus = filterStatus === 'all' ||
                                   (filterStatus === 'verified' && user.is_verified) ||
                                   (filterStatus === 'unverified' && !user.is_verified) ||
                                   (filterStatus === 'banned' && user.is_banned) ||
                                   (filterStatus === 'active' && user.last_active && new Date(user.last_active) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        return matchesSearchTerm && matchesFilterStatus;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const aValue = a[sortField as keyof AdminUser];
        const bValue = b[sortField as keyof AdminUser];
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[200px] w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm"
                    />
                    <Select onValueChange={(value) => setFilterStatus(value)} value={filterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="unverified">Unverified</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                            <SelectItem value="active">Active (last 30 days)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={onRefresh} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid gap-4">
                    {sortedUsers.map(user => (
                        <Card key={user.id} className="relative">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <Avatar>
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name)}`} />
                                            <AvatarFallback>{user.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                <div>
                                    <h3 className="text-lg font-semibold">{user.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                <Badge variant={user.is_verified ? "success" : "secondary"}>
                                    {user.is_verified ? "Verified" : "Unverified"}
                                </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleVerificationToggle(user)}>
                                                {user.is_verified ? "Unverify" : "Verify"} User
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onUserSelect(user)}>
                                                View Details
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Role</p>
                                        <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
                                    <div>
                                        <p className="text-sm font-medium">Status</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.is_banned ? 'Banned' : 'Active'}
                                        </p>
                </div>
            </div>
                                <div className="mt-4 grid grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Listings</p>
                                        <p className="text-lg">{user.total_listings}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Bookings</p>
                                        <p className="text-lg">{user.total_bookings}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Earnings</p>
                                        <p className="text-lg">${user.total_earnings.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Last Active</p>
                                        <p className="text-sm">{formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

const ActivityTab = ({ activities, loading }: { activities: AdminActivity[]; loading: boolean }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full" />
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity logged.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid gap-4">
                    {activities.map(activity => (
                        <Card key={activity.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div>
                                    <h3 className="text-lg font-semibold">{activity.admin_name} {activity.action}</h3>
                                    <p className="text-sm text-muted-foreground">{activity.target_name}</p>
                                </div>
                                <Badge variant="secondary">
                                    {activity.target_status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Details: {JSON.stringify(activity.details)}</p>
                                <p className="text-sm text-muted-foreground">Date: {format(new Date(activity.created_at), 'MM/dd/yyyy HH:mm')}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

const UserDetailsDialog = ({ user, activities, onClose, onRefresh }: {
    user: AdminUser;
    activities: UserActivity[];
    onClose: () => void;
    onRefresh: () => void;
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState<AdminUser | null>(null);
    const [userListings, setUserListings] = useState<AdminListing[]>([]);
    const [userBookings, setUserBookings] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                const userRes = await supabase.rpc('get_user_by_id', { p_user_id: user.id });
                if (userRes.error) throw userRes.error;
                setUserDetails(userRes.data);

                const listingsRes = await supabase.rpc('get_listings_by_owner_id', { p_owner_id: user.id });
                if (listingsRes.error) throw listingsRes.error;
                setUserListings(listingsRes.data);

                const bookingsRes = await supabase.rpc('get_bookings_by_user_id', { p_user_id: user.id });
                if (bookingsRes.error) throw bookingsRes.error;
                setUserBookings(bookingsRes.data);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error fetching user details',
                    description: error.message
                });
            } finally {
                setLoading(false);
            }
        };
        fetchUserDetails();
    }, [user.id, refreshTrigger]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    if (loading) {
        return (
            <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Loading User Details...</DialogTitle>
                </DialogHeader>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </DialogContent>
            </Dialog>
        );
    }

    if (!userDetails) return null;

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{userDetails.full_name}</DialogTitle>
                <DialogDescription>
                    User ID: {userDetails.id}
                </DialogDescription>
            </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                        <h3 className="text-lg font-semibold mb-4">User Details</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Email:</span>
                                <span className="text-sm text-muted-foreground">{userDetails.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Role:</span>
                                <span className="text-sm text-muted-foreground">{userDetails.role}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Verified:</span>
                                <Badge variant={userDetails.is_verified ? "success" : "secondary"}>
                                    {userDetails.is_verified ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Banned:</span>
                                <Badge variant={userDetails.is_banned ? "destructive" : "secondary"}>
                                    {userDetails.is_banned ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Listings:</span>
                                <span className="text-sm text-muted-foreground">{userDetails.total_listings}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Bookings:</span>
                                <span className="text-sm text-muted-foreground">{userDetails.total_bookings}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Earnings:</span>
                                <span className="text-sm text-muted-foreground">${userDetails.total_earnings.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Last Active:</span>
                                <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(userDetails.last_active), { addSuffix: true })}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold mt-8 mb-4">Recent Listings</h3>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-4">
                                {userListings.map(listing => (
                                    <Card key={listing.id}>
                                        <CardHeader className="py-2">
                                            <CardTitle className="text-sm">{listing.title}</CardTitle>
                                            <CardDescription className="text-xs">
                                                ${listing.price_per_day}/day • {listing.total_bookings} bookings
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                </div>

                <div>
                        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                        <ScrollArea className="h-[500px]">
                            <div className="space-y-4">
                            {activities.map((activity, index) => (
                                <Card key={index}>
                                        <CardHeader className="py-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm">{activity.activity_type}</CardTitle>
                                        <Badge variant="secondary">
                                                    {formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true })}
                                        </Badge>
                                            </div>
                                            <CardDescription className="text-xs">
                                                {JSON.stringify(activity.details)}
                                            </CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button onClick={handleRefresh}>Refresh</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
};

// Add a Reviews Tab component
const ReviewsTab = ({
    reviews,
    loading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortOrder,
    setSortOrder,
    sortField,
    setSortField,
    onRefresh
}: {
    reviews: AdminReview[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (order: 'asc' | 'desc') => void;
    sortField: string;
    setSortField: (field: string) => void;
    onRefresh: () => void;
}) => {
    const { toast } = useToast();
    const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);

    const handleDeleteReview = async (review: AdminReview) => {
        try {
            // Call your API to delete the review
            const { error } = await supabase
                .from('user_reviews')
                .delete()
                .eq('id', review.id);

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Review deleted successfully.'
            });

            onRefresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        }
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearchTerm = review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 review.reviewer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 review.listing_title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilterStatus = filterStatus === 'all' ||
                                   (filterStatus === 'high' && review.rating >= 4) ||
                                   (filterStatus === 'medium' && review.rating === 3) ||
                                   (filterStatus === 'low' && review.rating <= 2);
        return matchesSearchTerm && matchesFilterStatus;
    });

    const sortedReviews = [...filteredReviews].sort((a, b) => {
        const aValue = a[sortField as keyof AdminReview];
        const bValue = b[sortField as keyof AdminReview];
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[200px] w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Search reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm"
                    />
                    <Select onValueChange={(value) => setFilterStatus(value)} value={filterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by rating" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Ratings</SelectItem>
                            <SelectItem value="high">High (4-5)</SelectItem>
                            <SelectItem value="medium">Medium (3)</SelectItem>
                            <SelectItem value="low">Low (1-2)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={onRefresh} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid gap-4">
                    {sortedReviews.map(review => (
                        <Card key={review.id} className="relative">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex">
                                            {Array(5).fill(0).map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        <Badge variant={review.rating >= 4 ? 'success' : review.rating === 3 ? 'secondary' : 'destructive'}>
                                            {review.rating}/5
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-semibold mt-2">Review for {review.listing_title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleDeleteReview(review)}>
                                                Delete Review
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Reviewer</p>
                                        <p className="text-sm text-muted-foreground">{review.reviewer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Reviewee</p>
                                        <p className="text-sm text-muted-foreground">{review.reviewee_name}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Posted on {format(new Date(review.created_at), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

// Add a Reports Tab component
const ReportsTab = ({
    reports,
    loading,
    onRefresh
}: {
    reports: Report[];
    loading: boolean;
    onRefresh: () => void;
}) => {
    const { toast } = useToast();
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const handleResolveReport = async (report: Report, resolution: string) => {
        try {
            // Call your API to update the report status
            const { error } = await supabase
                .from('reports')
                .update({ status: resolution })
                .eq('id', report.id);

            if (error) throw error;

            toast({
                title: 'Success',
                description: `Report marked as ${resolution}.`
            });

            onRefresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        }
    };

    const filteredReports = reports.filter(report => {
        const matchesSearchTerm = report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 report.reported_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilterStatus = filterStatus === 'all' || report.status === filterStatus;
        return matchesSearchTerm && matchesFilterStatus;
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[200px] w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm"
                    />
                    <Select onValueChange={(value) => setFilterStatus(value)} value={filterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Reports</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={onRefresh} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid gap-4">
                    {filteredReports.length > 0 ? (
                        filteredReports.map(report => (
                            <Card key={report.id} className={`relative ${report.status === 'pending' ? 'border-yellow-500 border-2' : ''}`}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={
                                                report.status === 'pending' ? 'outline' :
                                                report.status === 'resolved' ? 'success' : 'secondary'
                                            }>
                                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                            </Badge>
                                            <Badge variant="outline">{report.report_type}</Badge>
                                        </div>
                                        <h3 className="text-lg font-semibold mt-2">Report against {report.reported_name}</h3>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium">Reason</p>
                                        <p className="text-sm text-muted-foreground">{report.reason}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Reporter</p>
                                            <p className="text-sm text-muted-foreground">{report.reporter_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Date</p>
                                            <p className="text-sm text-muted-foreground">{format(new Date(report.created_at), 'MMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                    {report.status === 'pending' && (
                                        <div className="mt-4 flex space-x-2">
                                            <Button 
                                                size="sm" 
                                                variant="default" 
                                                onClick={() => handleResolveReport(report, 'resolved')}
                                            >
                                                Resolve
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleResolveReport(report, 'dismissed')}
                                            >
                                                Dismiss
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Flag className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <h3 className="mt-4 text-lg font-semibold">No reports found</h3>
                            <p className="text-sm text-muted-foreground">There are no reports matching your filters.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

// Add MessagesTab component
const MessagesTab = ({
    messages,
    loading,
    searchTerm,
    setSearchTerm,
    onRefresh
}: {
    messages: AdminMessage[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onRefresh: () => void;
}) => {
    const { toast } = useToast();
    const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSendReply = async () => {
        if (!selectedMessage || !replyContent.trim()) return;
        
        try {
            const { data, error } = await supabase.rpc('send_message', {
                p_recipient_id: selectedMessage.sender_id,
                p_content: replyContent
            });

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Reply sent successfully.'
            });

            setReplyContent('');
            setIsDialogOpen(false);
            onRefresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        }
    };

    const filteredMessages = messages.filter(message => {
        return message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
               message.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               message.recipient_name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm"
                    />
                    <Button onClick={onRefresh} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid gap-4">
                    {filteredMessages.length > 0 ? (
                        filteredMessages.map(message => (
                            <Card key={message.id} className={`relative ${!message.is_read ? 'border-blue-500 border-l-4' : ''}`}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={message.is_read ? "secondary" : "default"}>
                                                {message.is_read ? "Read" : "Unread"}
                                            </Badge>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                        </div>
                                        <h3 className="text-lg font-semibold mt-2">
                                            From: {message.sender_name} → To: {message.recipient_name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                setSelectedMessage(message);
                                                setIsDialogOpen(true);
                                            }}
                                        >
                                            <Mail className="h-4 w-4 mr-2" />
                                            Reply
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{message.content}</p>
                                    {message.attachment_url && (
                                        <div className="mt-2">
                                            <a 
                                                href={message.attachment_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-500 flex items-center"
                                            >
                                                <PaperClip className="h-4 w-4 mr-1" />
                                                Attachment
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Mail className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <h3 className="mt-4 text-lg font-semibold">No messages found</h3>
                            <p className="text-sm text-muted-foreground">There are no messages matching your search.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {selectedMessage && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reply to {selectedMessage.sender_name}</DialogTitle>
                            <DialogDescription>
                                Original message: {selectedMessage.content}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid w-full gap-2">
                                <Textarea
                                    placeholder="Type your reply here..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    rows={5}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSendReply} disabled={!replyContent.trim()}>
                                <Send className="h-4 w-4 mr-2" />
                                Send Reply
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

// Add InboxTab component
const InboxTab = ({
    notifications,
    loading,
    onRefresh
}: {
    notifications: Notification[];
    loading: boolean;
    onRefresh: () => void;
}) => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationContent, setNotificationContent] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase.rpc('get_all_users_admin');
                if (error) throw error;
                setUsers(data);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message
                });
            }
        };
        fetchUsers();
    }, []);

    const handleSendNotification = async () => {
        if (!selectedUser || !notificationTitle.trim() || !notificationContent.trim()) return;
        
        try {
            const { data, error } = await supabase.rpc('send_system_notification', {
                p_user_id: selectedUser.id,
                p_title: notificationTitle,
                p_content: notificationContent
            });

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Notification sent successfully.'
            });

            setNotificationTitle('');
            setNotificationContent('');
            setSelectedUser(null);
            setIsDialogOpen(false);
            onRefresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearchTerm = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 notification.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilterType = filterType === 'all' || notification.type === filterType;
        return matchesSearchTerm && matchesFilterType;
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm"
                    />
                    <Select onValueChange={(value) => setFilterType(value)} value={filterType}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="message">Message</SelectItem>
                            <SelectItem value="booking">Booking</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={onRefresh} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Bell className="h-4 w-4 mr-2" />
                    Send Notification
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid gap-4">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map(notification => (
                            <Card key={notification.id} className={`relative ${!notification.is_read ? 'border-blue-500 border-l-4' : ''}`}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={getBadgeVariantForNotificationType(notification.type)}>
                                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                            </Badge>
                                            <Badge variant={notification.is_read ? "secondary" : "default"}>
                                                {notification.is_read ? "Read" : "Unread"}
                                            </Badge>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                        </div>
                                        <h3 className="text-lg font-semibold mt-2">{notification.title}</h3>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{notification.content}</p>
                                    {notification.action_link && (
                                        <div className="mt-2">
                                            <a 
                                                href={notification.action_link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-500"
                                            >
                                                View Details
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <h3 className="mt-4 text-lg font-semibold">No notifications found</h3>
                            <p className="text-sm text-muted-foreground">There are no notifications matching your filters.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send System Notification</DialogTitle>
                        <DialogDescription>
                            Send a notification to a user. This will appear in their inbox.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid w-full gap-2">
                            <Label htmlFor="user">Recipient</Label>
                            <Select onValueChange={(value) => {
                                const user = users.find(u => u.id === value);
                                setSelectedUser(user || null);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.full_name} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid w-full gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="Notification title"
                                value={notificationTitle}
                                onChange={(e) => setNotificationTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid w-full gap-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                placeholder="Notification content"
                                value={notificationContent}
                                onChange={(e) => setNotificationContent(e.target.value)}
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleSendNotification} 
                            disabled={!selectedUser || !notificationTitle.trim() || !notificationContent.trim()}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send Notification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Helper function for notification badge variants
const getBadgeVariantForNotificationType = (type: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (type) {
        case 'message':
            return 'default';
        case 'booking':
            return 'success';
        case 'review':
            return 'secondary';
        case 'system':
            return 'outline';
        default:
            return 'default';
    }
};

const AdminDashboardPage = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [listings, setListings] = useState<AdminListing[]>([]);
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [messages, setMessages] = useState<AdminMessage[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activities, setActivities] = useState<AdminActivity[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [sortField, setSortField] = useState('created_at');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Check if user is admin
    useEffect(() => {
        if (profile?.role !== 'admin') {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'You do not have permission to access the admin dashboard.'
            });
            window.location.href = '/';
        }
    }, [profile]);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all reviews for average rating calculation
            const { data: allReviews, error: allReviewsError } = await supabase
                .from('reviews')
                .select('rating');

            const actualAverageRating =
                allReviews && allReviews.length > 0
                    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
                    : 0;

            // Create an array to hold all the promises
            const promises = [];
            const results: any = {};

            // Fetch basic stats with proper revenue calculation
            promises.push(
                Promise.all([
                    supabase.from('profiles').select('id', { count: 'exact' }),
                    supabase.from('listings').select('id', { count: 'exact' }),
                    supabase.from('bookings').select('id', { count: 'exact' }),
                    supabase.from('user_reviews').select('id', { count: 'exact' }),
                    // Get actual booking revenue instead of listing prices
                    supabase.from('bookings').select('total_price, created_at'),
                    supabase.from('profiles').select('created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
                    supabase.from('listings').select('created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
                    supabase.from('bookings').select('created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
                    // Get recent bookings for revenue calculation
                    supabase.from('bookings').select('total_price, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
                ]).then(([usersCount, listingsCount, bookingsCount, reviewsCount, allBookings, recentUsers, recentListings, recentBookings, recentBookingsForRevenue]) => {
                    // Calculate actual revenue from completed bookings
                    const totalRevenue = allBookings.data?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
                    const recentRevenue = recentBookingsForRevenue.data?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

                    results.stats = {
                        total_users: usersCount.count || 0,
                        total_listings: listingsCount.count || 0,
                        total_bookings: bookingsCount.count || 0,
                        total_revenue: totalRevenue,
                        active_users_last_30_days: recentUsers.count || 0,
                        new_users_last_30_days: recentUsers.count || 0,
                        new_listings_last_30_days: recentListings.count || 0,
                        completed_bookings_last_30_days: recentBookings.count || 0,
                        platform_earnings_last_30_days: recentRevenue * 0.1, // 10% platform fee
                        average_listing_rating: actualAverageRating,
                        new_users_last_7_days: 0,
                        bookings_last_7_days: 0,
                        revenue_last_7_days: 0,
                        revenue_last_30_days: recentRevenue,
                        pending_listings: 0, // All listings are instantly available
                        active_listings: listingsCount.count || 0,
                        inactive_listings: 0,
                        pending_reports: 0,
                        total_reviews: reviewsCount.count || 0,
                        reviews_last_30_days: 0
                    };
                }).catch(err => {
                    console.error('Exception fetching stats:', err);
                    results.stats = null;
                })
            );

            // Fetch users
            promises.push(
                supabase
                    .from('profiles')
                    .select(`
                        id,
                        created_at,
                        full_name,
                        role,
                        is_banned,
                        is_verified,
                        stripe_connect_id,
                        avatar_url
                    `)
                    .order('created_at', { ascending: false })
                    .then(async (res) => {
                        if (res.error) {
                            console.error('Error fetching users:', res.error);
                            results.users = [];
                        } else {
                            // Get additional user stats
                            const usersWithStats = await Promise.all((res.data || []).map(async (user) => {
                                // Get user's listings count
                                const { count: listingsCount } = await supabase
                                    .from('listings')
                                    .select('id', { count: 'exact' })
                                    .eq('user_id', user.id);

                                // Get user's bookings count (as renter)
                                const { count: bookingsCount } = await supabase
                                    .from('bookings')
                                    .select('id', { count: 'exact' })
                                    .eq('renter_id', user.id);

                                // Calculate total earnings from actual bookings
                                const { data: userBookings } = await supabase
                                    .from('bookings')
                                    .select('total_price')
                                    .eq('listing_id', (await supabase.from('listings').select('id').eq('user_id', user.id)).data?.map(l => l.id) || []);

                                const totalEarnings = userBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

                                return {
                                    id: user.id,
                                    created_at: user.created_at,
                                    full_name: user.full_name || 'Unknown',
                                    email: 'N/A', // Email not stored in profiles table
                                    role: user.role || 'user',
                                    is_banned: user.is_banned || false,
                                    is_verified: user.is_verified || false,
                                    stripe_connect_id: user.stripe_connect_id,
                                    total_listings: listingsCount || 0,
                                    total_bookings: bookingsCount || 0,
                                    total_earnings: totalEarnings,
                                    last_active: user.created_at // Placeholder
                                };
                            }));
                            results.users = usersWithStats;
                        }
                    })
                    .catch(err => {
                        console.error('Exception fetching users:', err);
                        results.users = [];
                    })
            );

            // Fetch listings with owner information
            promises.push(
                supabase
                    .from('listings')
                    .select(`
                        id,
                        created_at,
                        title,
                        description,
                        price_per_day,
                        location,
                        status,
                        is_verified,
                        view_count,
                        category,
                        user_id,
                        image_urls
                    `)
                    .order('created_at', { ascending: false })
                    .then(async (res) => {
                        if (res.error) {
                            console.error('Error fetching listings:', res.error);
                            results.listings = [];
                        } else {
                            // Get owner information for each listing
                            const listingsWithOwners = await Promise.all((res.data || []).map(async (listing) => {
                                // Get owner profile
                                const { data: profileData } = await supabase
                                    .from('profiles')
                                    .select('full_name')
                                    .eq('id', listing.user_id)
                                    .single();

                                // Get reviews for rating calculation
                                const { data: reviews } = await supabase
                                    .from('user_reviews')
                                    .select('rating')
                                    .eq('listing_id', listing.id);

                                const averageRating = reviews && reviews.length > 0 
                                    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                                    : 0;

                                // Get bookings count
                                const { count: bookingsCount } = await supabase
                                    .from('bookings')
                                    .select('id', { count: 'exact' })
                                    .eq('listing_id', listing.id);

                                // Calculate total revenue from actual bookings
                                const { data: listingBookings } = await supabase
                                    .from('bookings')
                                    .select('total_price')
                                    .eq('listing_id', listing.id);

                                const totalRevenue = listingBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

                                return {
                                    id: listing.id,
                                    created_at: listing.created_at,
                                    title: listing.title,
                                    description: listing.description,
                                    price_per_day: listing.price_per_day,
                                    status: listing.status,
                                    is_verified: listing.is_verified,
                                    owner_id: listing.user_id,
                                    owner_name: profileData?.full_name || 'Unknown',
                                    owner_email: 'N/A', // Email not stored in profiles table
                                    total_bookings: bookingsCount || 0,
                                    total_revenue: totalRevenue,
                                    average_rating: averageRating,
                                    view_count: listing.view_count || 0,
                                    location_text: listing.location,
                                    image_urls: listing.image_urls || []
                                };
                            }));
                            results.listings = listingsWithOwners;
                        }
                    })
                    .catch(err => {
                        console.error('Exception fetching listings:', err);
                        results.listings = [];
                    })
            );

            // Fetch reviews
            promises.push(
                supabase
                    .from('user_reviews')
                    .select(`
                        id,
                        created_at,
                        rating,
                        review_text,
                        listing_id,
                        reviewer_id,
                        reviewee_id
                    `)
                    .order('created_at', { ascending: false })
                    .then(async (res) => {
                        if (res.error) {
                            console.error('Error fetching reviews:', res.error);
                            results.reviews = [];
                        } else {
                            // Get additional information for each review
                            const reviewsWithDetails = await Promise.all((res.data || []).map(async (review) => {
                                // Get listing title
                                const { data: listingData } = await supabase
                                    .from('listings')
                                    .select('title')
                                    .eq('id', review.listing_id)
                                    .single();

                                // Get reviewer name
                                const { data: reviewerData } = await supabase
                                    .from('profiles')
                                    .select('full_name')
                                    .eq('id', review.reviewer_id)
                                    .single();

                                // Get reviewee name
                                const { data: revieweeData } = await supabase
                                    .from('profiles')
                                    .select('full_name')
                                    .eq('id', review.reviewee_id)
                                    .single();

                                return {
                                    id: review.id,
                                    created_at: review.created_at,
                                    rating: review.rating,
                                    comment: review.review_text,
                                    listing_id: review.listing_id,
                                    listing_title: listingData?.title || 'Unknown',
                                    reviewer_id: review.reviewer_id,
                                    reviewer_name: reviewerData?.full_name || 'Unknown',
                                    reviewee_id: review.reviewee_id,
                                    reviewee_name: revieweeData?.full_name || 'Unknown'
                                };
                            }));
                            results.reviews = reviewsWithDetails;
                        }
                    })
                    .catch(err => {
                        console.error('Exception fetching reviews:', err);
                        results.reviews = [];
                    })
            );

            // Fetch messages (simplified for current schema)
            promises.push(
                supabase
                    .from('messages')
                    .select(`
                        id,
                        created_at,
                        sender_id,
                        content,
                        conversation_id
                    `)
                    .order('created_at', { ascending: false })
                    .then(async (res) => {
                        if (res.error) {
                            console.error('Error fetching messages:', res.error);
                            results.messages = [];
                        } else {
                            // Get sender names and conversation details
                            const messagesWithNames = await Promise.all((res.data || []).map(async (message) => {
                                // Get sender name
                                const { data: senderData } = await supabase
                                    .from('profiles')
                                    .select('full_name')
                                    .eq('id', message.sender_id)
                                    .single();

                                // Get conversation details to find recipient
                                const { data: conversationData } = await supabase
                                    .from('conversations')
                                    .select('owner_id, renter_id')
                                    .eq('id', message.conversation_id)
                                    .single();

                                // Determine recipient (the other person in the conversation)
                                const recipientId = conversationData?.owner_id === message.sender_id 
                                    ? conversationData.renter_id 
                                    : conversationData?.owner_id;

                                // Get recipient name
                                const { data: recipientData } = await supabase
                                    .from('profiles')
                                    .select('full_name')
                                    .eq('id', recipientId)
                                    .single();

                                return {
                                    id: message.id,
                                    created_at: message.created_at,
                                    sender_id: message.sender_id,
                                    sender_name: senderData?.full_name || 'Unknown',
                                    recipient_id: recipientId,
                                    recipient_name: recipientData?.full_name || 'Unknown',
                                    content: message.content,
                                    is_read: false, // Default value since this field doesn't exist
                                    attachment_url: null // Default value since this field doesn't exist
                                };
                            }));
                            results.messages = messagesWithNames;
                        }
                    })
                    .catch(err => {
                        console.error('Exception fetching messages:', err);
                        results.messages = [];
                    })
            );

            // Fetch activities (placeholder - you can implement this later)
            promises.push(
                Promise.resolve().then(() => {
                    results.activities = [];
                })
            );

            // Fetch reports (placeholder - you can implement this later)
            promises.push(
                Promise.resolve().then(() => {
                    results.reports = [];
                })
            );

            // Fetch notifications (placeholder - you can implement this later)
            promises.push(
                Promise.resolve().then(() => {
                    results.notifications = [];
                })
            );

            // Wait for all promises to resolve
            await Promise.all(promises);

            // Update state with the results
            setStats(results.stats);
            setUsers(results.users);
            setListings(results.listings);
            setReviews(results.reviews);
            setMessages(results.messages);
            setReports(results.reports);
            setNotifications(results.notifications);
            setActivities(results.activities);

        } catch (error: any) {
            console.error('Global error in fetchDashboardData:', error);
            toast({
                variant: 'destructive',
                title: 'Error fetching dashboard data',
                description: 'Some data might be unavailable. Please try refreshing.'
            });
            
            // Set default values to prevent UI errors
            setStats(null);
            setUsers([]);
            setListings([]);
            setReviews([]);
            setMessages([]);
            setReports([]);
            setNotifications([]);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData, refreshTrigger]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <PageTransition>
            <div className="container mx-auto py-8">
                <AnimatedSection direction="down" className="mb-8">
                    <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage your platform and monitor activity</p>
                    </div>
                        <Button onClick={handleRefresh} variant="outline" size="icon" className="animate-pulse-slow">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                </AnimatedSection>

                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <AnimatedSection direction="up">
                    <TabsList className="grid grid-cols-8 w-full">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <BarChart2 className="h-4 w-4" />
                            <span>Overview</span>
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Users</span>
                        </TabsTrigger>
                        <TabsTrigger value="listings" className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4" />
                            <span>Listings</span>
                        </TabsTrigger>
                        <TabsTrigger value="reviews" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>Reviews</span>
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            <span>Reports</span>
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>Messages</span>
                        </TabsTrigger>
                        <TabsTrigger value="inbox" className="flex items-center gap-2">
                            <Inbox className="h-4 w-4" />
                            <span>Inbox</span>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>Activity</span>
                        </TabsTrigger>
                    </TabsList>
                    </AnimatedSection>

                    <TabsContent value="overview" className="space-y-6">
                        <OverviewTab stats={stats} loading={loading} />
                    </TabsContent>

                    <TabsContent value="users" className="space-y-6">
                        <UsersTab 
                            users={users} 
                            loading={loading}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            sortField={sortField}
                            setSortField={setSortField}
                            onRefresh={handleRefresh}
                            onUserSelect={setSelectedUser}
                        />
                    </TabsContent>

                    <TabsContent value="listings" className="space-y-6">
                        <ListingsTab 
                            listings={listings}
                            loading={loading}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            sortField={sortField}
                            setSortField={setSortField}
                            onRefresh={handleRefresh}
                        />
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                        <ReviewsTab 
                            reviews={reviews}
                            loading={loading}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            sortField={sortField}
                            setSortField={setSortField}
                            onRefresh={handleRefresh}
                        />
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-6">
                        <ReportsTab 
                            reports={reports}
                            loading={loading}
                            onRefresh={handleRefresh}
                        />
                    </TabsContent>

                    <TabsContent value="messages" className="space-y-6">
                        <MessagesTab 
                            messages={messages}
                            loading={loading}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            onRefresh={handleRefresh}
                        />
                    </TabsContent>

                    <TabsContent value="inbox" className="space-y-6">
                        <InboxTab 
                            notifications={notifications}
                            loading={loading}
                            onRefresh={handleRefresh}
                        />
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-6">
                        <ActivityTab 
                            activities={activities}
                            loading={loading}
                        />
                    </TabsContent>
                </Tabs>

                {selectedUser && (
                    <UserDetailsDialog 
                        user={selectedUser}
                        activities={userActivities}
                        onClose={() => setSelectedUser(null)}
                        onRefresh={handleRefresh}
                    />
                )}
            </div>
        </PageTransition>
    );
};

export default AdminDashboardPage; 