import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, PlusCircle, MoreVertical, Edit, Trash2, MapPin, Star, Building } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

type Listing = {
  id: string;
  title: string;
  price_per_day: number;
  images_urls: string[];
  average_rating: number;
  review_count: number;
};

const MyListingsPage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
        navigate('/auth');
        return;
    };

    const fetchListings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            description,
            price_per_day,
            location,
            image_urls,
            user_id,
            created_at,
            category
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Process listings to handle image fields and calculate ratings
        const processedListings = await Promise.all((data || []).map(async (listing) => {
          // Get reviews for rating calculation
          const { data: reviews } = await supabase
            .from('user_reviews')
            .select('rating')
            .eq('listing_id', listing.id);

          const averageRating = reviews && reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0;

          const images = listing.image_urls || [];

          return {
            id: listing.id,
            title: listing.title,
            price_per_day: listing.price_per_day,
            image_urls: images,
            average_rating: averageRating,
            review_count: reviews?.length || 0
          };
        }));

        setListings(processedListings);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching listings', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [user, toast, navigate]);

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;

    // TODO: Also delete associated storage images
    const { error } = await supabase.from('listings').delete().eq('id', listingToDelete);

    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting listing', description: error.message });
    } else {
      setListings(prev => prev.filter(l => l.id !== listingToDelete));
      toast({ title: 'Listing deleted successfully' });
    }
    setListingToDelete(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3"><Building className="h-8 w-8 text-primary"/>My Listings</h1>
        <Button asChild>
          <Link to="/list-item"><PlusCircle className="mr-2 h-4 w-4" /> Add New Listing</Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-lg">
          <h2 className="text-2xl font-semibold">You haven't listed any items yet.</h2>
          <p className="text-muted-foreground mt-2 mb-6">Start earning by sharing your items with the community.</p>
          <Button asChild size="lg">
            <Link to="/list-item">List Your First Item</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <Card key={listing.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0 relative">
                <Link to={`/listings/${listing.id}`} className="block">
                    <img src={listing.image_urls?.[0] || 'https://placehold.co/600x400'} alt={listing.title} className="aspect-video w-full object-cover"/>
                </Link>
                <div className="absolute top-2 right-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/70 backdrop-blur-sm">
                                <MoreVertical className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link to={`/listings/${listing.id}/edit`}><Edit className="mr-2 h-4 w-4"/>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setListingToDelete(listing.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/>Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Star className="h-4 w-4 text-primary fill-current mr-1" />
                    <span>{listing.average_rating.toFixed(1)}</span>
                    <span className="ml-1">({listing.review_count} reviews)</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-muted/30">
                <p className="font-bold text-lg">${listing.price_per_day}<span className="font-normal text-sm text-muted-foreground">/day</span></p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!listingToDelete} onOpenChange={(open) => !open && setListingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteListing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default MyListingsPage; 