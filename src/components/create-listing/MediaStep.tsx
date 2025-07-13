import React from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, X } from 'lucide-react';

interface MediaStepProps {
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  image360: File | null;
  setImage360: React.Dispatch<React.SetStateAction<File | null>>;
  handle360ImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MediaStep: React.FC<MediaStepProps> = ({
  images,
  setImages,
  handleImageChange,
  image360,
  setImage360,
  handle360ImageChange,
}) => {
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const remove360Image = () => {
    setImage360(null);
  }

  return (
    <motion.div 
      key="media" 
      initial={{ opacity: 0, x: -50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 50 }} 
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-6">Showcase your item</h2>
      <div>
        <label htmlFor="images" className="block text-sm font-medium mb-2">Upload Images (up to 10)</label>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-background">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (MAX. 5MB per image)</p>
            </div>
            <input id="dropzone-file" type="file" multiple onChange={handleImageChange} className="hidden" />
          </label>
        </div>
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {images.map((file, index) => (
              <div key={index} className="relative group aspect-square">
                <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md" />
                <button 
                  type="button" 
                  onClick={() => removeImage(index)} 
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">360° Image (Optional)</h3>
        {!image360 ? (
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file-360" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-background">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload 360° image</span></p>
              </div>
              <input id="dropzone-file-360" type="file" onChange={handle360ImageChange} className="hidden" accept="image/*" />
            </label>
          </div>
        ) : (
          <div className="mt-2 relative group w-full max-w-sm">
            <img src={URL.createObjectURL(image360)} alt="360 preview" className="w-full h-auto object-cover rounded-md" />
             <button 
              type="button" 
              onClick={remove360Image} 
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MediaStep; 