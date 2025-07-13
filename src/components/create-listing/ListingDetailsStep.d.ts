import React from 'react';
interface ListingDetailsStepProps {
    title: string;
    setTitle: (title: string) => void;
    category: string;
    setCategory: (category: string) => void;
    description: string;
    setDescription: (description: string) => void;
}
declare const ListingDetailsStep: React.FC<ListingDetailsStepProps>;
export default ListingDetailsStep;
