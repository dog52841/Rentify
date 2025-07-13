import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Loader2, Star, MapPin, Calendar, Building, ShieldCheck, MessageSquare, Award, Twitter, Github, Link as LinkIcon, Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';
import StarRating from '../components/ui/StarRating';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { useAuth } from '../contexts/AuthContext';
import { ProfileSettingsPane } from '../components/dashboard/ProfileSettingsPane';

// Type definitions
interface ProfileStats {
    total_listings: number;
    average_rating: number;
    review_count: number;
}

interface Profile {
  id: string;
  created_at: string;
  full_name: string;
  avatar_url: string;
  is_verified: boolean;
  bio?: string;
  banner_url?: string;
  website_url?: string;
  social_links?: {
    twitter?: string;
    github?: string;
  };
  stats: ProfileStats;
}

interface Listing {
  id: string;
  title: string;
  price_per_day: number;
  images_urls: string[];
  location_text: string;
  average_rating: number;
  review_count: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  listing_title: string;
  reviewer: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

interface UserProfileData {
    profile: Profile;
    listings: Listing[];
    reviews: Review[];
}

const UserProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user } = useAuth();
    const [data, setData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!userId) {
                setError("User not found.");
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_user_profile_details', { p_user_id: userId });
                if (error) throw error;
                if (!data || !data.profile) throw new Error("Profile could not be loaded.");

                setData(data as UserProfileData);
            } catch (err: any) {
                console.error("Error fetching profile details:", err);
                setError(err.message || 'Failed to fetch profile data.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [userId]);
    
    const { profile, listings, reviews } = data || {};
    const bannerImage = profile?.banner_url || (listings && listings.length > 0 && listings[0].images_urls?.[0] 
        ? listings[0].images_urls[0] 
        : 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop');

    const isOwnProfile = user?.id === userId;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin h-12 w-12 text-primary"/>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <AnimatedSection className="text-center py-20">
                <h2 className="text-2xl font-semibold text-destructive mb-2">{error || "Could not load profile."}</h2>
                <p className="text-muted-foreground mb-4">The user you are looking for might not exist.</p>
                <Button asChild>
                    <Link to="/browse">Go back to browsing</Link>
                </Button>
            </AnimatedSection>
        );
    }

    return (
        <AnimatedSection>
            <div className="relative h-64 md:h-80 w-full">
                <img src={bannerImage} alt={`${profile.full_name}'s banner`} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {/* Profile Header */}
                <div className="relative -mt-24 md:-mt-32">
                    <div className="flex flex-col md:flex-row md:items-end gap-6">
                        <motion.div initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{delay: 0.1, type: 'spring'}}>
                        <Avatar className="w-40 h-40 text-5xl border-4 border-background ring-4 ring-primary">
                            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                            <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        </motion.div>
                        <div className="flex-1 text-center md:text-left mb-4">
                            <motion.h1 
                                className="text-4xl font-bold tracking-tight flex items-center gap-3 justify-center md:justify-start"
                                initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}}
                            >
                                {profile.full_name}
                                {profile.is_verified && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <ShieldCheck className="h-7 w-7 text-green-500" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Verified User</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </motion.h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                                <motion.p 
                                    className="text-muted-foreground flex items-center gap-2"
                                    initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.3}}
                                >
                                    <Calendar className="h-4 w-4" />
                                    Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                                </motion.p>
                                <motion.div 
                                    className="flex items-center gap-4 text-muted-foreground"
                                    initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.35}}
                                >
                                    {profile.website_url && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                                        <LinkIcon className="h-4 w-4" />
                                                    </a>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{profile.website_url}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {profile.social_links?.twitter && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <a href={`https://twitter.com/${profile.social_links.twitter}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                                        <Twitter className="h-4 w-4" />
                                                    </a>
                                                </TooltipTrigger>
                                                <TooltipContent><p>@{profile.social_links.twitter}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {profile.social_links?.github && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <a href={`https://github.com/${profile.social_links.github}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                                        <Github className="h-4 w-4" />
                                                    </a>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{profile.social_links.github}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                        <motion.div className="flex justify-center md:justify-end gap-2" initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.4}}>
                            {!isOwnProfile && (
                                <>
                                    <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>
                                    <Button>Follow</Button>
                                </>
                            )}
                        </motion.div>
                    </div>

                    {profile.bio && (
                        <motion.p 
                            className="text-muted-foreground mt-4 max-w-3xl text-center md:text-left mx-auto md:mx-0"
                            initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.35}}
                        >
                            {profile.bio}
                        </motion.p>
                    )}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                     {/* Left Column: Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg border-border/10">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Total Listings</span>
                                        <span className="font-bold">{profile.stats?.total_listings || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Avg. Rating</span>
                                        <div className="flex items-center gap-2">
                                            <Star className="h-4 w-4 text-amber-400" />
                                            <span className="font-bold">{profile.stats?.average_rating?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Total Reviews</span>
                                        <span className="font-bold">{profile.stats?.review_count || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Tabs */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="listings" className="w-full">
                            <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                <TabsTrigger value="listings">
                                    <Building className="mr-2 h-4 w-4" /> Listings ({listings?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="reviews">
                                    <MessageSquare className="mr-2 h-4 w-4" /> Reviews ({reviews?.length || 0})
                                </TabsTrigger>
                                {isOwnProfile && <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" /> Settings</TabsTrigger>}
                            </TabsList>

                            <TabsContent value="listings" className="mt-6">
                                <AnimatePresence>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {listings && listings.length > 0 ? listings.map(listing => (
                                         <motion.div key={listing.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} exit={{ opacity: 0, y: -20}}>
                                            <Link to={`/listings/${listing.id}`} className="group block bg-card rounded-xl overflow-hidden border transition-all duration-300 h-full flex flex-col hover:shadow-xl hover:-translate-y-1">
                                                <div className="relative aspect-video overflow-hidden">
                                                    <img src={listing.images_urls?.[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                                <div className="p-4 flex flex-col flex-grow">
                                                    <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                                                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                                                        <MapPin className="h-3 w-3 mr-1.5" /> {listing.location_text}
                                                    </p>
                                                    <div className="mt-4 flex-grow"></div>
                                                    <div className="flex justify-between items-center pt-2">
                                                        <StarRating rating={listing.average_rating} totalReviews={listing.review_count} size="sm" />
                                                        <p className="font-bold text-lg text-primary">${listing.price_per_day} <span className="text-sm font-normal text-muted-foreground">/day</span></p>
                                                    </div>
                                                </div>
                                            </Link>
                                         </motion.div>
                                    )) : (
                                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center py-16 bg-card rounded-lg border-2 border-dashed col-span-full">
                                            <p className="text-lg font-medium">{profile.full_name} has no public listings yet.</p>
                                        </motion.div>
                                    )}
                                </div>
                                </AnimatePresence>
                            </TabsContent>
                            
                            <TabsContent value="reviews" className="mt-6">
                                <AnimatePresence>
                                <div className="space-y-6">
                                    {reviews && reviews.length > 0 ? reviews.map(review => (
                                        <motion.div key={review.id} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{ opacity: 0, y: -20}}>
                                            <Card className="overflow-hidden">
                                                <CardContent className="p-6 flex gap-4">
                                                    <Avatar>
                                                        <AvatarImage src={review.reviewer.avatar_url} alt={review.reviewer.full_name} />
                                                        <AvatarFallback>{review.reviewer.full_name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-semibold">{review.reviewer.full_name}</p>
                                                                <p className="text-sm text-muted-foreground">Reviewed <Link to={`/listings/${review.id}`} className="text-primary hover:underline">{review.listing_title}</Link></p>
                                                            </div>
                                                            <div className="text-right">
                                                                <StarRating rating={review.rating} size="sm" />
                                                                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-muted-foreground mt-3">{review.comment}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )) : (
                                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center py-16 bg-card rounded-lg border-2 border-dashed">
                                            <p className="text-lg font-medium">{profile.full_name} has no reviews yet.</p>
                                        </motion.div>
                                    )}
                                </div>
                                </AnimatePresence>
                            </TabsContent>

                            {isOwnProfile && (
                                <TabsContent value="settings" className="mt-6">
                                    <ProfileSettingsPane />
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
};

export default UserProfilePage; 