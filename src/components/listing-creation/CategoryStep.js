import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Categories } from '../../lib/categories';
import { ChevronRight } from 'lucide-react';
const CategoryStep = ({ onNext, formData }) => {
    const [selectedCategory, setSelectedCategory] = useState(formData.category ? Categories.find(c => c.name === formData.category) || null : null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(formData.subcategory || null);
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setSelectedSubcategory(null); // Reset subcategory when main category changes
    };
    const handleSubcategorySelect = (subcategory) => {
        setSelectedSubcategory(subcategory);
    };
    const handleNext = () => {
        if (selectedCategory && selectedSubcategory) {
            onNext({ category: selectedCategory.name, subcategory: selectedSubcategory });
        }
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 }, children: [_jsx("h2", { className: "text-2xl font-bold mb-2 text-gray-900 dark:text-white", children: "Choose a Category" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-6", children: "Select the category and subcategory that best fits your item." }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200", children: "Main Category" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: Categories.map((cat) => (_jsx(Card, { onClick: () => handleCategorySelect(cat), className: `cursor-pointer transition-all duration-200 ${selectedCategory?.name === cat.name ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50'}`, children: _jsxs(CardContent, { className: "p-4 flex flex-col items-center justify-center aspect-square", children: [_jsx(cat.icon, { className: "w-8 h-8 mb-2 text-gray-700 dark:text-gray-300" }), _jsx("span", { className: "text-sm font-medium text-center text-gray-800 dark:text-gray-200", children: cat.name })] }) }, cat.name))) })] }), _jsx("div", { children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, children: [_jsx("h3", { className: "text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200", children: "Subcategory" }), _jsx("div", { className: "flex flex-col space-y-2", children: selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.map((sub) => (_jsx(Button, { variant: selectedSubcategory === sub ? 'default' : 'outline', onClick: () => handleSubcategorySelect(sub), className: "w-full justify-start text-left", children: sub }, sub))) })] }) })] }), _jsx("div", { className: "mt-8 flex justify-end", children: _jsxs(Button, { onClick: handleNext, disabled: !selectedCategory || !selectedSubcategory, children: ["Next ", _jsx(ChevronRight, { className: "w-4 h-4 ml-2" })] }) })] }));
};
export default CategoryStep;
