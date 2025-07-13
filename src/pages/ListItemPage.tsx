import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { Upload, X, MapPin, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Expanded categories
const listingCategories = [
    "Electronics & Gadgets", "Gaming Consoles", "Cameras & Lenses", "Drones & Accessories",
    "Vehicles & Automotive", "Cars & Trucks", "RVs & Campers", "Motorcycles & Scooters",
    "Home & Furniture", "Living Room", "Bedroom", "Office Furniture", "Home Appliances",
    "Fashion & Apparel", "Men's Clothing", "Women's Clothing", "Costumes & Formal Wear",
    "Sports & Outdoors", "Camping & Hiking Gear", "Water Sports", "Winter Sports", "Cycling",
    "Tools & Equipment", "Power Tools", "Gardening", "Construction",
    "Books & Media", "Textbooks", "Fiction & Non-fiction", "Vinyl Records",
    "Party & Events", "Tents & Canopies", "Sound Systems", "Lighting", "Decorations",
    "Musical Instruments", "Guitars & Basses", "Keyboards & Pianos", "DJ Equipment",
    "Kids & Baby", "Strollers & Car Seats", "Toys & Games",
    "Other"
];

const MAX_IMAGES = 5;

const ListItemPage = () => {
    const { id: listingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(!!listingId);

    useEffect(() => {
        if (listingId) {
            const fetchListing = async () => {
                setIsFetching(true);
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', listingId)
                    .single();
                
                if (error || !data) {
                    toast({ variant: 'destructive', title: 'Error fetching listing.' });
                    navigate('/dashboard');
                } else {
                    setTitle(data.title || '');
                    setDescription(data.description || '');
                    setCategory(data.category || '');
                    setPrice(data.price_per_day?.toString() || '');
                    setLocation(data.location_text || '');
                    setExistingImageUrls(data.image_urls || data.images_urls || []);
                }
                setIsFetching(false);
            };
            fetchListing();
        }
    }, [listingId, navigate, toast]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const totalImages = imageFiles.length + existingImageUrls.length + files.length;
            if (totalImages > MAX_IMAGES) {
                toast({ variant: 'destructive', title: `You can only upload a maximum of ${MAX_IMAGES} images.`});
                return;
            }

            setImageFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index]);
            return newPreviews;
        });
    };
    
    const removeExistingImage = (index: number) => {
        setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in.' });
            return;
        }

        setIsLoading(true);
        setIsUploading(true);

        try {
            const uploadedUrls = [...existingImageUrls];
            if (imageFiles.length > 0) {
                const uploadPromises = imageFiles.map(file => {
                    const filePath = `${user.id}/${uuidv4()}`;
                    return supabase.storage.from('listing-images').upload(filePath, file);
                });
                
                const results = await Promise.all(uploadPromises);
                
                for (const result of results) {
                    if (result.error) throw result.error;
                    const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(result.data.path);
                    uploadedUrls.push(publicUrl);
                }
            }
            setIsUploading(false);

            const listingData = {
                user_id: user.id,
                title,
                description,
                category,
                price_per_day: parseFloat(price),
                location_text: location,
                image_urls: uploadedUrls,
                status: 'approved', // CORRECTED: Listings are now approved instantly.
            };
            
            let error;
            if (listingId) {
                ({ error } = await supabase.from('listings').update(listingData).eq('id', listingId));
            } else {
                ({ error } = await supabase.from('listings').insert(listingData));
            }

            if (error) throw error;
            
            toast({ title: `Listing ${listingId ? 'updated' : 'created'} successfully!`, description: "Your item is now live and visible to others." });
            navigate('/dashboard?tab=my-listings');

        } catch (error: any) {
            console.error("Error submitting listing:", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsLoading(false);
            setIsUploading(false);
        }
    };
    
    const canSubmit = title && description && category && price && location && (existingImageUrls.length > 0 || imageFiles.length > 0);

    return (
        <AnimatedSection>
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-center">{listingId ? 'Edit Your Listing' : 'List a New Item'}</h1>
                    <p className="text-muted-foreground mt-3 text-lg text-center max-w-2xl mx-auto">
                        {listingId ? 'Update the details of your item.' : 'Fill out the form below to make your item available for others to rent.'}
                    </p>
                </motion.div>

                <Card className="mt-10 shadow-xl border-border/20">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Listing Details</CardTitle>
                            <CardDescription>Provide clear and accurate information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="title">Item Title</label>
                                    <Input id="title" placeholder="e.g., Canon EOS R5 Camera" value={title} onChange={(e) => setTitle(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="category">Category</label>
                                    <Select value={category} onValueChange={setCategory} required>
                                        <SelectTrigger id="category"><SelectValue placeholder="Select a category..." /></SelectTrigger>
                                        <SelectContent>
                                            {listingCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="description">Description</label>
                                <Textarea id="description" placeholder="Describe your item, its condition, and any accessories included." value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="price">Price per day ($)</label>
                                    <Input id="price" type="number" min="1" placeholder="25" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="location">Item Location</label>
                                    <div className="relative">
                                        <Input id="location" placeholder="e.g., Brooklyn, NY" value={location} onChange={(e) => setLocation(e.target.value)} required className="pl-9" />
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label>Images (up to {MAX_IMAGES})</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {existingImageUrls.map((url, index) => (
                                        <div key={`existing-${index}`} className="relative group aspect-square">
                                            <img src={url} alt="Existing listing" className="w-full h-full object-cover rounded-lg" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingImage(index)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    {imagePreviews.map((preview, index) => (
                                        <div key={`new-${index}`} className="relative group aspect-square">
                                            <img src={preview} alt="New listing preview" className="w-full h-full object-cover rounded-lg" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeNewImage(index)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    {(existingImageUrls.length + imagePreviews.length) < MAX_IMAGES && (
                                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary transition-colors">
                                            <Upload className="w-8 h-8 text-muted-foreground" />
                                            <span className="text-xs mt-2 text-muted-foreground text-center">Add Image</span>
                                            <input id="image-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>
                                </div>
                            
                            <div className="flex justify-end pt-6 border-t">
                                <Button type="submit" disabled={!canSubmit || isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isUploading ? 'Uploading...' : listingId ? 'Save Changes' : 'Submit for Review'}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                    </Card>
            </div>
        </AnimatedSection>
    );
};

export default ListItemPage; 