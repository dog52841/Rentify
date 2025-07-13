import React from 'react';
import 'leaflet/dist/leaflet.css';
import type { ListingFormData } from '../../pages/CreateListingPage';
interface ReviewStepProps {
    formData: ListingFormData;
    onPrev: () => void;
    onSubmit: () => void;
}
declare const ReviewStep: React.FC<ReviewStepProps>;
export default ReviewStep;
