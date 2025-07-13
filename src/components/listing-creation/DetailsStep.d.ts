import React from 'react';
import type { ListingFormData } from '../../pages/CreateListingPage';
interface DetailsStepProps {
    onNext: (data: Partial<ListingFormData>) => void;
    onPrev: () => void;
    formData: ListingFormData;
}
declare const DetailsStep: React.FC<DetailsStepProps>;
export default DetailsStep;
