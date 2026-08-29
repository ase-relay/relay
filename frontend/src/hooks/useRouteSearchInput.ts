import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { searchLocationMock, LocationSuggestion } from '@/services/mock/locationSearch';

export function useRouteSearchInput() {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [isLoadingOrigin, setIsLoadingOrigin] = useState(false);
  const [isLoadingDestination, setIsLoadingDestination] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<LocationSuggestion | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<LocationSuggestion | null>(null);

  const activeFieldRef = useRef<'origin' | 'destination' | null>(null);

  const debouncedOriginQuery = useDebounce(originQuery, 400);
  const debouncedDestinationQuery = useDebounce(destinationQuery, 400);

  // Sync ref with state
  useEffect(() => {
    activeFieldRef.current = activeField;
  }, [activeField]);

  // Effect untuk origin search
  useEffect(() => {
    let ignore = false;

    if (debouncedOriginQuery.length < 2 || activeFieldRef.current !== 'origin') {
      setOriginSuggestions([]);
      return;
    }

    setIsLoadingOrigin(true);
    searchLocationMock(debouncedOriginQuery).then((results) => {
      if (!ignore) {
        setOriginSuggestions(results);
        setIsLoadingOrigin(false);
      }
    });

    return () => { ignore = true; };
  }, [debouncedOriginQuery]);

  // Effect untuk destination search
  useEffect(() => {
    let ignore = false;

    if (debouncedDestinationQuery.length < 2 || activeFieldRef.current !== 'destination') {
      setDestinationSuggestions([]);
      return;
    }

    setIsLoadingDestination(true);
    searchLocationMock(debouncedDestinationQuery).then((results) => {
      if (!ignore) {
        setDestinationSuggestions(results);
        setIsLoadingDestination(false);
      }
    });

    return () => { ignore = true; };
  }, [debouncedDestinationQuery]);

  const handleSelectSuggestion = (suggestion: LocationSuggestion, field: 'origin' | 'destination') => {
    if (field === 'origin') {
      setOriginQuery(suggestion.name);
      setSelectedOrigin(suggestion);
      setOriginSuggestions([]);
    } else {
      setDestinationQuery(suggestion.name);
      setSelectedDestination(suggestion);
      setDestinationSuggestions([]);
    }
    setActiveField(null);
  };

  const handleSwap = () => {
    const tempQuery = originQuery;
    const tempSelected = selectedOrigin;

    setOriginQuery(destinationQuery);
    setSelectedOrigin(selectedDestination);

    setDestinationQuery(tempQuery);
    setSelectedDestination(tempSelected);
  };

  const handleReset = () => {
    setOriginQuery('');
    setDestinationQuery('');
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setActiveField(null);
  };

  return {
    // State
    originQuery,
    destinationQuery,
    originSuggestions,
    destinationSuggestions,
    activeField,
    isLoadingOrigin,
    isLoadingDestination,
    selectedOrigin,
    selectedDestination,

    // Setters
    setOriginQuery,
    setDestinationQuery,
    setActiveField,
    setSelectedOrigin,
    setSelectedDestination,

    // Handlers
    handleSelectSuggestion,
    handleSwap,
    handleReset,
  };
}
