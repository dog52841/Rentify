import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import CategoryStep from '../components/listing-creation/CategoryStep';
import DetailsStep from '../components/listing-creation/DetailsStep';
import LocationPriceStep from '../components/listing-creation/LocationPriceStep';
import ReviewStep from '../components/listing-creation/ReviewStep';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
const CreateListingPage = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        category: '',
        subcategory: '',
        title: '',
        description: '',
        photos: [],
        location: null,
        address: '',
        price_per_day: '',
        price_per_week: '',
        price_per_month: ''
    });
    const { user } = useAuth();
    const navigate = useNavigate();
    const steps = [
        'Category',
        'Details',
        'Location & Price',
        'Review & Publish'
    ];
    const handleNext = (data) => {
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    };
    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };
    const handleSubmit = async () => {
        if (!user) {
            alert("You must be logged in to create a listing.");
            navigate('/login');
            return;
        }
        if (!formData.location) {
            alert("Location data is missing. Please return to the location step.");
            setCurrentStep(2);
            return;
        }
        const { data, error } = await supabase
            .from('listings')
            .insert([
            {
                owner_id: user.id,
                title: formData.title,
                description: formData.description,
                category: formData.category,
                subcategory: formData.subcategory,
                location: `POINT(${formData.location.lng} ${formData.location.lat})`,
                address: formData.address,
                price_per_day: formData.price_per_day,
                price_per_week: formData.price_per_week || null,
                price_per_month: formData.price_per_month || null,
                photos: formData.photos,
                // status: 'available', // default value in db?
            }
        ])
            .select();
        if (error) {
            console.error('Error creating listing:', error);
            alert('There was an error creating your listing. Please try again.');
        }
        else {
            console.log('Listing created:', data);
            alert('Listing created successfully!');
            navigate(`/listing/${data[0].id}`);
        }
    };
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return _jsx(CategoryStep, { onNext: handleNext, formData: formData });
            case 1:
                return _jsx(DetailsStep, { onNext: handleNext, onPrev: handlePrev, formData: formData });
            case 2:
                return _jsx(LocationPriceStep, { onNext: handleNext, onPrev: handlePrev, formData: formData });
            case 3:
                return _jsx(ReviewStep, { onPrev: handlePrev, onSubmit: handleSubmit, formData: formData });
            default:
                return null;
        }
    };
    const progress = ((currentStep + 1) / steps.length) * 100;
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Create a New Listing" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mt-1", children: "Follow the steps to get your item listed on Rentify." })] }), _jsxs("div", { className: "mb-8", children: [_jsx(Progress, { value: progress, className: "w-full" }), _jsx("div", { className: "flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400", children: steps.map((step, index) => (_jsx("div", { className: `text-center ${index <= currentStep ? 'font-semibold text-blue-600' : ''}`, children: step }, step))) })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8", children: _jsx(AnimatePresence, { mode: "wait", children: renderStep() }) })] }) }));
};
export default CreateListingPage;
