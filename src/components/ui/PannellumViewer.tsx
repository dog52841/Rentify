import React, { useEffect, useRef } from 'react';

interface PannellumViewerProps {
  imageSource: string;
}

const PannellumViewer: React.FC<PannellumViewerProps> = ({ imageSource }) => {
  const panoramaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: any = null;
    if (panoramaRef.current && imageSource) {
      viewer = (window as any).pannellum.viewer(panoramaRef.current, {
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

  return <div ref={panoramaRef} style={{ width: '100%', height: '400px' }} />;
};

export default PannellumViewer; 