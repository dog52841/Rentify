import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
const predefinedCategories = [
    "Electronics",
    "Vehicles",
    "Furniture",
    "Appliances",
    "Clothing",
    "Sports Equipment",
    "Tools",
    "Books",
    "Outdoor Gear",
    "Event Supplies",
    "Other"
];
const ListingDetailsStep = ({ title, setTitle, category, setCategory, description, setDescription, }) => {
    return (_jsxs(motion.div, { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 }, transition: { duration: 0.3 }, children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Let's start with the basics" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium mb-1", children: "Title" }), _jsx("input", { type: "text", id: "title", value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring", placeholder: "e.g., Canon EOS R5 Camera" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "category", className: "block text-sm font-medium mb-1", children: "Category" }), _jsxs(Select, { onValueChange: setCategory, value: category, children: [_jsx(SelectTrigger, { className: "w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring", children: _jsx(SelectValue, { placeholder: "Select a category" }) }), _jsx(SelectContent, { children: predefinedCategories.map((cat) => (_jsx(SelectItem, { value: cat, children: cat }, cat))) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium mb-1", children: "Description" }), _jsx("textarea", { id: "description", value: description, onChange: (e) => setDescription(e.target.value), required: true, rows: 5, className: "w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring", placeholder: "Describe your item in detail..." })] })] })] }, "details"));
};
export default ListingDetailsStep;
