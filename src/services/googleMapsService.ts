import { JewelryStore, StoreCategory } from '../types/store';
import { calculateHaversineDistanceMeters } from '../utils/distance';

// Track script loading state
let googleMapsLoadingPromise: Promise<boolean> | null = null;

export function loadGoogleMapsScript(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.maps?.places) return Promise.resolve(true);

  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve) => {
    // Check if script element already exists
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = (err) => {
      console.warn('Failed to load Google Maps script:', err);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

export async function searchNearbyGooglePlaces(
  apiKey: string,
  lat: number,
  lng: number,
  radiusKm: number,
  searchQuery?: string,
  category?: StoreCategory
): Promise<JewelryStore[]> {
  const loaded = await loadGoogleMapsScript(apiKey);
  if (!loaded || !(window as any).google?.maps?.places) {
    throw new Error('Google Maps JavaScript API could not be initialized.');
  }

  const dummyElement = document.createElement('div');
  const service = new (window as any).google.maps.places.PlacesService(dummyElement);

  let keyword = searchQuery || '';
  if (category === 'gold') keyword += ' gold';
  else if (category === 'diamond') keyword += ' diamond';
  else if (category === 'bridal') keyword += ' bridal wedding rings';
  else if (category === 'luxury') keyword += ' luxury boutique';

  const request: any = {
    location: new (window as any).google.maps.LatLng(lat, lng),
    radius: radiusKm * 1000,
    type: 'jewelry_store',
  };

  if (keyword.trim()) {
    request.keyword = keyword.trim();
  }

  return new Promise((resolve, reject) => {
    service.nearbySearch(request, (results: any[], status: string) => {
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
        const stores: JewelryStore[] = results.map((place) => {
          const sLat = place.geometry?.location?.lat() || lat;
          const sLng = place.geometry?.location?.lng() || lng;
          const distanceMeters = calculateHaversineDistanceMeters(lat, lng, sLat, sLng);

          let photoUrl: string | undefined;
          let photos: string[] = [];
          if (place.photos && place.photos.length > 0) {
            photoUrl = place.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 });
            photos = place.photos.slice(0, 5).map((p: any) => p.getUrl({ maxWidth: 800, maxHeight: 600 }));
          }

          const storeType: StoreCategory =
            category && category !== 'all'
              ? category
              : (place.name?.toLowerCase().includes('gold') ? 'gold' :
                 place.name?.toLowerCase().includes('diamond') ? 'diamond' :
                 place.name?.toLowerCase().includes('bridal') ? 'bridal' : 'jewelry');

          return {
            id: `gplace_${place.place_id || Math.random().toString(36).substring(2, 9)}`,
            name: place.name || 'Fine Jewelry',
            lat: sLat,
            lng: sLng,
            distanceMeters,
            address: place.vicinity || place.formatted_address || 'Address available in details',
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            isOpen: place.opening_hours?.open_now,
            categories: place.types || ['jewelry_store', 'store'],
            storeType,
            placeId: place.place_id,
            priceLevel: place.price_level,
            photoUrl,
            photos: photos.length > 0 ? photos : undefined,
            source: 'google',
          };
        });

        stores.sort((a, b) => a.distanceMeters - b.distanceMeters);
        resolve(stores);
      } else if (status === (window as any).google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`PlacesServiceStatus: ${status}`));
      }
    });
  });
}

export async function fetchGooglePlaceDetails(
  apiKey: string,
  placeId: string
): Promise<Partial<JewelryStore>> {
  const loaded = await loadGoogleMapsScript(apiKey);
  if (!loaded || !(window as any).google?.maps?.places) {
    return {};
  }

  const dummyElement = document.createElement('div');
  const service = new (window as any).google.maps.places.PlacesService(dummyElement);

  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId,
        fields: [
          'formatted_phone_number',
          'website',
          'opening_hours',
          'formatted_address',
          'photos',
          'reviews',
          'url',
        ],
      },
      (place: any, status: string) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
          const photos = place.photos?.slice(0, 6).map((p: any) => p.getUrl({ maxWidth: 800, maxHeight: 600 })) || [];
          resolve({
            phone: place.formatted_phone_number,
            website: place.website || place.url,
            openingHours: place.opening_hours?.weekday_text,
            isOpen: place.opening_hours?.open_now,
            photos: photos.length > 0 ? photos : undefined,
            address: place.formatted_address,
          });
        } else {
          resolve({});
        }
      }
    );
  });
}
