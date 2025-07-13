import React from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ListingDetailsStepProps {
  title: string;
  setTitle: (title: string) => void;
  category: string;
  setCategory: (category: string) => void;
  description: string;
  setDescription: (description: string) => void;
}

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

const ListingDetailsStep: React.FC<ListingDetailsStepProps> = ({
  title,
  setTitle,
  category,
  setCategory,
  description,
  setDescription,
}) => {
  return (
    <motion.div 
      key="details" 
      initial={{ opacity: 0, x: -50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 50 }} 
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-6">Let's start with the basics</h2>
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
          <input 
            type="text" 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            className="w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring" 
            placeholder="e.g., Canon EOS R5 Camera" 
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
            <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {predefinedCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
            rows={5} 
            className="w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring" 
            placeholder="Describe your item in detail..."
          ></textarea>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingDetailsStep; 