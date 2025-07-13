import React from 'react';
import type { LucideProps } from 'lucide-react';
export interface CategoryOption {
    name: string;
    description: string;
    icon: React.FC<LucideProps>;
    subcategories?: string[];
}
export declare const Categories: CategoryOption[];
export declare const getCategoryIcon: (categoryName: string) => React.FC<LucideProps> | null;
