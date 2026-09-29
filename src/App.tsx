/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LocationPermission } from './components/LocationPermission';
import { LocationStatus } from './components/LocationStatus';
import { SearchBar } from './components/SearchBar';
import { SearchFilters } from './components/SearchFilters';
import { StoreList } from './components/StoreList';
import { InteractiveMap } from './components/InteractiveMap';
import { StoreDetailsModal } from './components/StoreDetailsModal';
import { ManualLocationModal } from './components/ManualLocationModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { Chatbot } from './components/Chatbot';
import { Footer } from './components/Footer';
import { JewelryStore, UserLocation, FilterState, StoreCategory, SortOption } from './types/store';
import { searchNearbyStoresOSM, reverseGeocode } from './services/placesService';
import { searchNearbyGooglePlaces, fetchGooglePlaceDetails } from './services/googleMapsService';
import { calculateHaversineDistanceMeters } from './utils/distance';
import { AlertCircle, Map, List, Compass, Sparkles, Filter } from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  query: '',
  radiusKm: 10,
  minRating: 0,
  openNowOnly: false,
  storeType: 'all',
  sortBy: 'distance',
};

export default function App() {
  // Provider configuration
  const [googleApiKey, setGoogleApiKey] = useState<string>(() => {
    return (
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      localStorage.getItem('jewelfinder_google_api_key') ||
      ''
    );
  });
  const [activeProvider, setActiveProvider] = useState<'google' | 'osm'>(() => {
    const saved = localStorage.getItem('jewelfinder_provider');
    if (saved === 'google' || saved === 'osm') return saved;
    return (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ? 'google' : 'osm';
  });

  // User location state
  const [userLocation, setUserLocation] = useState<UserLocation>({
    coords: null,
    accuracy: null,
    timestamp: null,
    status: 'prompt',
    isLiveTracking: false,
    isManualLocation: false,
  });

  // Stores and Filtering
  const [rawStores, setRawStores] = useState<JewelryStore[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Active store selection & modals
  const [selectedStore, setSelectedStore] = useState<JewelryStore | null>(null);
  const [detailStore, setDetailStore] = useState<JewelryStore | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  // Bookmarking favorites
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('jewelfinder_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Geolocation watcher reference
  const watchIdRef = useRef<number | null>(null);
  const lastFetchedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Toggle bookmark helper
  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('jewelfinder_bookmarks', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn('Failed to save bookmarks:', err);
      }
      return next;
    });
  };

  // Request browser geolocation
  const handleRequestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setUserLocation((prev) => ({
        ...prev,
        status: 'unavailable',
        errorMessage: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setUserLocation((prev) => ({ ...prev, status: 'requesting', errorMessage: undefined }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const coords = { lat: latitude, lng: longitude };

        // Reverse geocode to get city name
        const locationName = await reverseGeocode(latitude, longitude);

        setUserLocation({
          coords,
          accuracy,
          timestamp: Date.now(),
          status: 'granted',
          isLiveTracking: true,
          isManualLocation: false,
          locationName,
        });

        startLiveWatching();
      },
      (err) => {
        let status: UserLocation['status'] = 'error';
        let errorMessage = 'Unable to retrieve location.';

        if (err.code === err.PERMISSION_DENIED) {
          status = 'denied';
          errorMessage = 'Location permission was denied. You can enter an address manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          status = 'unavailable';
          errorMessage = 'Location information is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          status = 'timeout';
          errorMessage = 'The request to obtain your location timed out.';
        }

        setUserLocation((prev) => ({
          ...prev,
          status,
          errorMessage,
          isLiveTracking: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  // Continuous tracking via watchPosition
  const startLiveWatching = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const newCoords = { lat: latitude, lng: longitude };

        setUserLocation((prev) => {
          if (prev.isManualLocation) return prev; // Do not overwrite manual entry
          return {
            ...prev,
            coords: newCoords,
            accuracy,
            timestamp: Date.now(),
            status: 'granted',
            isLiveTracking: true,
          };
        });

        // Recalculate distance to existing stores in real-time
        setRawStores((prev) =>
          prev.map((s) => ({
            ...s,
            distanceMeters: calculateHaversineDistanceMeters(latitude, longitude, s.lat, s.lng),
          }))
        );

        // If user moved significantly (> 400m from last API query), schedule an update
        if (lastFetchedCoordsRef.current) {
          const movedMeters = calculateHaversineDistanceMeters(
            lastFetchedCoordsRef.current.lat,
            lastFetchedCoordsRef.current.lng,
            latitude,
            longitude
          );
          if (movedMeters > 400) {
            fetchStoresForCoords(newCoords, filters);
          }
        }
      },
      (err) => {
        console.warn('watchPosition error:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
      }
    );
  }, [filters]);

  const toggleLiveTracking = () => {
    if (userLocation.isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setUserLocation((prev) => ({ ...prev, isLiveTracking: false }));
    } else {
      setUserLocation((prev) => ({ ...prev, isLiveTracking: true }));
      startLiveWatching();
    }
  };

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Set manual location
  const handleManualLocation = (lat: number, lng: number, displayName: string) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const coords = { lat, lng };
    setUserLocation({
      coords,
      accuracy: null,
      timestamp: Date.now(),
      status: 'granted',
      isLiveTracking: false,
      isManualLocation: true,
      locationName: displayName,
    });
  };

  // Fetch nearby jewelry stores
  const fetchStoresForCoords = useCallback(
    async (coords: { lat: number; lng: number }, currentFilters: FilterState) => {
      setIsLoadingStores(true);
      setErrorNotice(null);
      lastFetchedCoordsRef.current = coords;

      try {
        let results: JewelryStore[] = [];

        if (activeProvider === 'google' && googleApiKey) {
          try {
            results = await searchNearbyGooglePlaces(
              googleApiKey,
              coords.lat,
              coords.lng,
              currentFilters.radiusKm,
              currentFilters.query,
              currentFilters.storeType
            );
          } catch (gErr: any) {
            console.warn('Google Places search error, falling back to OSM:', gErr);
            setErrorNotice(
              'Google Maps API reported an issue. Falling back to OpenStreetMap places index.'
            );
            results = await searchNearbyStoresOSM(
              coords.lat,
              coords.lng,
              currentFilters.radiusKm,
              currentFilters.query,
              currentFilters.storeType
            );
          }
        } else {
          results = await searchNearbyStoresOSM(
            coords.lat,
            coords.lng,
            currentFilters.radiusKm,
            currentFilters.query,
            currentFilters.storeType
          );
        }

        setRawStores(results);
      } catch (err: any) {
        console.error('Error fetching jewelry stores:', err);
        setErrorNotice(
          'Failed to load nearby jewelry stores. Please check your network and try again.'
        );
      } finally {
        setIsLoadingStores(false);
      }
    },
    [activeProvider, googleApiKey]
  );

  // Trigger fetch when user coords or search parameters change
  useEffect(() => {
    if (userLocation.coords) {
      fetchStoresForCoords(userLocation.coords, filters);
    }
  }, [
    userLocation.coords?.lat,
    userLocation.coords?.lng,
    filters.radiusKm,
    filters.query,
    filters.storeType,
    activeProvider,
    fetchStoresForCoords,
  ]);

  // Filter and Sort in memory
  const processedStores = useMemo(() => {
    let list = [...rawStores];

    // Filter bookmarks if active
    if (showFavoritesOnly) {
      list = list.filter((s) => bookmarkedIds.has(s.id));
    }

    // Filter rating
    if (filters.minRating > 0) {
      list = list.filter((s) => s.rating && s.rating >= filters.minRating);
    }

    // Filter Open Now
    if (filters.openNowOnly) {
      list = list.filter((s) => s.isOpen === true);
    }

    // Filter category
    if (filters.storeType !== 'all') {
      list = list.filter((s) => s.storeType === filters.storeType);
    }

    // Sort
    if (filters.sortBy === 'distance') {
      list.sort((a, b) => a.distanceMeters - b.distanceMeters);
    } else if (filters.sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'relevance') {
      // Relevance balances rating & proximity
      list.sort((a, b) => {
        const scoreA = (a.rating || 4) / Math.max(1, a.distanceMeters / 1000);
        const scoreB = (b.rating || 4) / Math.max(1, b.distanceMeters / 1000);
        return scoreB - scoreA;
      });
    }

    return list;
  }, [rawStores, filters, showFavoritesOnly, bookmarkedIds]);

  // When opening store details, if using Google, enrich with Place Details
  const handleViewDetails = async (store: JewelryStore) => {
    setSelectedStore(store);
    setDetailStore(store);

    if (activeProvider === 'google' && googleApiKey && store.placeId) {
      try {
        const details = await fetchGooglePlaceDetails(googleApiKey, store.placeId);
        setDetailStore((prev) => (prev ? { ...prev, ...details } : prev));
      } catch (err) {
        console.warn('Could not fetch additional place details:', err);
      }
    }
  };

  const handleSaveGoogleKey = (key: string) => {
    setGoogleApiKey(key);
    localStorage.setItem('jewelfinder_google_api_key', key);
  };

  const handleSelectProvider = (prov: 'google' | 'osm') => {
    setActiveProvider(prov);
    localStorage.setItem('jewelfinder_provider', prov);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      {/* Top Navbar */}
      <Navbar
        userLocation={userLocation}
        onRefreshLocation={handleRequestLocation}
        onOpenManualLocation={() => setIsManualModalOpen(true)}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        activeProvider={activeProvider}
        favoriteCount={bookmarkedIds.size}
        onToggleFavoritesOnly={() => setShowFavoritesOnly((prev) => !prev)}
        showFavoritesOnly={showFavoritesOnly}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Permission Request or Denied Banner */}
        <LocationPermission
          locationState={userLocation}
          onRequestLocation={handleRequestLocation}
          onEnterManualLocation={() => setIsManualModalOpen(true)}
        />

        {/* Real-time Location Status Bar */}
        {userLocation.coords && (
          <LocationStatus
            location={userLocation}
            onToggleLiveTracking={toggleLiveTracking}
            onRefresh={() => {
              if (userLocation.coords) {
                fetchStoresForCoords(userLocation.coords, filters);
              }
            }}
            isLoadingStores={isLoadingStores}
          />
        )}

        {/* Error / Provider Notice if any */}
        {errorNotice && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar
            query={filters.query}
            onSearch={(q) => setFilters((prev) => ({ ...prev, query: q }))}
            onOpenManualLocation={() => setIsManualModalOpen(true)}
            locationName={userLocation.locationName}
          />
        </div>

        {/* Filters Panel */}
        <div className="mb-6">
          <SearchFilters
            filters={filters}
            onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
            onReset={() => setFilters(INITIAL_FILTERS)}
            totalResults={processedStores.length}
          />
        </div>

        {/* Mobile View Toggle Buttons */}
        <div className="flex sm:hidden items-center justify-center p-1 bg-stone-200/80 rounded-xl mb-4">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
              mobileTab === 'list'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List View ({processedStores.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
              mobileTab === 'map'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Map className="w-4 h-4 text-amber-700" />
            <span>Interactive Map</span>
          </button>
        </div>

        {/* Main Content Layout: Store List (Left) + Interactive Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Store List Column */}
          <div
            className={`lg:col-span-6 xl:col-span-5 ${
              mobileTab === 'map' ? 'hidden sm:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-serif-luxury text-lg font-bold text-stone-900">
                {showFavoritesOnly ? 'Saved Jewelry Stores' : 'Nearby Jewelry Stores'}
              </h2>
              <span className="text-xs text-stone-500 font-medium">
                {processedStores.length} found
              </span>
            </div>

            <StoreList
              stores={processedStores}
              isLoading={isLoadingStores}
              selectedStoreId={selectedStore?.id || null}
              onSelectStore={(store) => {
                setSelectedStore(store);
                if (window.innerWidth < 640) {
                  setMobileTab('map');
                }
              }}
              onViewDetails={handleViewDetails}
              userCoords={userLocation.coords}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              onExpandRadius={() =>
                setFilters((prev) => ({
                  ...prev,
                  radiusKm: prev.radiusKm < 10 ? 10 : 25,
                }))
              }
              radiusKm={filters.radiusKm}
            />
          </div>

          {/* Interactive Map Column */}
          <div
            className={`lg:col-span-6 xl:col-span-7 sticky top-24 ${
              mobileTab === 'list' ? 'hidden sm:block' : 'block'
            }`}
          >
            <div className="h-[480px] lg:h-[calc(100vh-140px)] min-h-[420px]">
              <InteractiveMap
                stores={processedStores}
                userLocation={userLocation}
                selectedStore={selectedStore}
                onSelectStore={(store) => setSelectedStore(store)}
                onViewDetails={handleViewDetails}
                onRecenterUser={() => {
                  if (userLocation.coords) {
                    setSelectedStore(null);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        onOpenManualLocation={() => setIsManualModalOpen(true)}
      />

      {/* Store Details Modal */}
      <StoreDetailsModal
        store={detailStore}
        onClose={() => setDetailStore(null)}
        userCoords={userLocation.coords}
        isBookmarked={detailStore ? bookmarkedIds.has(detailStore.id) : false}
        onToggleBookmark={() => {
          if (detailStore) handleToggleBookmark(detailStore.id);
        }}
      />

      {/* Manual Location Search Modal */}
      <ManualLocationModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSelectLocation={handleManualLocation}
        onRequestBrowserLocation={handleRequestLocation}
      />

      {/* API Key & Provider Settings Modal */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        activeProvider={activeProvider}
        onSaveGoogleKey={handleSaveGoogleKey}
        onSelectProvider={handleSelectProvider}
        currentKey={googleApiKey}
      />

      {/* n8n AI Chatbot Widget */}
      <Chatbot
        isOpen={isChatOpen}
        onToggleOpen={setIsChatOpen}
        userLocation={userLocation}
        onSearchQuery={(q) => setFilters((prev) => ({ ...prev, query: q }))}
      />
    </div>
  );
}
