import React from 'react';
interface MediaStepProps {
    images: File[];
    setImages: React.Dispatch<React.SetStateAction<File[]>>;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    image360: File | null;
    setImage360: React.Dispatch<React.SetStateAction<File | null>>;
    handle360ImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
declare const MediaStep: React.FC<MediaStepProps>;
export default MediaStep;
