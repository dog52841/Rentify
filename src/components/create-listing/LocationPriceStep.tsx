import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L, { type LatLngExpression, type LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '../../hooks/use-toast';
import { Search, MapPin, Info, DollarSign, Clock, AlertCircle, Locate, CheckCircle, Loader2 } from 'lucide-react';
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

export type ExtendedLocationData = {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  additionalInfo?: string;
  meetupInstructions?: string;
};

function LocationPicker({ 
  onLocationChange, 
  initialLocation 
}: { 
  onLocationChange: (location: ExtendedLocationData) => void,
  initialLocation: ExtendedLocationData | null
}) {
    const [position, setPosition] = useState<LatLngExpression | null>(
      initialLocation ? [initialLocation.lat, initialLocation.lng] : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([34.0522, -118.2437]); // Default to LA
    const [zoom, setZoom] = useState(13);
    const { toast } = useToast();
    
    // Try to get user's location on mount for better initial position
    useEffect(() => {
      if (navigator.geolocation && !initialLocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            setMapCenter([position.coords.latitude, position.coords.longitude]);
          },
          error => {
            console.error("Error getting location:", error);
          }
        );
      }
    }, [initialLocation]);
    
    const handleLocationSelect = useCallback(async (lat: number, lng: number, map: L.Map) => {
      try {
        // Fetch address using Nominatim reverse geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        if (!response.ok) throw new Error('Failed to fetch address');
        
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
      } catch (error) {
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
      } finally {
        setLoading(false);
      }
    }, [onLocationChange, toast]);
  
    const MapEvents = () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const mapInstance = useMapEvents({
        click: (e: LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setPosition(e.latlng);
          
          setLoading(true);
          handleLocationSelect(lat, lng, mapInstance);
        },
      });
      return null;
    };
    
    const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!searchQuery.trim()) return;
      
      setLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        
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
      } catch (error) {
        console.error("Search error:", error);
        toast({
          variant: 'destructive',
          title: 'Search failed',
          description: 'Please try again with different terms.',
        });
      } finally {
        setLoading(false);
      }
    };
    
    const handleUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            setMapCenter([lat, lng]);
            setPosition([lat, lng]);
            setZoom(16);
            
            // Fetch address for the user's location
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
              if (!response.ok) throw new Error('Failed to fetch address');
              
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
            } catch (error) {
              console.error("Reverse geocoding error:", error);
              // Fallback to coordinates
              onLocationChange({
                lat,
                lng,
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
              });
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            toast({
              variant: 'destructive',
              title: 'Could not get your location',
              description: 'Please make sure location services are enabled.',
            });
          }
        );
      } else {
        toast({
          variant: 'destructive',
          title: 'Geolocation not supported',
          description: 'Your browser does not support geolocation.',
        });
      }
    };
  
    return (
      <Card className="p-6 bg-card/80 backdrop-blur-xl border-border/30 rounded-2xl shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Pickup Location</h3>
          </div>
          
          {/* Enhanced Search Bar */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for an address, city, or landmark..." 
                className="pl-12 pr-4 py-3 text-base rounded-xl border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleUserLocation}
                        className="h-8 w-8 rounded-lg hover:bg-primary/10"
                      >
                        <Locate size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Use my current location</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button 
                  type="submit" 
                  disabled={loading || !searchQuery.trim()}
                  className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </div>
          </form>
          
          {/* Location Status */}
          {position && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Location selected</span>
            </div>
          )}
        </div>
        
        {/* Enhanced Map Container */}
        <div className="relative rounded-xl overflow-hidden border-2 border-border/30 shadow-lg">
          <MapContainer 
            center={mapCenter} 
            zoom={zoom} 
            style={{ height: '450px', width: '100%' }}
            key={`${typeof mapCenter === 'object' && 'lat' in mapCenter 
              ? `${mapCenter.lat}-${mapCenter.lng}`
              : `${mapCenter[0]}-${mapCenter[1]}`}-${zoom}`}
            className="rounded-xl"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents />
            {position && (
              <Marker position={position}>
                <Popup className="text-sm font-medium">
                  <div className="text-center">
                    <MapPin className="h-4 w-4 mx-auto mb-1 text-primary" />
                    Selected pickup location
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
          
          {/* Map Instructions Overlay */}
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Click on the map to set pickup location</span>
            </div>
          </div>
          
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="flex items-center gap-3 bg-background/90 px-4 py-2 rounded-lg border border-border/50">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Finding location...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Instructions */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">How to set your pickup location:</p>
              <ul className="space-y-1 text-xs">
                <li>• Search for an address or landmark above</li>
                <li>• Click anywhere on the map to set the exact location</li>
                <li>• Use the "Use my location" button for your current position</li>
                <li>• The selected location will be shown to renters</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );
}

interface LocationPriceStepProps {
    price: string;
    setPrice: (price: string) => void;
    location: ExtendedLocationData | null;
    setLocation: (location: ExtendedLocationData | null) => void;
    errors?: Record<string, string>;
}

const LocationPriceStep: React.FC<LocationPriceStepProps> = ({
    price,
    setPrice,
    location,
    setLocation,
    errors = {},
}) => {
    const [additionalInfo, setAdditionalInfo] = useState(location?.additionalInfo || '');
    const [meetupInstructions, setMeetupInstructions] = useState(location?.meetupInstructions || '');
    const [availabilityType, setAvailabilityType] = useState('anytime');
    const [customTimeFrame, setCustomTimeFrame] = useState('weekdays');
    
    // Update parent state with all location data
    const handleLocationChange = (locationData: ExtendedLocationData) => {
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

    return (
        <motion.div 
            key="location" 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 50 }} 
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            <div>
              <h2 className="text-2xl font-bold mb-2">Set your price and location</h2>
              <p className="text-muted-foreground">Let renters know how much your item costs and where they can pick it up.</p>
            </div>
            
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium mb-1 flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                Price per day
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input 
                                    type="number" 
                                    id="price" 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)} 
                                    required 
                                    className={`pl-8 ${errors.price ? 'border-destructive' : ''}`}
                                    placeholder="50" 
                                    min="1"
                                    step="0.01"
                                />
                            </div>
                            {errors.price && (
                              <p className="text-destructive text-sm mt-1">{errors.price}</p>
                            )}
                            
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                <span>Min: $1/day</span>
                                <span>Recommended: ${Math.max(1, parseFloat(price) || 0) * 0.9}-${Math.max(1, parseFloat(price) || 0) * 1.1}/day</span>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Availability
                            </label>
                            <Select value={availabilityType} onValueChange={setAvailabilityType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select availability" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="anytime">Available anytime</SelectItem>
                                    <SelectItem value="custom">Custom time frame</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            {availabilityType === 'custom' && (
                                <div className="mt-2">
                                    <Select value={customTimeFrame} onValueChange={setCustomTimeFrame}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select time frame" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekdays">Weekdays only</SelectItem>
                                            <SelectItem value="weekends">Weekends only</SelectItem>
                                            <SelectItem value="evenings">Evenings only</SelectItem>
                                            <SelectItem value="mornings">Mornings only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-1">
                            <label htmlFor="additionalInfo" className="block text-sm font-medium mb-1 flex items-center gap-1">
                                <Info className="h-4 w-4" />
                                Additional Location Information
                            </label>
                            <Textarea 
                                id="additionalInfo" 
                                value={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.value)} 
                                placeholder="Describe any additional details about the pickup location (e.g., parking availability, landmarks)"
                                rows={3}
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label htmlFor="meetupInstructions" className="block text-sm font-medium mb-1 flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                Meetup Instructions
                            </label>
                            <Textarea 
                                id="meetupInstructions" 
                                value={meetupInstructions}
                                onChange={(e) => setMeetupInstructions(e.target.value)} 
                                placeholder="Provide instructions for meeting up (e.g., 'Call me when you arrive', 'Meet at the lobby')"
                                rows={3}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Pickup Location
                        </h3>
                        <LocationPicker 
                            onLocationChange={handleLocationChange} 
                            initialLocation={location}
                        />
                        {errors.location && (
                          <p className="text-destructive text-sm mt-1">{errors.location}</p>
                        )}
                        
                        {location && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-primary/10">
                                        Location Selected
                                    </Badge>
                                </div>
                                <p className="text-sm"><strong>Address:</strong> {location.address}</p>
                                {location.city && (
                                    <p className="text-sm">
                                        <strong>City:</strong> {location.city}
                                        {location.state && `, ${location.state}`}
                                        {location.country && `, ${location.country}`}
                                        {location.postalCode && ` ${location.postalCode}`}
                                    </p>
                                )}
                                <p className="text-sm"><strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default LocationPriceStep; 