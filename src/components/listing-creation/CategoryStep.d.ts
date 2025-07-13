import React from 'react';
import type { ListingFormData } from '../../pages/CreateListingPage';
interface CategoryStepProps {
    onNext: (data: Partial<ListingFormData>) => void;
    formData: ListingFormData;
}
declare const CategoryStep: React.FC<CategoryStepProps>;
export default CategoryStep;
