import React from 'react';
import type { LucideProps } from 'lucide-react';
import { 
  Laptop, Car, Sofa, Plug, Shirt, 
  Dumbbell, Wrench, BookOpen, Tent, PartyPopper, Package,
  Smartphone, Monitor, Headphones, Camera, Tv,
  Bike, Ship, 
  Bed, Armchair, Home,
  Refrigerator,
  Palette, 
  Hammer, Shovel,
  Book, Newspaper,
  Mountain, Backpack,
  Gift, Music,
  Box, Archive, Briefcase
} from 'lucide-react';

// Define the category option interface
export interface CategoryOption {
  name: string;
  description: string;
  icon: React.FC<LucideProps>;
  subcategories?: string[];
}

// Export the predefined categories with professional icons
export const Categories: CategoryOption[] = [
  { 
    name: "Electronics", 
    description: "Computers, phones, cameras, and other electronic devices",
    icon: Laptop,
    subcategories: ["Computers", "Phones", "Audio", "Cameras", "TVs"]
  },
  { 
    name: "Vehicles", 
    description: "Cars, bikes, scooters, and other transportation",
    icon: Car,
    subcategories: ["Cars", "Motorcycles", "Bicycles", "Scooters", "Boats"]
  },
  { 
    name: "Furniture", 
    description: "Sofas, beds, tables, chairs, and other home furniture",
    icon: Sofa,
    subcategories: ["Sofas", "Beds", "Tables", "Chairs", "Storage"]
  },
  { 
    name: "Appliances", 
    description: "Kitchen, laundry, and other household appliances",
    icon: Plug,
    subcategories: ["Kitchen", "Laundry", "Cleaning", "Heating/Cooling"]
  },
  { 
    name: "Clothing", 
    description: "Clothing, shoes, accessories, and fashion items",
    icon: Shirt,
    subcategories: ["Men's", "Women's", "Children's", "Accessories"]
  },
  { 
    name: "Sports Equipment", 
    description: "Fitness, outdoor sports, and recreational equipment",
    icon: Dumbbell,
    subcategories: ["Fitness", "Team Sports", "Water Sports", "Winter Sports"]
  },
  { 
    name: "Tools", 
    description: "Power tools, hand tools, and workshop equipment",
    icon: Wrench,
    subcategories: ["Power Tools", "Hand Tools", "Garden Tools", "Workshop Equipment"]
  },
  { 
    name: "Books", 
    description: "Books, textbooks, magazines, and publications",
    icon: BookOpen,
    subcategories: ["Fiction", "Non-Fiction", "Textbooks", "Magazines"]
  },
  { 
    name: "Outdoor Gear", 
    description: "Camping, hiking, and outdoor adventure equipment",
    icon: Tent,
    subcategories: ["Camping", "Hiking", "Backpacking", "Beach"]
  },
  { 
    name: "Event Supplies", 
    description: "Party, wedding, and special event equipment",
    icon: PartyPopper,
    subcategories: ["Party", "Wedding", "Business Events", "Decorations"]
  },
  { 
    name: "Other", 
    description: "Miscellaneous items that don't fit other categories",
    icon: Package,
    subcategories: ["Art", "Crafts", "Music", "Specialty"]
  }
];

// Helper function to get the appropriate icon component for a given category
export const getCategoryIcon = (categoryName: string): React.FC<LucideProps> | null => {
  const category = Categories.find(cat => cat.name === categoryName);
  if (category) {
    return category.icon;
  }

  // Fallback icons for specific subcategories
  switch (categoryName) {
    // Electronics subcategories
    case 'Computers': return Monitor;
    case 'Phones': return Smartphone;
    case 'Audio': return Headphones;
    case 'Cameras': return Camera;
    case 'TVs': return Tv;
    
    // Vehicles subcategories
    case 'Motorcycles': return Bike;
    case 'Bicycles': return Bike;
    case 'Scooters': return Bike;
    case 'Boats': return Ship;
    
    // Furniture subcategories
    case 'Sofas': return Sofa;
    case 'Beds': return Bed;
    case 'Tables': return Home;
    case 'Chairs': return Armchair;
    case 'Storage': return Home;
    
    // Appliances subcategories
    case 'Kitchen': return Refrigerator;
    case 'Laundry': return Home;
    case 'Cleaning': return Home;
    
    // Sports subcategories
    case 'Fitness': return Dumbbell;
    case 'Team Sports': return Dumbbell;
    case 'Water Sports': return Ship;
    case 'Winter Sports': return Mountain;
    
    // Tools subcategories
    case 'Power Tools': return Wrench;
    case 'Hand Tools': return Hammer;
    case 'Garden Tools': return Shovel;
    
    // Books subcategories
    case 'Fiction': return Book;
    case 'Non-Fiction': return Book;
    case 'Textbooks': return BookOpen;
    case 'Magazines': return Newspaper;
    
    // Outdoor Gear subcategories
    case 'Camping': return Tent;
    case 'Hiking': return Mountain;
    case 'Backpacking': return Backpack;
    
    // Event Supplies subcategories
    case 'Party': return PartyPopper;
    case 'Wedding': return Gift;
    case 'Business Events': return Briefcase;
    case 'Decorations': return Palette;
    
    // Default
    default: return Package;
  }
}; 