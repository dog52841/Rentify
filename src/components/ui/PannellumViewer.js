import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
const PannellumViewer = ({ imageSource }) => {
    const panoramaRef = useRef(null);
    useEffect(() => {
        let viewer = null;
        if (panoramaRef.current && imageSource) {
            viewer = window.pannellum.viewer(panoramaRef.current, {
                type: 'equirectangular',
                panorama: imageSource,
                autoLoad: true,
                showControls: true,
                hotSpotDebug: false
            });
        }
        // Destroy the viewer on component unmount
        return () => {
            if (viewer) {
                viewer.destroy();
            }
        };
    }, [imageSource]);
    return _jsx("div", { ref: panoramaRef, style: { width: '100%', height: '400px' } });
};
export default PannellumViewer;
