import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, List, BarChart2, Shield, Settings, Activity, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { UserManagementTab } from './UserManagementTab';
import { ListingsManagementTab } from './ListingsManagementTab';
import { ReviewsManagementTab } from './ReviewsManagementTab';
import { SettingsManagementTab } from './SettingsManagementTab';
import { Link } from 'react-router-dom';
import { useToast } from '../../hooks/use-toast';

type Tab = 'overview' | 'users' | 'listings' | 'reviews' | 'settings';

type Stats = {
    total_users: number;
    total_listings: number;
    pending_listings_count: number;
    reported_listings_count: number;
    total_reviews: number;
}

type ActivityLog = {
    id: string;
    created_at: string;
    action: string;
    target_type: string;
    actor_name: string;
    actor_id: string;
}

const AdminDashboard = () => {
    const { profile, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const { toast } = useToast();
    
    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewPane />;
            case 'users': return <UserManagementTab />;
            case 'listings': return <ListingsManagementTab />;
            case 'reviews': return <ReviewsManagementTab />;
            case 'settings': return <SettingsManagementTab />;
            default: return null;
        }
    };

    if (profile?.role !== 'admin') {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-3xl font-bold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20">
            <div className="container mx-auto py-10 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    <main className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.25 }}
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
};

// Sidebar
const AdminSidebar = ({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void; }) => {
    const NavItem = ({ tab, icon: Icon, children }: { tab: Tab; icon: React.ElementType, children: React.ReactNode }) => (
        <button
          onClick={() => setActiveTab(tab)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 font-medium
            ${activeTab === tab 
              ? 'bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground shadow-lg scale-[1.03]' 
              : 'hover:bg-muted/60 hover:text-primary text-muted-foreground'}
          `}
          style={{ boxShadow: activeTab === tab ? '0 4px 24px 0 rgba(79,70,229,0.10)' : undefined }}
        >
          <Icon size={20} className={activeTab === tab ? 'text-primary-foreground' : 'text-primary'} />
          <span className="relative z-10">{children}</span>
        </button>
      );

    return (
        <aside className="lg:col-span-3 space-y-2 lg:sticky top-24 h-fit">
            <NavItem tab="overview" icon={BarChart2}>Overview</NavItem>
            <NavItem tab="users" icon={User}>Users</NavItem>
            <NavItem tab="listings" icon={List}>Listings</NavItem>
            <NavItem tab="reviews" icon={MessageSquare}>Reviews</NavItem>
            <NavItem tab="settings" icon={Settings}>Settings</NavItem>
        </aside>
    );
};

// Overview Pane
const OverviewPane = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Since we don't have a single RPC for all stats, we'll call them individually.
                const [activityRes, usersRes, listingsRes, reportedRes, reviewsRes] = await Promise.all([
                     supabase.rpc('get_recent_admin_activity', { p_limit: 5 }),
                     supabase.rpc('get_all_users_admin', {
                         p_search_term: '',
                         p_filter_by_role: 'all',
                         p_filter_by_status: 'all'
                     }),
                     supabase.rpc('get_all_listings_admin', { p_status_filter: 'all' }),
                     supabase.rpc('get_all_listings_admin', { p_status_filter: 'reported' }),
                     supabase.rpc('get_all_reviews_admin', { p_search_term: '' }),
                ]);
    
                if (activityRes.error) throw activityRes.error;
                if (usersRes.error) throw usersRes.error;
                if (listingsRes.error) throw listingsRes.error;
                if (reportedRes.error) throw reportedRes.error;
                if (reviewsRes.error) throw reviewsRes.error;
    
                setActivity(activityRes.data || []);
                setStats({
                    total_users: usersRes.data.length,
                    total_listings: listingsRes.data.length,
                    pending_listings_count: listingsRes.data.filter((l: any) => l.status === 'pending').length,
                    reported_listings_count: reportedRes.data.length,
                    total_reviews: reviewsRes.data.length,
                });
    
            } catch (error: any) {
                console.error("Error fetching admin data:", error);
                toast({
                    title: 'Error Fetching Admin Data',
                    description: error.message,
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const StatCard = ({ icon: Icon, title, value, isLoading, color = 'text-primary' }: { icon: React.ElementType, title: string, value?: number, isLoading: boolean, color?: string }) => (
        <div className="bg-card/70 backdrop-blur-2xl border border-border/10 shadow-xl p-6 rounded-2xl flex items-center gap-6 transition-all hover:border-primary/30 hover:-translate-y-1 hover:shadow-primary/20">
            <div className={`p-4 rounded-full bg-gradient-to-br from-primary/20 to-transparent ${color} shadow-md`}>
                <Icon className="h-7 w-7" />
            </div>
            <div>
                <dt className="text-sm font-medium text-muted-foreground">{title}</dt>
                {isLoading ? (
                    <dd className="h-8 w-16 bg-muted/50 rounded-md animate-pulse mt-1"></dd>
                ) : (
                    <dd className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">{value ?? 0}</dd>
                )}
            </div>
        </div>
    );
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Admin Overview</h1>
                <p className="text-muted-foreground mt-2">A high-level view of your platform's activity.</p>
            </div>
            
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={User} title="Total Users" value={stats?.total_users} isLoading={loading} />
                <StatCard icon={List} title="Total Listings" value={stats?.total_listings} isLoading={loading} />
                <StatCard icon={MessageSquare} title="Total Reviews" value={stats?.total_reviews} isLoading={loading} />
                <StatCard icon={Clock} title="Pending Listings" value={stats?.pending_listings_count} isLoading={loading} color="text-amber-500"/>
                <StatCard icon={AlertTriangle} title="Reported Listings" value={stats?.reported_listings_count} isLoading={loading} color="text-destructive"/>
            </dl>

            <div className="bg-card/70 backdrop-blur-2xl border border-border/10 shadow-xl rounded-2xl">
                 <div className="p-6">
                    <h3 className="text-xl font-semibold flex items-center gap-3">
                        <Activity className="text-primary"/>
                        Recent Admin Activity
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">A log of recent administrative actions.</p>
                </div>
                <div className="flow-root">
                    <ul role="list" className="p-6 pt-0 divide-y divide-border/10">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <li key={i} className="flex gap-4 py-4"><div className="h-10 w-10 rounded-full bg-muted/50 animate-pulse"></div><div className="space-y-2 flex-1"><div className="h-4 w-3/4 bg-muted/50 animate-pulse rounded"></div><div className="h-3 w-1/2 bg-muted/50 animate-pulse rounded"></div></div></li>
                            ))
                        ) : activity.length > 0 ? (
                            activity.map((item, index) => (
                                <motion.li 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="relative flex gap-x-4 py-4 hover:bg-muted/30 rounded-xl transition-colors"
                                >
                                   <div className="absolute left-5 top-4 -ml-px h-full w-0.5 bg-border/40 -z-10" />
                                    <div className="relative flex h-10 w-10 flex-none items-center justify-center bg-card rounded-full ring-1 ring-border shadow-sm">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-auto py-1.5">
                                        <p className="text-sm leading-6 text-foreground">
                                            <Link to={`/profile/${item.actor_id}`} className="font-medium hover:underline text-primary">{item.actor_name}</Link>
                                            <span className="text-muted-foreground"> {item.action.replace(/_/g, ' ')}</span>
                                        </p>
                                        <time dateTime={item.created_at} className="mt-1 flex-none text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                        </time>
                                    </div>
                                </motion.li>
                            ))
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <Activity className="mx-auto h-12 w-12 mb-4 opacity-50"/>
                                <h3 className="text-lg font-medium text-foreground">No Recent Activity</h3>
                                <p className="text-sm">Admin actions will be logged here.</p>
                            </div>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};


export default AdminDashboard; 