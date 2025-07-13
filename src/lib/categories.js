import React from 'react';
import { Laptop, Car, Sofa, Plug, Shirt, Dumbbell, Wrench, BookOpen, Tent, PartyPopper, Package, Smartphone, Monitor, Headphones, Camera, Tv, Bike, Ship, Truck, Plane, Bed, Armchair, Home, Lamp, Refrigerator, Microwave, WashingMachine, Brush, Watch, Glasses, Briefcase, Hammer, Shovel, Paintbrush, Book, Newspaper, Music, Film, Gamepad2, Mountain, Backpack, TreePine, Gift, Cake, Clapperboard, Heart, ToyBrick, Puzzle, Baby, Palette, GitFork, Leaf, Bone, Dog, Cat, Fish } from 'lucide-react';
// Export the predefined categories with professional icons
export const Categories = [
    {
        name: "Electronics",
        description: "Computers, phones, cameras, and other electronic devices",
        icon: Laptop,
        subcategories: ["Computers & Laptops", "Phones & Tablets", "Audio & Headphones", "Cameras & Photography", "TVs & Home Theater", "Gaming Consoles"]
    },
    {
        name: "Vehicles",
        description: "Cars, bikes, scooters, and other transportation",
        icon: Car,
        subcategories: ["Cars", "Motorcycles", "Bicycles", "Scooters", "Boats & Marine", "RVs & Campers", "Trucks", "Aircraft"]
    },
    {
        name: "Home & Furniture",
        description: "Sofas, beds, tables, chairs, and other home furniture",
        icon: Sofa,
        subcategories: ["Living Room", "Bedroom", "Office", "Kitchen & Dining", "Lighting", "Decor"]
    },
    {
        name: "Appliances",
        description: "Kitchen, laundry, and other household appliances",
        icon: Refrigerator,
        subcategories: ["Major Kitchen Appliances", "Small Kitchen Appliances", "Laundry", "Vacuums & Cleaning"]
    },
    {
        name: "Fashion",
        description: "Clothing, shoes, accessories, and fashion items",
        icon: Shirt,
        subcategories: ["Women's Clothing", "Men's Clothing", "Shoes", "Jewelry & Watches", "Handbags & Accessories"]
    },
    {
        name: "Sports & Fitness",
        description: "Fitness, outdoor sports, and recreational equipment",
        icon: Dumbbell,
        subcategories: ["Gym & Fitness", "Team Sports", "Water Sports", "Winter Sports", "Cycling", "Golf"]
    },
    {
        name: "Tools & DIY",
        description: "Power tools, hand tools, and workshop equipment",
        icon: Wrench,
        subcategories: ["Power Tools", "Hand Tools", "Garden Tools", "Workshop & Safety"]
    },
    {
        name: "Books & Media",
        description: "Books, textbooks, magazines, and publications",
        icon: BookOpen,
        subcategories: ["Fiction", "Non-Fiction", "Textbooks", "Magazines", "Movies & TV", "Music & Vinyl", "Video Games"]
    },
    {
        name: "Outdoor & Adventure",
        description: "Camping, hiking, and outdoor adventure equipment",
        icon: Tent,
        subcategories: ["Camping & Hiking", "Backpacking", "Climbing", "Fishing", "Beach Gear"]
    },
    {
        name: "Event & Party Supplies",
        description: "Party, wedding, and special event equipment",
        icon: PartyPopper,
        subcategories: ["Party Decor", "Tableware", "Audiovisual Equipment", "Wedding Supplies", "Catering Equipment"]
    },
    {
        name: "Toys & Games",
        description: "Toys, board games, and items for children",
        icon: ToyBrick,
        subcategories: ["Action Figures", "Dolls", "Board Games", "Puzzles", "Baby & Toddler", "Educational"]
    },
    {
        name: "Health & Beauty",
        description: "Personal care, wellness, and beauty products",
        icon: Heart,
        subcategories: ["Skincare", "Makeup", "Hair Care", "Wellness", "Grooming"]
    },
    {
        name: "Pet Supplies",
        description: "Items for pets and animals",
        icon: Dog,
        subcategories: ["Dog Supplies", "Cat Supplies", "Fish & Aquatics", "Small Animals"]
    },
    {
        name: "Hobbies & Crafts",
        description: "Art supplies, craft tools, and hobby equipment",
        icon: Palette,
        subcategories: ["Art Supplies", "Crafting", "Sewing & Knitting", "Model Kits"]
    },
    {
        name: "Miscellaneous",
        description: "Items that don't fit other categories",
        icon: Package,
        subcategories: ["Collectibles", "Antiques", "Specialty Equipment"]
    }
];
// Helper function to get the appropriate icon component for a given category
export const getCategoryIcon = (categoryName) => {
    const category = Categories.find(cat => cat.name === categoryName);
    if (category) {
        return category.icon;
    }
    // Fallback icons for specific subcategories
    switch (categoryName) {
        // Electronics
        case 'Computers & Laptops': return Monitor;
        case 'Phones & Tablets': return Smartphone;
        case 'Audio & Headphones': return Headphones;
        case 'Cameras & Photography': return Camera;
        case 'TVs & Home Theater': return Tv;
        case 'Gaming Consoles': return Gamepad2;
        // Vehicles
        case 'Motorcycles': return Bike;
        case 'Bicycles': return Bike;
        case 'Scooters': return Bike;
        case 'Boats & Marine': return Ship;
        case 'Trucks': return Truck;
        case 'Aircraft': return Plane;
        // Home & Furniture
        case 'Living Room': return Sofa;
        case 'Bedroom': return Bed;
        case 'Office': return Armchair;
        case 'Kitchen & Dining': return Home;
        case 'Lighting': return Lamp;
        // Appliances
        case 'Major Kitchen Appliances': return Refrigerator;
        case 'Small Kitchen Appliances': return Microwave;
        case 'Laundry': return WashingMachine;
        case 'Vacuums & Cleaning': return Brush;
        // Fashion
        case 'Jewelry & Watches': return Watch;
        case 'Handbags & Accessories': return Briefcase;
        // Tools
        case 'Hand Tools': return Hammer;
        case 'Garden Tools': return Shovel;
        case 'Workshop & Safety': return Wrench;
        // Books & Media
        case 'Movies & TV': return Film;
        case 'Music & Vinyl': return Music;
        case 'Video Games': return Gamepad2;
        // Outdoor & Adventure
        case 'Camping & Hiking': return Tent;
        case 'Backpacking': return Backpack;
        case 'Climbing': return Mountain;
        case 'Fishing': return Fish;
        // Event & Party
        case 'Wedding Supplies': return Gift;
        case 'Catering Equipment': return Cake;
        case 'Audiovisual Equipment': return Clapperboard;
        // Toys & Games
        case 'Puzzles': return Puzzle;
        case 'Baby & Toddler': return Baby;
        // Pet Supplies
        case 'Dog Supplies': return Dog;
        case 'Cat Supplies': return Cat;
        case 'Small Animals': return Bone;
        // Hobbies
        case 'Art Supplies': return Palette;
        case 'Crafting': return Paintbrush;
        // Default
        default: return Package;
    }
};
