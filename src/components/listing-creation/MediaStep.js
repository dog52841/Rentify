import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Camera, UploadCloud, X, Trash2, CheckCircle, AlertCircle, Tablet } from 'lucide-react';
const MediaStep = ({ formData, onFormChange, errors }) => {
    const [imagePreviews, setImagePreviews] = useState(formData.images.map(file => URL.createObjectURL(file)));
    const [image360Preview, setImage360Preview] = useState(formData.image360 ? URL.createObjectURL(formData.image360) : null);
    const onDropImages = useCallback((acceptedFiles) => {
        const newImages = [...formData.images, ...acceptedFiles];
        onFormChange({ images: newImages });
        const newPreviews = newImages.map(file => URL.createObjectURL(file));
        setImagePreviews(newPreviews);
    }, [formData.images, onFormChange]);
    const onDrop360Image = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            onFormChange({ image360: file });
            setImage360Preview(URL.createObjectURL(file));
        }
    }, [onFormChange]);
    const removeImage = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        URL.revokeObjectURL(imagePreviews[index]); // Clean up memory
        onFormChange({ images: newImages });
        setImagePreviews(newPreviews);
    };
    const remove360Image = () => {
        if (image360Preview)
            URL.revokeObjectURL(image360Preview);
        onFormChange({ image360: null });
        setImage360Preview(null);
    };
    const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps, isDragActive: isImagesDragActive } = useDropzone({
        onDrop: onDropImages,
        accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
        multiple: true
    });
    const { getRootProps: get360RootProps, getInputProps: get360InputProps, isDragActive: is360DragActive } = useDropzone({
        onDrop: onDrop360Image,
        accept: { 'image/*': ['.jpeg', '.png'] },
        multiple: false
    });
    return (_jsxs(motion.div, { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 }, transition: { duration: 0.3 }, className: "space-y-8", children: [_jsxs(Card, { className: "border-0 shadow-xl rounded-2xl overflow-hidden", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-2xl", children: [_jsx(Camera, { className: "h-6 w-6 text-primary" }), " Upload Photos"] }), _jsx(CardDescription, { children: "High-quality photos increase your chances of getting rented. Add up to 10 photos." })] }), _jsxs(CardContent, { children: [_jsxs("div", { ...getImagesRootProps(), className: `flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isImagesDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary'}`, children: [_jsx("input", { ...getImagesInputProps() }), _jsx(UploadCloud, { className: "h-12 w-12 text-muted-foreground mb-4" }), _jsx("p", { className: "text-lg font-semibold", children: "Drag & drop photos here, or click to select" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "PNG, JPG, GIF, WEBP up to 5MB each" })] }), errors.images && _jsx("p", { className: "text-sm text-destructive mt-2", children: errors.images }), imagePreviews.length > 0 && (_jsx("div", { className: "mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: imagePreviews.map((preview, index) => (_jsxs("div", { className: "relative group aspect-square", children: [_jsx("img", { src: preview, alt: `preview ${index}`, className: "w-full h-full object-cover rounded-lg" }), _jsx("div", { className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center", children: _jsx(Button, { variant: "destructive", size: "icon", onClick: () => removeImage(index), children: _jsx(Trash2, { className: "h-4 w-4" }) }) })] }, index))) }))] })] }), _jsxs(Card, { className: "border-0 shadow-xl rounded-2xl overflow-hidden", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-2xl", children: [_jsx(Tablet, { className: "h-6 w-6 text-primary" }), " Immersive 360\u00B0 View (Optional)"] }), _jsx(CardDescription, { children: "Provide a 360-degree panoramic image for an interactive experience." })] }), _jsxs(CardContent, { children: [!image360Preview ? (_jsxs("div", { ...get360RootProps(), className: `flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${is360DragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary'}`, children: [_jsx("input", { ...get360InputProps() }), _jsx(UploadCloud, { className: "h-12 w-12 text-muted-foreground mb-4" }), _jsx("p", { className: "text-lg font-semibold", children: "Upload a single 360\u00B0 image" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Equirectangular JPG or PNG" })] })) : (_jsxs("div", { className: "relative group aspect-video", children: [_jsx("img", { src: image360Preview, alt: "360 preview", className: "w-full h-full object-cover rounded-lg" }), _jsx("div", { className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center", children: _jsx(Button, { variant: "destructive", size: "icon", onClick: remove360Image, children: _jsx(Trash2, { className: "h-4 w-4" }) }) })] })), errors.image360 && _jsx("p", { className: "text-sm text-destructive mt-2", children: errors.image360 })] })] })] }, "media"));
};
export default MediaStep;
