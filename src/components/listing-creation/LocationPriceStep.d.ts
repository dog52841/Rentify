import React from 'react';
import 'leaflet/dist/leaflet.css';
import type { ListingFormData } from '../../pages/CreateListingPage';
interface LocationPriceStepProps {
    onNext: (data: Partial<ListingFormData>) => void;
    onPrev: () => void;
    formData: ListingFormData;
}
declare const LocationPriceStep: React.FC<LocationPriceStepProps>;
export default LocationPriceStep;
