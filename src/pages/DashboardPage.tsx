import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, List, ShoppingBag, Settings, LogOut, Star, MoreVertical, CreditCard, ExternalLink, PlusCircle, Edit, Trash, Check, Eye, Shield, CalendarCheck, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { useToast } from '../hooks/use-toast';
import LeaveReviewModal from '../components/ui/LeaveReviewModal';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import PayoutsPane from '../components/dashboard/PayoutsPane';
import { ProfileSettingsPane } from '../components/dashboard/ProfileSettingsPane';
import BookingRequestsPane from '../components/dashboard/BookingRequestsPane';
import { Skeleton } from '../components/ui/skeleton';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import UnavailableDatesPane from '../components/dashboard/UnavailableDatesPane';

// Type Definitions
type Tab = 'profile' | 'my-listings' | 'my-rentals' | 'booking-requests' | 'payouts' | 'settings' | 'unavailable-dates';

type Profile = {
  id: string;
  full_name?: string;
  avatar_url?: string;
  stripe_connect_id?: string;
  role?: string;
  bio?: string;
  banner_url?: string;
};

// Message type definition (updated to match notifications structure)
type Message = {
    id: string;
    created_at: string;
    type: string;
    title: string;
    content: string;
    is_read: boolean;
    action_link?: string | null;
    related_id?: string | null;
};

type Listing = {
  id: string;
  title: string;
  image_urls: string[];
  price_per_day: number;
  view_count: number;
  bookings: { status: string; total_price: number }[];
};

type Rental = {
  id: string;
  start_date: string;
  end_date: string;
  status: 'confirmed' | 'pending' | 'denied';
  listings: {
    id: string;
    title: string;
    user_id: string;
    image_urls: string[];
    profiles: {
      full_name: string;
    };
  };
  reviews: { id: string }[];
};

// Main Dashboard Component
const DashboardPage = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [data, setData] = useState<{ listings: Listing[]; rentals: Rental[]; messages: Message[] }>({
    listings: [],
    rentals: [],
    messages: []
  });
  const [loadingData, setLoadingData] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const tabFromState = location.state?.tab;
    if (tabFromState && ['profile', 'my-listings', 'my-rentals', 'booking-requests', 'payouts', 'settings', 'unavailable-dates'].includes(tabFromState)) {
        setActiveTab(tabFromState);
    }
  }, [location.state]);

  useEffect(() => {
    // Sync tab with URL query parameters for shareable links
    const params = new URLSearchParams(search);
    const tab = params.get('tab') as Tab;
    if (tab && ['profile', 'my-listings', 'my-rentals', 'booking-requests', 'payouts', 'settings', 'unavailable-dates'].includes(tab)) {
        setActiveTab(tab);
    }
  }, [search]);

  const handleSetTab = (tab: Tab) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  }

  const fetchData = useCallback(async () => {
    if (!profile || !profile.id) return;
    setLoadingData(true);
    try {
        const [listingsRes, rentalsRes, notificationsRes] = await Promise.all([
            supabase.from('listings').select('*, bookings(status, total_price)').eq('user_id', profile.id),
            supabase.from('bookings').select('*, listings:listings!inner(id, title, user_id, image_urls, profiles:profiles!inner(full_name)), reviews!left(id)').eq('renter_id', profile.id),
            supabase.from('notifications').select('id, created_at, type, title, content, is_read')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(5)
        ]);

        if (listingsRes.error) throw listingsRes.error;
        if (rentalsRes.error) throw rentalsRes.error;
        if (notificationsRes.error) throw notificationsRes.error;

        // Update the Message type to match the notifications data structure
        setData({
            listings: (listingsRes.data as Listing[]) || [],
            rentals: (rentalsRes.data as any) || [],
            messages: (notificationsRes.data as any) || [],
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    } finally {
        setLoadingData(false);
    }
}, [profile]);

  const fetchPendingRequests = useCallback(async () => {
    if (!profile || !profile.id) return;
    
    try {
      // Get all listings owned by the user
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', profile.id);
      
      if (!listings || listings.length === 0) {
        setPendingRequestsCount(0);
        return;
      }
      
      const listingIds = listings.map(listing => listing.id);
      
      // Count pending booking requests
      const { count, error } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .in('listing_id', listingIds)
        .eq('approval_status', 'pending');
      
      if (error) throw error;
      
      setPendingRequestsCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
        fetchData();
        fetchPendingRequests();
    } else if (!authLoading) {
        setLoadingData(false);
    }
  }, [profile, authLoading, fetchData, fetchPendingRequests]);

  if (authLoading) {
    return <div className="container mx-auto py-10 px-4"><DashboardSkeleton /></div>;
  }

  if (!profile) {
    return (
        <div className="container mx-auto py-10 px-4 text-center">
            <h1 className="text-2xl font-bold">Please log in</h1>
            <p className="text-muted-foreground">You need to be logged in to view your dashboard.</p>
            <Button asChild className="mt-4"><Link to="/auth">Log In</Link></Button>
        </div>
    );
  }

  const renderContent = () => {
    if (loadingData) {
        return <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
        </div>
    }
    
    switch (activeTab) {
      case 'profile':
        return <ProfilePane profile={profile} listings={data.listings} rentals={data.rentals} messages={data.messages} />;
      case 'my-listings':
        return <MyListingsPane listings={data.listings} fetchListings={fetchData} />;
      case 'my-rentals':
        return <MyRentalsPane rentals={data.rentals} fetchRentals={fetchData} />;
      case 'booking-requests':
        return <BookingRequestsPane />;
      case 'payouts':
        return <PayoutsPane />;
      case 'settings':
        return <ProfileSettingsPane />;
      case 'unavailable-dates':
        return data.listings.length > 0 ? (
          <UnavailableDatesPane listingId={data.listings[0].id} />
        ) : (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">No Listings Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to create a listing first to manage unavailable dates.
            </p>
            <Button asChild>
              <Link to="/list-item">Create Your First Listing</Link>
            </Button>
          </div>
        );
      default:
          return <ProfilePane profile={profile} listings={data.listings} rentals={data.rentals} messages={data.messages} />;
    }
  };

  return (
    <AnimatedSection>
        <div className="container mx-auto py-10 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <DashboardSidebar 
                  activeTab={activeTab} 
                  setActiveTab={handleSetTab} 
                  pendingRequestsCount={pendingRequestsCount}
                />
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
    </AnimatedSection>
  );
};

// Sidebar
const DashboardSidebar = ({ 
  activeTab, 
  setActiveTab,
  pendingRequestsCount = 0
}: { 
  activeTab: Tab; 
  setActiveTab: (tab: Tab) => void;
  pendingRequestsCount?: number;
}) => {
    const { profile, user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };
    
    const NavItem = ({ tab, icon: Icon, children, disabled, badge }: { tab: Tab; icon: React.ElementType, children: React.ReactNode, disabled?: boolean, badge?: number }) => (
        <button
          onClick={() => !disabled && setActiveTab(tab)}
          disabled={disabled}
          className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200',
              activeTab === tab 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Icon size={20} />
          <span className="font-medium">{children}</span>
          {typeof badge === 'number' && badge > 0 && (
            <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0">
              {badge}
            </Badge>
          )}
        </button>
      );

    return (
        <aside className="lg:col-span-3 space-y-6 lg:sticky top-24 h-fit">
            <Card className="overflow-hidden shadow-lg border-border/10">
                <div className="p-5 flex flex-col items-center text-center bg-gradient-to-br from-card to-muted/20">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-background/20 ring-4 ring-primary/20">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                        <AvatarFallback className="text-3xl">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                    <p className="text-sm text-muted-foreground">Joined {format(new Date(user?.created_at || Date.now()), 'MMMM yyyy')}</p>
                    {profile?.role === 'admin' && <Badge className="mt-3 bg-destructive/10 text-destructive border-destructive/20"><Shield size={12} className="mr-1.5"/>Admin</Badge>}
                </div>
                <nav className="p-3">
                    <NavItem tab="profile" icon={User}>Dashboard</NavItem>
                    <NavItem tab="my-listings" icon={List}>My Listings</NavItem>
                    <NavItem tab="my-rentals" icon={ShoppingBag}>My Rentals</NavItem>
                    <NavItem tab="booking-requests" icon={CalendarCheck} badge={pendingRequestsCount}>Booking Requests</NavItem>
                    <NavItem tab="unavailable-dates" icon={CalendarCheck}>Unavailable Dates</NavItem>
                    <NavItem tab="payouts" icon={CreditCard}>Payouts</NavItem>
                    <NavItem tab="settings" icon={Settings}>Settings</NavItem>
                    <div className="px-4 py-2 my-2 border-t border-border/10" />
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-destructive/80 hover:bg-destructive/10 hover:text-destructive font-medium transition-colors">
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </nav>
            </Card>
        </aside>
    );
};

// Profile Pane
const StatCard = ({
  icon: Icon,
  title,
  value,
  isLoading,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  isLoading: boolean;
}) => (
    <Card className="hover:border-primary/50 hover:shadow-lg transition-all transform hover:-translate-y-1 duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const ProfilePane = ({ profile, listings, rentals, messages }: { profile: Profile; listings: Listing[]; rentals: Rental[]; messages: Message[] }) => {
    const totalEarnings = listings.reduce((acc, listing) => acc + (listing.bookings?.reduce((sum, b) => b.status === 'confirmed' ? sum + b.total_price : sum, 0) || 0), 0) * 0.97;
    const totalViews = listings.reduce((acc, listing) => acc + (listing.view_count || 0), 0);

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-4xl font-bold tracking-tight">Welcome back, {profile.full_name?.split(' ')[0]}!</h1>
                <p className="text-muted-foreground mt-2">Here's a snapshot of your activity on Rentify.</p>
            </motion.div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard icon={List} title="Total Listings" value={listings.length} isLoading={false} />
                <StatCard icon={CreditCard} title="Total Earnings (est.)" value={`$${totalEarnings.toFixed(2)}`} isLoading={false} />
                <StatCard icon={Eye} title="Total Views" value={totalViews} isLoading={false} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <Button asChild>
                            <Link to="/list-item">
                                <PlusCircle size={16} className="mr-2"/>
                                List a New Item
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                             <Link to={`/profile/${profile.id}`}>
                                <User size={16} className="mr-2"/>
                                View Public Profile
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Updates on your listings and rentals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Recent Notifications</h4>
                            <div className="space-y-2">
                                {messages.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                                ) : (
                                    messages.slice(0, 3).map(message => (
                                    <div key={message.id} className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                                {!message.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium truncate">{message.title}</p>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                    ))
                                )}
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                <Link to="/inbox">View All Notifications</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// My Listings Pane
const MyListingsPane = ({ listings, fetchListings }: { listings: Listing[]; fetchListings: () => void }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [selectedListing, setSelectedListing] = useState<string | null>(null);
    const [showUnavailableDates, setShowUnavailableDates] = useState(false);

    const handleDelete = async (listingId: string) => {
        const { data: listingData } = await supabase.from('listings').select('image_urls').eq('id', listingId).single();
        const { error } = await supabase.from('listings').delete().eq('id', listingId);

        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting listing', description: error.message });
        } else {
            if (listingData?.image_urls && listingData.image_urls.length > 0) {
                const filePaths = listingData.image_urls.map((url: string) => url.substring(url.lastIndexOf('/') + 1));
                await supabase.storage.from('listing-images').remove(filePaths);
            }
            toast({ title: 'Listing deleted successfully' });
            fetchListings();
        }
    };

    const handleManageAvailability = (listingId: string) => {
        setSelectedListing(listingId);
        setShowUnavailableDates(true);
    };
    
    if (showUnavailableDates && selectedListing) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            setShowUnavailableDates(false);
                            setSelectedListing(null);
                        }}
                        className="mb-4"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Listings
                    </Button>
                </div>
                
                <UnavailableDatesPane listingId={selectedListing} />
            </div>
        );
    }
    
    return (
        <Card className="shadow-lg border-border/10">
            <CardHeader className="flex flex-row justify-between items-center">
                <div><CardTitle className="text-2xl">My Listings</CardTitle><CardDescription>Manage your items available for rent.</CardDescription></div>
                <Button asChild><Link to="/list-item"><PlusCircle size={16} className="mr-2"/>New Listing</Link></Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <AnimatePresence>
                {listings.length > 0 ? listings.map(listing => (
                    <motion.div 
                        key={listing.id} 
                        layout
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}
                        className="border rounded-lg p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group"
                    >
                        <img src={listing.image_urls?.[0]} alt={listing.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-grow">
                            <h4 className="font-semibold text-lg">{listing.title}</h4>
                            <p className="text-sm text-muted-foreground">${listing.price_per_day}/day</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <Eye size={14} /> <span>{listing.view_count || 0} views</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/listings/${listing.id}`)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Listing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/listings/${listing.id}/edit`)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Listing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleManageAvailability(listing.id)}>
                                        <CalendarCheck className="mr-2 h-4 w-4" />
                                        Manage Availability
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete Listing
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your listing and all associated data.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(listing.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </motion.div>
                )) : (
                    <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
                        <h3 className="text-xl font-semibold">You haven't listed any items yet.</h3>
                        <p className="text-muted-foreground mt-2 mb-4">Ready to start earning? List your first item today!</p>
                        <Button asChild>
                            <Link to="/list-item">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                List Your First Item
                            </Link>
                        </Button>
                    </div>
                )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

// My Rentals Pane
const MyRentalsPane = ({ rentals, fetchRentals }: { rentals: Rental[], fetchRentals: () => void }) => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

    const handleOpenReview = (rental: Rental) => {
        setSelectedRental(rental);
        setShowReviewModal(true);
    };

    const handleReviewSubmitted = () => {
        setShowReviewModal(false);
        setSelectedRental(null);
        fetchRentals();
        toast({ title: "Review submitted!", description: "Thank you for your feedback." });
    };

    return (
        <>
            <Card>
                <CardHeader><CardTitle className="text-2xl">My Rentals</CardTitle><CardDescription>Your history of rented items.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    {rentals.length > 0 ? rentals.map(rental => (
                        <motion.div 
                            key={rental.id} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ duration: 0.3 }}
                            className="border rounded-lg p-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <img src={rental.listings.image_urls[0]} alt={rental.listings.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-lg">{rental.listings.title}</h4>
                                        <p className="text-sm text-muted-foreground">Rented from {rental.listings.profiles.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(rental.start_date), 'PPP')} - {format(new Date(rental.end_date), 'PPP')}</p>
                                    </div>
                                </div>
                                <Badge variant={rental.status === 'confirmed' ? 'success' : rental.status === 'pending' ? 'secondary' : 'destructive'}>{rental.status}</Badge>
                            </div>
                            {isPast(new Date(rental.end_date)) && rental.reviews.length === 0 && rental.status === 'confirmed' && (
                                <div className="flex justify-end mt-4"><Button variant="outline" size="sm" onClick={() => handleOpenReview(rental)}><Star size={16} className="mr-2"/> Leave Review</Button></div>
                            )}
                        </motion.div>
                    )) : (
                        <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
                            <h3 className="text-xl font-semibold">Time to start exploring!</h3>
                            <p className="text-muted-foreground mt-2 mb-4">You haven't rented any items yet. Browse listings to find what you need.</p>
                            <Button asChild>
                                <Link to="/browse">
                                    Browse Items
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            {showReviewModal && selectedRental && profile && (
                <LeaveReviewModal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} booking={selectedRental} reviewerId={profile.id} revieweeId={selectedRental.listings.user_id} onReviewSubmitted={handleReviewSubmitted} />
            )}
        </>
    );
};

// New DashboardSkeleton component
const DashboardSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6">
            <Card className="p-4">
                <div className="flex flex-col items-center lg:items-start">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </Card>
            <Card className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </Card>
        </aside>
        <main className="lg:col-span-9 space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
        </main>
    </div>
)

export default DashboardPage; 