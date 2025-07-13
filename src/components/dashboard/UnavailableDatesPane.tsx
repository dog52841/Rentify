import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface UnavailableDatesPaneProps {
  listingId: string;
  onDatesChanged?: () => void;
}

export default function UnavailableDatesPane({ listingId, onDatesChanged }: UnavailableDatesPaneProps) {
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  const fetchUnavailableDates = async () => {
    try {
      setFetching(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-unavailable-dates?listing_id=${listingId}`,
        session ? {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        } : undefined
      );

      if (response.ok) {
        const { dates } = await response.json();
        setUnavailableDates(dates || []);
      } else {
        console.error('Failed to fetch unavailable dates');
        setUnavailableDates([]);
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
      setUnavailableDates([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUnavailableDates();
  }, [listingId]);

  const addUnavailableDates = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "No dates selected",
        description: "Please select dates to mark as unavailable.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage unavailable dates.",
          variant: "destructive",
        });
        return;
      }

      const dateStrings = selectedDates.map(date => 
        date.toISOString().split('T')[0]
      );

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-unavailable-dates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listing_id: listingId,
            dates: dateStrings,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `${selectedDates.length} date(s) marked as unavailable.`,
        });
        setSelectedDates([]);
        await fetchUnavailableDates();
        onDatesChanged?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add unavailable dates');
      }
    } catch (error) {
      console.error('Error adding unavailable dates:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add unavailable dates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeUnavailableDates = async (datesToRemove: string[]) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage unavailable dates.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/remove-unavailable-dates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listing_id: listingId,
            dates: datesToRemove,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `${datesToRemove.length} date(s) removed from unavailable list.`,
        });
        await fetchUnavailableDates();
        onDatesChanged?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove unavailable dates');
      }
    } catch (error) {
      console.error('Error removing unavailable dates:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove unavailable dates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = date.toISOString().split('T')[0];
    const isAlreadyUnavailable = unavailableDates.includes(dateString);
    
    if (isAlreadyUnavailable) {
      // Remove from unavailable dates
      removeUnavailableDates([dateString]);
    } else {
      // Add to selected dates
      setSelectedDates(prev => {
        const dateStr = date.toISOString().split('T')[0];
        const exists = prev.some(d => d.toISOString().split('T')[0] === dateStr);
        if (exists) {
          return prev.filter(d => d.toISOString().split('T')[0] !== dateStr);
        } else {
          return [...prev, date];
        }
      });
    }
  };

  const isDateUnavailable = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return unavailableDates.includes(dateString);
  };

  const isDateSelected = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return selectedDates.some(d => d.toISOString().split('T')[0] === dateString);
  };

  const clearSelectedDates = () => {
    setSelectedDates([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (fetching) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Manage Unavailable Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="flex items-center justify-center h-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Manage Unavailable Dates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select dates when your item will not be available for rent. Click on dates to toggle their availability.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar */}
        <motion.div 
          className="border rounded-lg p-4 bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => setSelectedDates(dates || [])}
            className="rounded-md border"
            disabled={(date) => {
              // Disable past dates
              return date < new Date(new Date().setHours(0, 0, 0, 0));
            }}
            modifiers={{
              unavailable: (date) => isDateUnavailable(date),
              selected: (date) => isDateSelected(date),
            }}
            modifiersClassNames={{
              unavailable: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              selected: "bg-primary text-primary-foreground hover:bg-primary/90",
            }}
          />
        </motion.div>

        {/* Selected Dates */}
        <AnimatePresence>
          {selectedDates.length > 0 && (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Selected Dates ({selectedDates.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedDates}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date) => (
                  <motion.div
                    key={date.toISOString()}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge variant="secondary" className="text-sm">
                      {formatDate(date.toISOString().split('T')[0])}
                    </Badge>
                  </motion.div>
                ))}
              </div>
              <Button 
                onClick={addUnavailableDates} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Mark {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''} as Unavailable
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Unavailable Dates */}
        <AnimatePresence>
          {unavailableDates.length > 0 && (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Currently Unavailable ({unavailableDates.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUnavailableDates(unavailableDates)}
                  disabled={loading}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Remove All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {unavailableDates.map((dateString) => (
                  <motion.div
                    key={dateString}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge 
                      variant="destructive" 
                      className="text-sm cursor-pointer hover:bg-destructive/90 transition-colors"
                      onClick={() => removeUnavailableDates([dateString])}
                    >
                      {formatDate(dateString)}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {unavailableDates.length === 0 && selectedDates.length === 0 && (
          <motion.div 
            className="text-center py-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-sm">All dates are currently available for booking.</p>
            <p className="text-xs mt-1">Select dates above to mark them as unavailable.</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
} 