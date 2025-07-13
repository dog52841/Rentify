import * as React from 'react';
interface LightboxProps {
    images: string[];
    selectedIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}
declare const Lightbox: React.FC<LightboxProps>;
export default Lightbox;
