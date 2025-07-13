import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, UploadCloud, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient'; // Assuming you have this configured
const DetailsStep = ({ onNext, onPrev, formData }) => {
    const [title, setTitle] = useState(formData.title || '');
    const [description, setDescription] = useState(formData.description || '');
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState(formData.photos || []);
    const [isUploading, setIsUploading] = useState(false);
    const onDrop = useCallback((acceptedFiles) => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
        const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
        setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: true,
    });
    const removeImage = (index) => {
        setFiles(files.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };
    const handleNext = async () => {
        if (title.trim() === '' || previews.length === 0) {
            alert('Please provide a title and at least one photo.');
            return;
        }
        setIsUploading(true);
        const uploadedUrls = [];
        for (const file of files) {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('listing-images') // Make sure this bucket exists and has correct policies
                .upload(fileName, file);
            if (error) {
                console.error('Error uploading image:', error);
                // Handle upload error (e.g., show a toast notification)
            }
            else {
                const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName);
                uploadedUrls.push(publicUrl);
            }
        }
        setIsUploading(false);
        onNext({ title, description, photos: [...(formData.photos || []), ...uploadedUrls] });
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 }, children: [_jsx("h2", { className: "text-2xl font-bold mb-2 text-gray-900 dark:text-white", children: "Listing Details" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-6", children: "Provide a catchy title, detailed description, and some photos of your item." }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Title" }), _jsx(Input, { id: "title", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g., Professional Canon Camera" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Description" }), _jsx(Textarea, { id: "description", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Describe your item in detail...", rows: 5 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Photos" }), _jsxs("div", { ...getRootProps(), className: `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`, children: [_jsx("input", { ...getInputProps() }), _jsx(UploadCloud, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("p", { className: "mt-2 text-sm text-gray-600 dark:text-gray-400", children: isDragActive ? 'Drop the files here...' : 'Drag & drop some files here, or click to select files' })] }), _jsx("div", { className: "mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", children: previews.map((preview, index) => (_jsxs("div", { className: "relative group aspect-w-1 aspect-h-1", children: [_jsx("img", { src: preview, alt: `preview ${index}`, className: "object-cover rounded-lg w-full h-full" }), _jsx("div", { className: "absolute top-0 right-0", children: _jsx(Button, { size: "sm", variant: "destructive", onClick: () => removeImage(index), className: "rounded-full w-6 h-6 p-0", children: _jsx(X, { className: "w-4 h-4" }) }) })] }, index))) })] })] }), _jsxs("div", { className: "mt-8 flex justify-between", children: [_jsxs(Button, { onClick: onPrev, variant: "outline", children: [_jsx(ChevronLeft, { className: "w-4 h-4 mr-2" }), " Previous"] }), _jsxs(Button, { onClick: handleNext, disabled: isUploading, children: [isUploading ? 'Uploading...' : 'Next', " ", _jsx(ChevronRight, { className: "w-4 h-4 ml-2" })] })] })] }));
};
export default DetailsStep;
