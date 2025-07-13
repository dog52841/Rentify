import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L, {} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '../../hooks/use-toast';
import { Search, MapPin, Info, DollarSign, Clock, AlertCircle, Locate } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/card';
// Leaflet marker icon fix
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
// This is a simplified version of the LocationPicker from the main page
// It's kept here to be self-contained, but could be further abstracted
const defaultIcon = new L.Icon({
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
function LocationPicker({ onLocationChange, initialLocation }) {
    const [position, setPosition] = useState(initialLocation ? [initialLocation.lat, initialLocation.lng] : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState([34.0522, -118.2437]); // Default to LA
    const [zoom, setZoom] = useState(13);
    const { toast } = useToast();
    // Try to get user's location on mount for better initial position
    useEffect(() => {
        if (navigator.geolocation && !initialLocation) {
            navigator.geolocation.getCurrentPosition(position => {
                setMapCenter([position.coords.latitude, position.coords.longitude]);
            }, error => {
                console.error("Error getting location:", error);
            });
        }
    }, [initialLocation]);
    const handleLocationSelect = useCallback(async (lat, lng, map) => {
        try {
            // Fetch address using Nominatim reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            if (!response.ok)
                throw new Error('Failed to fetch address');
            const data = await response.json();
            // Extract address components
            const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            const city = data.address?.city || data.address?.town || data.address?.village || '';
            const state = data.address?.state || '';
            const country = data.address?.country || '';
            const postalCode = data.address?.postcode || '';
            onLocationChange({
                lat,
                lng,
                address,
                city,
                state,
                country,
                postalCode
            });
            // Set a popup at the clicked location
            L.popup()
                .setLatLng([lat, lng])
                .setContent(`<p class="font-medium text-sm">${address}</p>`)
                .openOn(map);
        }
        catch (error) {
            console.error("Reverse geocoding error:", error);
            toast({
                variant: 'destructive',
                title: 'Could not fetch address',
                description: 'Please try selecting a location again.',
            });
            // Fallback to coordinates
            onLocationChange({
                lat,
                lng,
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            });
        }
        finally {
            setLoading(false);
        }
    }, [onLocationChange, toast]);
    const MapEvents = () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const mapInstance = useMapEvents({
            click: (e) => {
                const { lat, lng } = e.latlng;
                setPosition(e.latlng);
                setLoading(true);
                handleLocationSelect(lat, lng, mapInstance);
            },
        });
        return null;
    };
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim())
            return;
        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            if (!response.ok)
                throw new Error('Search failed');
            const data = await response.json();
            if (data.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'Location not found',
                    description: 'Try a different search term.',
                });
                return;
            }
            // Use the first result
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            // Set map center and position
            setMapCenter([lat, lng]);
            setPosition([lat, lng]);
            setZoom(16);
            // Set location data
            onLocationChange({
                lat,
                lng,
                address: result.display_name,
                city: result?.address?.city || result?.address?.town || result?.address?.village || '',
                state: result?.address?.state || '',
                country: result?.address?.country || '',
                postalCode: result?.address?.postcode || ''
            });
        }
        catch (error) {
            console.error("Search error:", error);
            toast({
                variant: 'destructive',
                title: 'Search failed',
                description: 'Please try again with different terms.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setMapCenter([lat, lng]);
                setPosition([lat, lng]);
                setZoom(16);
                // Fetch address for the user's location
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
                    if (!response.ok)
                        throw new Error('Failed to fetch address');
                    const data = await response.json();
                    // Extract address components
                    const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    const city = data.address?.city || data.address?.town || data.address?.village || '';
                    const state = data.address?.state || '';
                    const country = data.address?.country || '';
                    const postalCode = data.address?.postcode || '';
                    onLocationChange({
                        lat,
                        lng,
                        address,
                        city,
                        state,
                        country,
                        postalCode
                    });
                    toast({
                        title: "Location found",
                        description: address,
                    });
                }
                catch (error) {
                    console.error("Reverse geocoding error:", error);
                    // Fallback to coordinates
                    onLocationChange({
                        lat,
                        lng,
                        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                    });
                }
            }, (error) => {
                console.error("Error getting location:", error);
                toast({
                    variant: 'destructive',
                    title: 'Could not get your location',
                    description: 'Please make sure location services are enabled.',
                });
            });
        }
        else {
            toast({
                variant: 'destructive',
                title: 'Geolocation not supported',
                description: 'Your browser does not support geolocation.',
            });
        }
    };
    return (_jsxs(Card, { className: "p-4 bg-card/50 backdrop-blur-sm border-border/30 rounded-lg shadow-lg", children: [_jsx("div", { className: "mb-4", children: _jsxs("form", { onSubmit: handleSearch, className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search for a location...", className: "pl-9" })] }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? "Searching..." : "Search" }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { type: "button", variant: "outline", size: "icon", onClick: handleUserLocation, children: _jsx(Locate, { size: 18 }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Use my current location" }) })] }) })] }) }), _jsx("div", { className: "rounded-lg overflow-hidden border z-0 shadow-inner", children: _jsxs(MapContainer, { center: mapCenter, zoom: zoom, style: { height: '400px', width: '100%' }, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }), _jsx(MapEvents, {}), position && (_jsx(Marker, { position: position, children: _jsx(Popup, { children: "Selected location" }) }))] }, `${typeof mapCenter === 'object' && 'lat' in mapCenter
                    ? `${mapCenter.lat}-${mapCenter.lng}`
                    : `${mapCenter[0]}-${mapCenter[1]}`}-${zoom}`) }), _jsxs("div", { className: "mt-4 flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(AlertCircle, { size: 16 }), _jsx("p", { children: "Click on the map to set the exact pickup location or search for an address." })] })] }));
}
const LocationPriceStep = ({ price, setPrice, location, setLocation, errors = {}, }) => {
    const [additionalInfo, setAdditionalInfo] = useState(location?.additionalInfo || '');
    const [meetupInstructions, setMeetupInstructions] = useState(location?.meetupInstructions || '');
    const [availabilityType, setAvailabilityType] = useState('anytime');
    const [customTimeFrame, setCustomTimeFrame] = useState('weekdays');
    // Update parent state with all location data
    const handleLocationChange = (locationData) => {
        // Preserve additional fields if they exist
        setLocation({
            ...locationData,
            additionalInfo: additionalInfo || locationData.additionalInfo,
            meetupInstructions: meetupInstructions || locationData.meetupInstructions
        });
    };
    // Update additional fields
    useEffect(() => {
        if (location && (additionalInfo || meetupInstructions)) {
            setLocation({
                ...location,
                additionalInfo,
                meetupInstructions
            });
        }
    }, [additionalInfo, meetupInstructions, location, setLocation]);
    return (_jsxs(motion.div, { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 }, transition: { duration: 0.3 }, className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Set your price and location" }), _jsx("p", { className: "text-muted-foreground", children: "Let renters know how much your item costs and where they can pick it up." })] }), _jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "price", className: "block text-sm font-medium mb-1 flex items-center gap-1", children: [_jsx(DollarSign, { className: "h-4 w-4" }), "Price per day"] }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", children: "$" }), _jsx(Input, { type: "number", id: "price", value: price, onChange: (e) => setPrice(e.target.value), required: true, className: `pl-8 ${errors.price ? 'border-destructive' : ''}`, placeholder: "50", min: "1", step: "0.01" })] }), errors.price && (_jsx("p", { className: "text-destructive text-sm mt-1", children: errors.price })), _jsxs("div", { className: "mt-2 flex justify-between text-xs text-muted-foreground", children: [_jsx("span", { children: "Min: $1/day" }), _jsxs("span", { children: ["Recommended: $", Math.max(1, parseFloat(price) || 0) * 0.9, "-$", Math.max(1, parseFloat(price) || 0) * 1.1, "/day"] })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium mb-1 flex items-center gap-1", children: [_jsx(Clock, { className: "h-4 w-4" }), "Availability"] }), _jsxs(Select, { value: availabilityType, onValueChange: setAvailabilityType, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select availability" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "anytime", children: "Available anytime" }), _jsx(SelectItem, { value: "custom", children: "Custom time frame" })] })] }), availabilityType === 'custom' && (_jsx("div", { className: "mt-2", children: _jsxs(Select, { value: customTimeFrame, onValueChange: setCustomTimeFrame, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select time frame" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "weekdays", children: "Weekdays only" }), _jsx(SelectItem, { value: "weekends", children: "Weekends only" }), _jsx(SelectItem, { value: "evenings", children: "Evenings only" }), _jsx(SelectItem, { value: "mornings", children: "Mornings only" })] })] }) }))] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("label", { htmlFor: "additionalInfo", className: "block text-sm font-medium mb-1 flex items-center gap-1", children: [_jsx(Info, { className: "h-4 w-4" }), "Additional Location Information"] }), _jsx(Textarea, { id: "additionalInfo", value: additionalInfo, onChange: (e) => setAdditionalInfo(e.target.value), placeholder: "Describe any additional details about the pickup location (e.g., parking availability, landmarks)", rows: 3 })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("label", { htmlFor: "meetupInstructions", className: "block text-sm font-medium mb-1 flex items-center gap-1", children: [_jsx(MapPin, { className: "h-4 w-4" }), "Meetup Instructions"] }), _jsx(Textarea, { id: "meetupInstructions", value: meetupInstructions, onChange: (e) => setMeetupInstructions(e.target.value), placeholder: "Provide instructions for meeting up (e.g., 'Call me when you arrive', 'Meet at the lobby')", rows: 3 })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("h3", { className: "text-sm font-medium mb-1 flex items-center gap-1", children: [_jsx(MapPin, { className: "h-4 w-4" }), "Pickup Location"] }), _jsx(LocationPicker, { onLocationChange: handleLocationChange, initialLocation: location }), errors.location && (_jsx("p", { className: "text-destructive text-sm mt-1", children: errors.location })), location && (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx(Badge, { variant: "outline", className: "bg-primary/10", children: "Location Selected" }) }), _jsxs("p", { className: "text-sm", children: [_jsx("strong", { children: "Address:" }), " ", location.address] }), location.city && (_jsxs("p", { className: "text-sm", children: [_jsx("strong", { children: "City:" }), " ", location.city, location.state && `, ${location.state}`, location.country && `, ${location.country}`, location.postalCode && ` ${location.postalCode}`] })), _jsxs("p", { className: "text-sm", children: [_jsx("strong", { children: "Coordinates:" }), " ", location.lat.toFixed(6), ", ", location.lng.toFixed(6)] })] }))] })] }) })] }, "location"));
};
export default LocationPriceStep;
