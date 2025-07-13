import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Icon } from 'leaflet';
// Leaflet marker icon fix
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
const defaultIcon = new Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;
const parsePoint = (pointString) => {
    const match = /POINT\(([-\d\.]+) ([-\d\.]+)\)/.exec(pointString);
    if (!match)
        return null;
    return [parseFloat(match[2]), parseFloat(match[1])]; // lat, lng
};
function LocationPicker({ onLocationChange, initialPosition }) {
    const [position, setPosition] = useState(initialPosition);
    const map = useMapEvents({
        click(e) {
            const newPos = [e.latlng.lat, e.latlng.lng];
            setPosition(newPos);
            onLocationChange(e.latlng.lat, e.latlng.lng);
        },
    });
    useEffect(() => {
        if (initialPosition) {
            setPosition(initialPosition);
            map.flyTo(initialPosition, map.getZoom());
        }
    }, [initialPosition, map]);
    return position ? _jsx(Marker, { position: position }) : null;
}
const EditListingPage = () => {
    const { listingId } = useParams();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState(null);
    const [images, setImages] = useState([]);
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const initialMapPosition = useMemo(() => {
        if (!location)
            return null;
        return [location.lat, location.lng];
    }, [location]);
    useEffect(() => {
        const fetchListing = async () => {
            if (!listingId) {
                setError("Listing not found.");
                setLoading(false);
                return;
            }
            setLoading(true);
            
            try {
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', listingId)
                    .single();
                
                if (error || !data) {
                    throw new Error("Could not fetch listing data.");
                }
                
                // Authorization check - try both user_id and owner_id fields
                const ownerId = data.owner_id || data.user_id;
                
                if (ownerId !== profile?.id) {
                    setError("You are not authorized to edit this listing.");
                    setLoading(false);
                    return;
                }
                
                setTitle(data.title || '');
                setDescription(data.description || '');
                setPrice(data.price_per_day || '');
                
                // Handle different image field names
                const imageUrls = data.image_urls || data.images_urls || [];
                setExistingImageUrls(imageUrls);
                
                // Parse location
                if (data.location_geom) {
                    const point = parsePoint(data.location_geom);
                    if (point) {
                        setLocation({ lat: point[0], lng: point[1] });
                    }
                } else if (data.location_lat && data.location_lng) {
                    setLocation({ lat: data.location_lat, lng: data.location_lng });
                }
                
            } catch (error) {
                console.error("Error fetching listing:", error);
                setError("Could not fetch listing data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        
        if (profile) {
            fetchListing();
        }
    }, [listingId, profile]);
    const handleImageChange = (e) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profile || !location || !listingId) {
            setError("Cannot update listing. Missing required information.");
            return;
        }
        
        setUpdating(true);
        setError(null);
        
        let newImageUrls = [...existingImageUrls];
        
        // If new images are uploaded, upload them and delete old ones.
        if (images.length > 0) {
            const newUrls = [];
            
            try {
                for (const image of images) {
                    const fileName = `${profile.id}/${Date.now()}_${image.name}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('listing-images')
                        .upload(fileName, image);
                    
                    if (uploadError) {
                        throw new Error(`Failed to upload new image: ${uploadError.message}`);
                    }
                    
                    const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(uploadData.path);
                    newUrls.push(urlData.publicUrl);
                }
                
                // If upload was successful, remove old images from storage
                if (existingImageUrls.length > 0) {
                    const oldFilePaths = existingImageUrls.map(url => {
                        const parts = url.split('/');
                        return parts.slice(parts.indexOf('listing-images') + 1).join('/');
                    });
                    
                    await supabase.storage.from('listing-images').remove(oldFilePaths);
                }
                
                newImageUrls = newUrls;
            } catch (error) {
                setError(error.message);
                setUpdating(false);
                return;
            }
        }
        
        try {
            // First, check if the listing exists and what fields it has
            const { data: listingData, error: checkError } = await supabase
                .from('listings')
                .select('image_urls, images_urls')
                .eq('id', listingId)
                .single();
                
            if (checkError) throw new Error(`Failed to check listing: ${checkError.message}`);
            
            // Determine which image field to update based on what exists in the database
            const updateData = {
                title,
                description,
                price_per_day: parseFloat(price),
                location: `POINT(${location.lng} ${location.lat})`,
                location_lat: location.lat,
                location_lng: location.lng,
            };
            
            // Add the appropriate image field
            if ('image_urls' in listingData) {
                updateData.image_urls = newImageUrls;
            } else {
                updateData.images_urls = newImageUrls;
            }
            
            const { error: updateError } = await supabase
                .from('listings')
                .update(updateData)
                .eq('id', listingId);
                
            if (updateError) throw new Error(`Failed to update listing: ${updateError.message}`);
            
            navigate(`/listings/${listingId}`);
        } catch (error) {
            setError(error.message);
        } finally {
            setUpdating(false);
        }
    };
    if (loading) {
        return _jsx("div", { className: "text-center p-20", children: "Loading..." });
    }
    if (error) {
        return _jsx("div", { className: "text-center p-20 text-destructive", children: error });
    }
    return (_jsx("div", { className: "max-w-4xl mx-auto py-12 px-4", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("h1", { className: "text-4xl font-bold tracking-tight", children: "Edit Your Listing" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Update the details for your item below." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-card border rounded-2xl p-8 space-y-8", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium mb-1", children: "Title" }), _jsx("input", { type: "text", id: "title", value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium mb-1", children: "Description" }), _jsx("textarea", { id: "description", value: description, onChange: (e) => setDescription(e.target.value), required: true, rows: 5, className: "w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "price", className: "block text-sm font-medium mb-1", children: "Price per day ($)" }), _jsx("input", { type: "number", id: "price", value: price, onChange: (e) => setPrice(e.target.value), required: true, className: "w-full p-3 bg-muted rounded-md focus:ring-2 focus:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Current Images" }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4", children: existingImageUrls.map((url, index) => (_jsx("div", { className: "relative aspect-square", children: _jsx("img", { src: url, alt: `existing preview ${index}`, className: "w-full h-full object-cover rounded-md" }) }, index))) }), _jsx("label", { htmlFor: "images", className: "block text-sm font-medium mb-2", children: "Upload New Images (this will replace all current images)" }), _jsx("div", { className: "flex items-center justify-center w-full", children: _jsxs("label", { htmlFor: "dropzone-file", className: "flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-background", children: [_jsxs("div", { className: "flex flex-col items-center justify-center pt-5 pb-6", children: [_jsx(UploadCloud, { className: "w-10 h-10 mb-3 text-muted-foreground" }), _jsxs("p", { className: "mb-2 text-sm text-muted-foreground", children: [_jsx("span", { className: "font-semibold", children: "Click to upload" }), " or drag and drop"] })] }), _jsx("input", { id: "dropzone-file", type: "file", multiple: true, onChange: handleImageChange, className: "hidden" })] }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "Set Location" }), _jsx("div", { className: "h-80 w-full rounded-lg overflow-hidden border", children: _jsxs(MapContainer, { center: initialMapPosition || [51.505, -0.09], zoom: 13, style: { height: '100%', width: '100%' }, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }), _jsx(LocationPicker, { onLocationChange: (lat, lng) => setLocation({ lat, lng }), initialPosition: initialMapPosition })] }) }), location && _jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: ["Location selected: ", location.lat.toFixed(4), ", ", location.lng.toFixed(4)] })] })] }), _jsxs("div", { className: "flex justify-end gap-4", children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => navigate(`/listings/${listingId}`), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: updating, children: updating ? 'Updating...' : 'Save Changes' })] })] })] }) }));
};
export default EditListingPage;
