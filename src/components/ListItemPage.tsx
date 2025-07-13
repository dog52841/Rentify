import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '../hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import InfoStep from '../components/create-listing/InfoStep';
import MediaStep from '../components/create-listing/MediaStep';
import LocationPriceStep from '../components/create-listing/LocationPriceStep';
import ReviewStep from '../components/create-listing/ReviewStep';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ArrowRight, Loader2, Check, AlertCircle, X } from 'lucide-react';
import { Categories } from '../lib/categories';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Progress } from '../components/ui/progress';

const steps = [
  { id: 'info', title: 'Item Details' },
  { id: 'media', title: 'Media' },
  { id: 'location', title: 'Location & Price' },
  { id: 'review', title: 'Review' },
];

const ListItemPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // States for form fields
  const [currentStep, setCurrentStep] = useState('info');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [image360, setImage360] = useState(null);
  const [location, setLocation] = useState(null);
  const [price, setPrice] = useState('');
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  
  // Get current step index
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Check auth status on mount
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a listing",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [user, navigate, toast]);

  // Navigate between steps
  const goToNextStep = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    
    // Validate current step
    if (!validateCurrentStep()) {
      return;
    }
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
      window.scrollTo(0, 0);
    }
  };
  
  // Validate current step
  const validateCurrentStep = () => {
    let isValid = true;
    let errors = {};
    
    switch (currentStep) {
      case 'info':
        if (!title.trim()) {
          errors.title = "Title is required";
          isValid = false;
        }
        if (!category) {
          errors.category = "Category is required";
          isValid = false;
        }
        if (!description.trim()) {
          errors.description = "Description is required";
          isValid = false;
        } else if (description.length < 20) {
          errors.description = "Description should be at least 20 characters";
          isValid = false;
        }
        break;
      case 'media':
        if (images.length === 0) {
          errors.images = "At least one image is required";
          isValid = false;
        }
        break;
      case 'location':
        if (!location) {
          errors.location = "Location is required";
          isValid = false;
        }
        if (!price || parseFloat(price) <= 0) {
          errors.price = "A valid price is required";
          isValid = false;
        }
        break;
      default:
        break;
    }
    
    setFormErrors(errors);
    
    if (!isValid) {
      toast({
        title: "Please fix the errors",
        description: Object.values(errors)[0],
        variant: "destructive"
      });
    }
    
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Check if form is valid
    if (!validateCurrentStep()) {
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a listing",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    // Check if location and at least one image is provided
    if (!location) {
      setErrorMessages(["Please set a pickup location"]);
      setShowErrorDialog(true);
      return;
    }
    
    if (images.length === 0) {
      setErrorMessages(["Please upload at least one image"]);
      setShowErrorDialog(true);
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // 1. Upload images to storage
      const imageUrls = [];
      let image360Url = null;
      
      // Upload regular images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `listing-images/${user.id}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('images')
          .upload(filePath, file);
          
        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
          
        imageUrls.push(publicUrl);
        
        // Update progress
        setUploadProgress(((i + 1) / (images.length + (image360 ? 1 : 0))) * 50);
      }
      
      // Upload 360 image if provided
      if (image360) {
        const fileExt = image360.name.split('.').pop();
        const fileName = `${uuidv4()}-360.${fileExt}`;
        const filePath = `listing-images/${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image360);
          
        if (uploadError) {
          throw new Error(`Error uploading 360 image: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
          
        image360Url = publicUrl;
      }
      
      setUploadProgress(50);
      
      // 2. Insert listing into database
      const { error: insertError, data: insertedListing } = await supabase
        .from('listings')
        .insert({
          title,
          category,
          description,
          price: parseFloat(price),
          images: imageUrls,
          image_360: image360Url,
          location_lat: location.lat,
          location_lng: location.lng,
          location_text: location.address,
          city: location.city || '',
          state: location.state || '',
          country: location.country || '',
          postal_code: location.postalCode || '',
          location_details: location.additionalInfo || '',
          meetup_instructions: location.meetupInstructions || '',
          owner_id: user.id,
          status: 'active',
        })
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Error creating listing: ${insertError.message}`);
      }
      
      setUploadProgress(100);
      
      // Success! Redirect to the new listing
      toast({
        title: "Listing created successfully!",
        description: "Your item is now available for rent.",
        variant: "success"
      });
      
      setTimeout(() => {
        navigate(`/listings/${insertedListing.id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error creating listing:', error);
      setErrorMessages([error.message]);
      setShowErrorDialog(true);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 'info':
        return (
          <InfoStep
            title={title}
            setTitle={setTitle}
            category={category}
            setCategory={setCategory}
            description={description}
            setDescription={setDescription}
            errors={formErrors}
          />
        );
      case 'media':
        return (
          <MediaStep
            images={images}
            setImages={setImages}
            image360={image360}
            setImage360={setImage360}
            errors={formErrors}
          />
        );
      case 'location':
        return (
          <LocationPriceStep
            price={price}
            setPrice={setPrice}
            location={location}
            setLocation={setLocation}
            errors={formErrors}
          />
        );
      case 'review':
        return (
          <ReviewStep
            title={title}
            category={category}
            description={description}
            images={images}
            image360={image360}
            price={price}
            location={location}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">List Your Item</h1>
        <p className="text-muted-foreground">
          Share your item with others and earn money while it's not in use.
        </p>
      </div>
      
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`text-sm font-medium ${currentStepIndex >= index ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {step.title}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0 || isSubmitting}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        {currentStepIndex < steps.length - 1 ? (
          <Button
            onClick={goToNextStep}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                List Item
                <Check className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error creating listing
            </DialogTitle>
            <DialogDescription>
              We encountered the following issues:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc pl-5 space-y-2">
              {errorMessages.map((message, index) => (
                <li key={index} className="text-sm">{message}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Progress Dialog */}
      <Dialog open={isSubmitting} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Creating Your Listing</DialogTitle>
            <DialogDescription>
              Please wait while we upload your images and create your listing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Progress value={uploadProgress} className="h-2 mb-2" />
            <p className="text-sm text-center text-muted-foreground">
              {uploadProgress < 50 
                ? "Uploading images..." 
                : uploadProgress < 100 
                  ? "Creating listing..." 
                  : "Redirecting to your listing..."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListItemPage; 