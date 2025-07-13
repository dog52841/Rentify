import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { AspectRatio } from '../ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { DollarSign, MapPin, Calendar, Tag, Info, Check, AlertCircle, Tablet, Clock, Star, Shield, CalendarClock, Sparkles, Zap } from 'lucide-react';
import type { ExtendedLocationData } from './LocationPriceStep';
import { getCategoryIcon } from '../../lib/categories';

// Helper function to format currency
const formatCurrency = (amount: string) => {
  const num = parseFloat(amount);
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });
};

interface ReviewStepProps {
  title: string;
  category: string;
  description: string;
  images: File[];
  image360: File | null;
  price: string;
  location: ExtendedLocationData | null;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  title,
  category,
  description,
  images,
  image360,
  price,
  location,
}) => {
  // Create image URLs for preview
  const imageUrls = images.map((file) => URL.createObjectURL(file));
  const image360Url = image360 ? URL.createObjectURL(image360) : null;
  
  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      imageUrls.forEach(URL.revokeObjectURL);
      if (image360Url) URL.revokeObjectURL(image360Url);
    };
  }, [imageUrls, image360Url]);
  
  // Get the category icon component
  const CategoryIcon = getCategoryIcon(category);

  return (
    <motion.div 
      key="review" 
      initial={{ opacity: 0, x: -50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 50 }} 
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Review Your Listing</h2>
        <p className="text-muted-foreground text-lg">
          Take a moment to review all details before submitting your listing.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images & Media */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Photos & Media
              </CardTitle>
              <CardDescription className="text-base">
                {images.length} professional photo{images.length !== 1 ? 's' : ''}{image360 ? ' + immersive 360° view' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Carousel className="w-full">
                <CarouselContent>
                  {imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <AspectRatio ratio={16/9} className="bg-muted rounded-xl overflow-hidden">
                        <img 
                          src={url} 
                          alt={`Item photo ${index + 1}`} 
                          className="object-cover w-full h-full transition-all hover:scale-105 duration-700"
                        />
                      </AspectRatio>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center mt-4">
                  <CarouselPrevious className="static mx-2 transform-none bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground" />
                  <CarouselNext className="static mx-2 transform-none bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground" />
                </div>
              </Carousel>
              
              {image360Url && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tablet className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-base">Immersive 360° View</h3>
                  </div>
                  <div className="rounded-xl overflow-hidden border bg-muted relative">
                    <AspectRatio ratio={16/9}>
                      <img 
                        src={image360Url} 
                        alt="360 degree view" 
                        className="object-cover w-full h-full"
                      />
                    </AspectRatio>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="bg-primary/90 text-primary-foreground px-6 py-3 rounded-full flex items-center gap-3 shadow-lg hover:bg-primary transition-all duration-300 cursor-pointer">
                        <Tablet className="h-5 w-5" />
                        <span className="text-base font-medium">Experience in 360°</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-xl">
                  {CategoryIcon && <CategoryIcon className="h-8 w-8 text-primary" />}
                </div>
                <div>
                  <h3 className="font-bold text-2xl">{title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 transition-colors">
                      {category}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-green-500/10 text-green-700 hover:bg-green-500/20 transition-colors">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Available Now
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 transition-colors">
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      Verified Item
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <h3 className="font-semibold text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  About this item
                </h3>
                <div className="text-base text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-lg border border-muted">
                  {description}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Location Information */}
          {location && (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Pickup Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-xl">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{location.address}</h3>
                    {location.city && (
                      <p className="text-base text-muted-foreground mt-1">
                        {location.city}
                        {location.state && `, ${location.state}`}
                        {location.country && `, ${location.country}`}
                        {location.postalCode && ` ${location.postalCode}`}
                      </p>
                    )}
                  </div>
                </div>
                
                {(location.additionalInfo || location.meetupInstructions) && (
                  <>
                    <Separator className="my-4" />
                    <Tabs defaultValue="additional" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-2">
                        <TabsTrigger value="additional" className="text-base">Location Details</TabsTrigger>
                        <TabsTrigger value="meetup" className="text-base">Meetup Instructions</TabsTrigger>
                      </TabsList>
                      <TabsContent value="additional" className="mt-2 p-4 bg-muted/30 rounded-lg border border-muted">
                        <p className="text-base">
                          {location.additionalInfo || "No additional location details provided."}
                        </p>
                      </TabsContent>
                      <TabsContent value="meetup" className="mt-2 p-4 bg-muted/30 rounded-lg border border-muted">
                        <p className="text-base">
                          {location.meetupInstructions || "No meetup instructions provided."}
                        </p>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
                
                <div className="rounded-xl overflow-hidden border shadow-md h-60 mt-4">
                  <iframe
                    title="Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01},${location.lat - 0.01},${location.lng + 0.01},${location.lat + 0.01}&marker=${location.lat},${location.lng}`}
                  ></iframe>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right Column - Summary & Pricing */}
        <div className="space-y-8">
          <Card className="sticky top-4 border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-purple-500/10">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border border-muted">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <span className="font-medium text-lg">Price Per Day</span>
                </div>
                <span className="font-bold text-2xl">{formatCurrency(price)}</span>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Listing Includes:
                </h3>
                <ul className="space-y-3 pl-2">
                  <li className="flex items-start gap-3 bg-gradient-to-r from-primary/5 to-transparent p-2 rounded-lg">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-base">{images.length} professional photo{images.length !== 1 ? 's' : ''} of your item</span>
                  </li>
                  {image360 && (
                    <li className="flex items-start gap-3 bg-gradient-to-r from-primary/5 to-transparent p-2 rounded-lg">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-base">Immersive 360° view for better visibility</span>
                    </li>
                  )}
                  <li className="flex items-start gap-3 bg-gradient-to-r from-primary/5 to-transparent p-2 rounded-lg">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-base">Detailed pickup location with interactive map</span>
                  </li>
                  {(location?.additionalInfo || location?.meetupInstructions) && (
                    <li className="flex items-start gap-3 bg-gradient-to-r from-primary/5 to-transparent p-2 rounded-lg">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-base">Extra location & meetup instructions</span>
                    </li>
                  )}
                  <li className="flex items-start gap-3 bg-gradient-to-r from-primary/5 to-transparent p-2 rounded-lg">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-base">Comprehensive item description</span>
                  </li>
                </ul>
              </div>
              
              <Separator />
              
              <div className="flex flex-col gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <p className="text-base font-medium text-amber-800 dark:text-amber-400">Rental Policy</p>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300/80">
                  By listing your item, you agree to our rental terms and conditions. 
                  You're responsible for accurately describing your item and ensuring 
                  it's in good working condition.
                </p>
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6 pt-0">
              <div className="w-full text-center text-base text-muted-foreground bg-primary/5 p-3 rounded-lg">
                Ready to submit? Click the "List Item" button below.
              </div>
            </CardFooter>
          </Card>
          
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-6 w-6 text-primary" />
                <h3 className="font-semibold text-lg">Rental Timeline</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Instant Approval</p>
                    <p className="text-sm text-muted-foreground">Your listing will be reviewed instantly</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Available Immediately</p>
                    <p className="text-sm text-muted-foreground">Your item will be available for rent right away</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewStep; 