import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from './useDebounce';
import {
  isAbortError,
  LOCATION_UNAVAILABLE_MESSAGE,
  mergeLocationSuggestions,
  MIN_QUERY_LENGTH,
  searchLocation,
  searchLocalStops,
  type LocationSuggestion,
} from '@/services/locationSearch';
import {
  addRouteSearchHistoryItems,
  clearRouteSearchHistory,
  readRouteSearchHistory,
  removeRouteSearchHistoryItem,
  type RouteSearchHistoryItem,
} from '@/lib/routeSearchHistory';

const SEARCH_DEBOUNCE_MS = 350;

/** Hasil geocoder untuk satu teks; hanya diubah di callback async (tidak di body effect). */
interface RemoteSearchState {
  query: string;
  status: 'done' | 'error';
  results: LocationSuggestion[];
}

const EMPTY_REMOTE: RemoteSearchState = { query: '', status: 'done', results: [] };

interface SearchView {
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  searchError: string;
}

/**
 * Turunkan tampilan pencarian saat render dari teks live, teks debounce, dan
 * hasil remote — tanpa setState sinkron di dalam effect.
 */
function deriveSearchView(
  liveQuery: string,
  debouncedQuery: string,
  remote: RemoteSearchState,
): SearchView {
  const live = liveQuery.trim();
  const debounced = debouncedQuery.trim();
  const remoteCurrent = debounced.length >= MIN_QUERY_LENGTH && remote.query === debounced;
  const typingPending = live !== debounced;

  const local = searchLocalStops(live);
  const suggestions = remoteCurrent
    ? mergeLocationSuggestions(local, remote.results)
    : local;
  const isLoading = live.length >= MIN_QUERY_LENGTH && (typingPending || !remoteCurrent);
  const searchError =
    remoteCurrent && remote.status === 'error' ? LOCATION_UNAVAILABLE_MESSAGE : '';

  return { suggestions, isLoading, searchError };
}

function useRemoteSearch(liveQuery: string, debouncedQuery: string) {
  const [remote, setRemote] = useState<RemoteSearchState>(EMPTY_REMOTE);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (query.length < MIN_QUERY_LENGTH) return;
    // Sudah pernah dicoba untuk teks ini (sukses maupun gagal) → jangan ulang otomatis.
    if (remote.query === query) return;

    const controller = new AbortController();
    searchLocation(query, { signal: controller.signal })
      .then((results) => {
        if (controller.signal.aborted) return;
        setRemote({ query, results, status: 'done' });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        // Galat jaringan/timeout/rate-limit → tampil sebagai pesan Indonesia di dropdown.
        setRemote({ query, results: [], status: 'error' });
      });

    return () => controller.abort();
  }, [debouncedQuery, remote.query]);

  /**
   * Ulangi pencarian untuk teks yang sama hanya bila terakhir gagal —
   * dipanggil saat field difokuskan lagi ("Coba lagi sebentar").
   */
  const retry = useCallback(() => {
    setRemote((prev) => (prev.status === 'error' ? EMPTY_REMOTE : prev));
  }, []);

  const view = useMemo(
    () => deriveSearchView(liveQuery, debouncedQuery, remote),
    [liveQuery, debouncedQuery, remote],
  );

  return { view, retry };
}

export function useRouteSearchInput(userId: number | null = null) {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [activeField, setActiveFieldState] = useState<'origin' | 'destination' | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<LocationSuggestion | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<LocationSuggestion | null>(null);

  // Riwayat dibaca dari localStorage saat userId berubah (penyesuaian saat render,
  // bukan effect, agar tidak ada setState sinkron di dalam effect).
  const [historyOwner, setHistoryOwner] = useState<number | null>(userId);
  const [history, setHistory] = useState<RouteSearchHistoryItem[]>(() =>
    readRouteSearchHistory(userId),
  );
  if (userId !== historyOwner) {
    setHistoryOwner(userId);
    setHistory(readRouteSearchHistory(userId));
  }

  const debouncedOriginQuery = useDebounce(originQuery, SEARCH_DEBOUNCE_MS);
  const debouncedDestinationQuery = useDebounce(destinationQuery, SEARCH_DEBOUNCE_MS);

  const originSearch = useRemoteSearch(originQuery, debouncedOriginQuery);
  const destinationSearch = useRemoteSearch(destinationQuery, debouncedDestinationQuery);
  const { retry: retryOrigin } = originSearch;
  const { retry: retryDestination } = destinationSearch;

  /**
   * Setter field aktif milik komponen: fokus ke field sekaligus mengulang
   * pencarian bila pencarian terakhir untuk field itu gagal.
   */
  const setActiveField = useCallback(
    (field: 'origin' | 'destination' | null) => {
      setActiveFieldState(field);
      if (field === 'origin') retryOrigin();
      else if (field === 'destination') retryDestination();
    },
    [retryOrigin, retryDestination],
  );

  const handleSelectSuggestion = (suggestion: LocationSuggestion, field: 'origin' | 'destination') => {
    if (field === 'origin') {
      setOriginQuery(suggestion.name);
      setSelectedOrigin(suggestion);
    } else {
      setDestinationQuery(suggestion.name);
      setSelectedDestination(suggestion);
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
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setActiveField(null);
  };

  const saveLocationsToHistory = useCallback(
    (origin: LocationSuggestion, destination: LocationSuggestion) => {
      setHistory(addRouteSearchHistoryItems([origin, destination], userId));
    },
    [userId],
  );

  const removeHistoryItem = useCallback(
    (id: string) => {
      setHistory(removeRouteSearchHistoryItem(id, userId));
    },
    [userId],
  );

  const clearHistory = useCallback(() => {
    setHistory(clearRouteSearchHistory(userId));
  }, [userId]);

  return {
    // State
    originQuery,
    destinationQuery,
    originSuggestions: originSearch.view.suggestions,
    destinationSuggestions: destinationSearch.view.suggestions,
    activeField,
    isLoadingOrigin: originSearch.view.isLoading,
    isLoadingDestination: destinationSearch.view.isLoading,
    originSearchError: originSearch.view.searchError,
    destinationSearchError: destinationSearch.view.searchError,
    selectedOrigin,
    selectedDestination,
    history,

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
    saveLocationsToHistory,
    removeHistoryItem,
    clearHistory,
  };
}
