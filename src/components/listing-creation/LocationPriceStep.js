import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
// You might need to import Leaflet's CSS in your main app entry file (e.g., main.tsx or App.tsx)
// import 'leaflet/dist/leaflet.css';
// Fix for default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
const LocationPicker = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });
    return position === null ? null : (_jsx(Marker, { position: position }));
};
const LocationPriceStep = ({ onNext, onPrev, formData }) => {
    const [position, setPosition] = useState(formData.location || null);
    const [address, setAddress] = useState(formData.address || 'Approx. location from map');
    const [pricePerDay, setPricePerDay] = useState(formData.price_per_day ? formData.price_per_day.toString() : '');
    const [pricePerWeek, setPricePerWeek] = useState(formData.price_per_week ? formData.price_per_week.toString() : '');
    const [pricePerMonth, setPricePerMonth] = useState(formData.price_per_month ? formData.price_per_month.toString() : '');
    const handleNext = () => {
        if (!position || !pricePerDay) {
            alert('Please select a location on the map and set a daily price.');
            return;
        }
        onNext({
            location: position,
            address: address, // For now, a static address. Later, this can come from reverse geocoding.
            price_per_day: parseFloat(pricePerDay),
            price_per_week: pricePerWeek ? parseFloat(pricePerWeek) : undefined,
            price_per_month: pricePerMonth ? parseFloat(pricePerMonth) : undefined,
        });
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 }, children: [_jsx("h2", { className: "text-2xl font-bold mb-2 text-gray-900 dark:text-white", children: "Location & Price" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-6", children: "Set your item's location and rental prices." }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsx("div", { className: "space-y-6", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Location" }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-2", children: "Click on the map to set your item's approximate location. Don't worry, the exact address won't be shown to others." }), _jsx("div", { className: "h-64 w-full rounded-lg overflow-hidden z-0", children: _jsxs(MapContainer, { center: position || [51.505, -0.09], zoom: 13, scrollWheelZoom: false, className: "h-full w-full", children: [_jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(LocationPicker, { position: position, setPosition: setPosition })] }) }), position && _jsxs("div", { className: "mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center", children: [_jsx(MapPin, { className: "w-4 h-4 mr-2" }), " Latitude: ", position.lat.toFixed(4), ", Longitude: ", position.lng.toFixed(4)] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "pricePerDay", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Price per Day" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx("span", { className: "text-gray-500 sm:text-sm", children: "$" }) }), _jsx(Input, { id: "pricePerDay", type: "number", value: pricePerDay, onChange: e => setPricePerDay(e.target.value), placeholder: "25.00", className: "pl-7" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "pricePerWeek", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Price per Week (Optional)" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx("span", { className: "text-gray-500 sm:text-sm", children: "$" }) }), _jsx(Input, { id: "pricePerWeek", type: "number", value: pricePerWeek, onChange: e => setPricePerWeek(e.target.value), placeholder: "150.00", className: "pl-7" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "pricePerMonth", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Price per Month (Optional)" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx("span", { className: "text-gray-500 sm:text-sm", children: "$" }) }), _jsx(Input, { id: "pricePerMonth", type: "number", value: pricePerMonth, onChange: e => setPricePerMonth(e.target.value), placeholder: "500.00", className: "pl-7" })] })] })] })] }), _jsxs("div", { className: "mt-8 flex justify-between", children: [_jsxs(Button, { onClick: onPrev, variant: "outline", children: [_jsx(ChevronLeft, { className: "w-4 h-4 mr-2" }), " Previous"] }), _jsxs(Button, { onClick: handleNext, children: ["Next ", _jsx(ChevronRight, { className: "w-4 h-4 ml-2" })] })] })] }));
};
export default LocationPriceStep;
