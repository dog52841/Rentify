import React from 'react';
interface MediaStepProps {
    formData: {
        images: File[];
        image360: File | null;
    };
    onFormChange: (data: {
        images?: File[];
        image360?: File | null;
    }) => void;
    errors: {
        images?: string;
        image360?: string;
    };
}
declare const MediaStep: React.FC<MediaStepProps>;
export default MediaStep;
