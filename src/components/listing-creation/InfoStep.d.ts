import React from 'react';
interface InfoStepProps {
    formData: {
        title: string;
        description: string;
        condition: string;
    };
    onFormChange: (data: {
        title?: string;
        description?: string;
        condition?: string;
    }) => void;
    errors: {
        title?: string;
        description?: string;
        condition?: string;
    };
}
declare const InfoStep: React.FC<InfoStepProps>;
export default InfoStep;
