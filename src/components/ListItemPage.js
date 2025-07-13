import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import InfoStep from './create-listing/InfoStep';
import MediaStep from './create-listing/MediaStep';
import LocationPriceStep from './create-listing/LocationPriceStep';
import ReviewStep from './create-listing/ReviewStep';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, Loader2, Check, AlertCircle } from 'lucide-react';
import { Categories } from '../lib/categories';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "./ui/dialog";
import { Progress } from './ui/progress';
const steps = [
    { id: 'info', title: 'Item Details' },
    { id: 'media', title: 'Media' },
    { id: 'location', title: 'Location & Price' },
    { id: 'review', title: 'Review' },
];
const ListItemPage = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
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
                }
                else if (description.length < 20) {
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
        }
        catch (error) {
            console.error('Error creating listing:', error);
            setErrorMessages([error.message]);
            setShowErrorDialog(true);
            setUploadProgress(0);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    // Render step content based on current step
    const renderStepContent = () => {
        switch (currentStep) {
            case 'info':
                return (_jsx(InfoStep, { title: title, setTitle: setTitle, category: category, setCategory: setCategory, description: description, setDescription: setDescription, errors: formErrors }));
            case 'media':
                return (_jsx(MediaStep, { images: images, setImages: setImages, image360: image360, setImage360: setImage360, errors: formErrors }));
            case 'location':
                return (_jsx(LocationPriceStep, { price: price, setPrice: setPrice, location: location, setLocation: setLocation, errors: formErrors }));
            case 'review':
                return (_jsx(ReviewStep, { title: title, category: category, description: description, images: images, image360: image360, price: price, location: location }));
            default:
                return null;
        }
    };
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 py-8 pb-24", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-1", children: "List Your Item" }), _jsx("p", { className: "text-muted-foreground", children: "Share your item with others and earn money while it's not in use." })] }), _jsxs("div", { className: "mb-8", children: [_jsx("div", { className: "flex justify-between mb-2", children: steps.map((step, index) => (_jsx("div", { className: `text-sm font-medium ${currentStepIndex >= index ? 'text-primary' : 'text-muted-foreground'}`, children: step.title }, step.id))) }), _jsx(Progress, { value: progress, className: "h-2" })] }), _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { duration: 0.3 }, className: "mb-8", children: renderStepContent() }, currentStep) }), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsxs(Button, { variant: "outline", onClick: goToPreviousStep, disabled: currentStepIndex === 0 || isSubmitting, className: "flex items-center gap-2", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Back"] }), currentStepIndex < steps.length - 1 ? (_jsxs(Button, { onClick: goToNextStep, disabled: isSubmitting, className: "flex items-center gap-2", children: ["Next", _jsx(ArrowRight, { className: "h-4 w-4" })] })) : (_jsx(Button, { onClick: handleSubmit, disabled: isSubmitting, className: "flex items-center gap-2 min-w-[120px]", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), "Submitting..."] })) : (_jsxs(_Fragment, { children: ["List Item", _jsx(Check, { className: "h-4 w-4" })] })) }))] }), _jsx(Dialog, { open: showErrorDialog, onOpenChange: setShowErrorDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2 text-destructive", children: [_jsx(AlertCircle, { className: "h-5 w-5" }), "Error creating listing"] }), _jsx(DialogDescription, { children: "We encountered the following issues:" })] }), _jsx("div", { className: "py-4", children: _jsx("ul", { className: "list-disc pl-5 space-y-2", children: errorMessages.map((message, index) => (_jsx("li", { className: "text-sm", children: message }, index))) }) }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => setShowErrorDialog(false), children: "Try Again" }) })] }) }), _jsx(Dialog, { open: isSubmitting, onOpenChange: () => { }, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Creating Your Listing" }), _jsx(DialogDescription, { children: "Please wait while we upload your images and create your listing." })] }), _jsxs("div", { className: "py-4", children: [_jsx(Progress, { value: uploadProgress, className: "h-2 mb-2" }), _jsx("p", { className: "text-sm text-center text-muted-foreground", children: uploadProgress < 50
                                        ? "Uploading images..."
                                        : uploadProgress < 100
                                            ? "Creating listing..."
                                            : "Redirecting to your listing..." })] })] }) })] }));
};
export default ListItemPage;
