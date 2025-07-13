import React from 'react';
import 'leaflet/dist/leaflet.css';
export type ExtendedLocationData = {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    additionalInfo?: string;
    meetupInstructions?: string;
};
interface LocationPriceStepProps {
    price: string;
    setPrice: (price: string) => void;
    location: ExtendedLocationData | null;
    setLocation: (location: ExtendedLocationData | null) => void;
    errors?: Record<string, string>;
}
declare const LocationPriceStep: React.FC<LocationPriceStepProps>;
export default LocationPriceStep;
