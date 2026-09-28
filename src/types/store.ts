export type StoreCategory = 'all' | 'jewelry' | 'gold' | 'diamond' | 'bridal' | 'luxury';

export type SortOption = 'distance' | 'rating' | 'relevance';

export interface JewelryStore {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number; // Real calculated distance from user
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  isOpen?: boolean;
  openingHours?: string[];
  phone?: string;
  website?: string;
  photoUrl?: string;
  photos?: string[];
  categories: string[];
  storeType: StoreCategory;
  placeId?: string;
  brand?: string;
  priceLevel?: number; // 1-4 ($ to $$$$)
  source: 'google' | 'osm' | 'photon';
  rawTags?: Record<string, string>;
}

export interface UserLocation {
  coords: {
    lat: number;
    lng: number;
  } | null;
  accuracy: number | null; // meters
  timestamp: number | null;
  status: 'prompt' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'error';
  errorMessage?: string;
  isLiveTracking: boolean;
  locationName?: string;
  isManualLocation: boolean;
}

export interface FilterState {
  query: string;
  radiusKm: number; // 1, 2, 5, 10, 25
  minRating: number; // 0, 3, 4
  openNowOnly: boolean;
  storeType: StoreCategory;
  sortBy: SortOption;
}
