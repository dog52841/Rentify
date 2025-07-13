import React from 'react';
import type { ExtendedLocationData } from './LocationPriceStep';
interface ReviewStepProps {
    title: string;
    category: string;
    description: string;
    images: File[];
    image360: File | null;
    price: string;
    location: ExtendedLocationData | null;
}
declare const ReviewStep: React.FC<ReviewStepProps>;
export default ReviewStep;
