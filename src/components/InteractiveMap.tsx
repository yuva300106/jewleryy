import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { JewelryStore, UserLocation } from '../types/store';
import { formatDistance, getDirectionsUrl } from '../utils/distance';
import { Crosshair, Layers, ZoomIn, ZoomOut, Navigation, Star, Clock } from 'lucide-react';

interface InteractiveMapProps {
  stores: JewelryStore[];
  userLocation: UserLocation;
  selectedStore: JewelryStore | null;
  onSelectStore: (store: JewelryStore) => void;
  onViewDetails: (store: JewelryStore) => void;
  onRecenterUser: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  stores,
  userLocation,
  selectedStore,
  onSelectStore,
  onViewDetails,
  onRecenterUser,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center (or user coords if present)
    const initialLat = userLocation.coords?.lat || 37.7749;
    const initialLng = userLocation.coords?.lng || -122.4194;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false, // We render custom luxury controls
      attributionControl: true,
    });

    // Elegant CartoDB Positron / OSM tiles for luxury feel
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation.coords) {
      const { lat, lng } = userLocation.coords;

      // Custom pulsing user icon
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="user-location-pulse absolute w-7 h-7 rounded-full bg-amber-500/40"></span>
            <div class="relative w-4 h-4 rounded-full bg-amber-600 border-2 border-white shadow-md flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        userMarkerRef.current.bindTooltip('Your Location', { direction: 'top', offset: [0, -10] });
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }

      // Accuracy circle
      if (userLocation.accuracy && userLocation.accuracy < 1000) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle([lat, lng], {
            radius: userLocation.accuracy,
            color: '#d97706',
            fillColor: '#f59e0b',
            fillOpacity: 0.1,
            weight: 1,
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng([lat, lng]);
          accuracyCircleRef.current.setRadius(userLocation.accuracy);
        }
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    }
  }, [userLocation.coords, userLocation.accuracy]);

  // Update Store Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);
    if (userLocation.coords) {
      bounds.extend([userLocation.coords.lat, userLocation.coords.lng]);
    }

    stores.forEach((store) => {
      const isSelected = selectedStore?.id === store.id;
      bounds.extend([store.lat, store.lng]);

      // Custom Diamond / Jewelry Pin
      const markerHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-115'
        }">
          <div class="w-8 h-8 rounded-full ${
            isSelected
              ? 'bg-amber-600 ring-4 ring-amber-300 shadow-xl'
              : 'bg-stone-900 ring-2 ring-amber-400/80 shadow-md'
          } flex items-center justify-center text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-amber-300">
              <polygon points="6 3 18 3 22 9 12 22 2 9 6 3" />
              <path d="M11 3 8 9l4 13 4-13-3-6" />
              <path d="M2 9h20" />
            </svg>
          </div>
          <div class="w-2 h-2 bg-stone-900 rotate-45 mx-auto -mt-1 ${isSelected ? 'bg-amber-600' : ''}"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-jewelry-pin',
        html: markerHtml,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([store.lat, store.lng], { icon });

      // Build popup content
      const directionsUrl = getDirectionsUrl(
        userLocation.coords,
        { lat: store.lat, lng: store.lng },
        store.name,
        store.placeId
      );

      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 w-64 text-stone-900';
      popupContent.innerHTML = `
        <div class="font-serif-luxury font-bold text-sm text-stone-900 line-clamp-1 mb-1">
          ${store.name}
        </div>
        <div class="flex items-center justify-between text-xs mb-1.5">
          <span class="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            ${formatDistance(store.distanceMeters)} away
          </span>
          ${
            store.rating
              ? `<span class="flex items-center text-amber-800 font-bold">★ ${store.rating.toFixed(1)}</span>`
              : ''
          }
        </div>
        <div class="text-[11px] text-stone-600 line-clamp-2 mb-2">
          ${store.address}
        </div>
        <div class="flex items-center justify-between gap-1 pt-2 border-t border-stone-100 text-xs">
          <button id="view-details-btn-${store.id}" class="text-amber-800 font-medium hover:underline text-[11px]">
            View Details
          </button>
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded bg-amber-600 text-white font-medium text-[11px] hover:bg-amber-700 flex items-center space-x-1">
            <span>Directions</span>
          </a>
        </div>
      `;

      popupContent
        .querySelector(`#view-details-btn-${store.id}`)
        ?.addEventListener('click', () => {
          onViewDetails(store);
        });

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectStore(store);
      });

      markersGroup.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Auto-fit bounds if stores exist
    if (stores.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [stores, selectedStore]);

  // Recenter actions
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleRecenter = () => {
    if (userLocation.coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.coords.lat, userLocation.coords.lng], 14, {
        duration: 1.2,
      });
      onRecenterUser();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] sm:min-h-[480px] rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm bg-stone-100">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col space-y-2">
        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          title="Center on my location"
          className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-stone-800 hover:text-amber-700 shadow-md border border-stone-200 backdrop-blur-sm transition active:scale-95 flex items-center justify-center"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-stone-200 overflow-hidden flex flex-col">
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="p-2 text-stone-700 hover:text-amber-700 hover:bg-stone-50 border-b border-stone-200 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="p-2 text-stone-700 hover:text-amber-700 hover:bg-stone-50 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected store badge in bottom corner */}
      {selectedStore && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs z-[500] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-amber-200 shadow-lg flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-700">
              Selected Store
            </p>
            <p className="font-serif-luxury text-xs font-bold text-stone-900 truncate">
              {selectedStore.name}
            </p>
            <p className="text-[11px] text-stone-500">
              {formatDistance(selectedStore.distanceMeters)} away
            </p>
          </div>
          <button
            onClick={() => onViewDetails(selectedStore)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium whitespace-nowrap transition flex-shrink-0"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
};
