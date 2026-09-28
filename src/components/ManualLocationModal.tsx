import React, { useState } from 'react';
import { X, Search, MapPin, Sparkles, Navigation, Loader2 } from 'lucide-react';
import { geocodeAddress } from '../services/placesService';

interface ManualLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, displayName: string) => void;
  onRequestBrowserLocation: () => void;
}

const FAMOUS_JEWELRY_HUBS = [
  { name: 'Diamond District, NYC', query: '47th Street New York Diamond District', lat: 40.7571, lng: -73.9806 },
  { name: 'Rodeo Drive, Beverly Hills', query: 'Rodeo Drive Beverly Hills', lat: 34.0673, lng: -118.4014 },
  { name: 'Hatton Garden, London', query: 'Hatton Garden London', lat: 51.5204, lng: -0.1084 },
  { name: 'Place Vendôme, Paris', query: 'Place Vendome Paris', lat: 48.8675, lng: 2.3294 },
  { name: 'Ginza Jewelry District, Tokyo', query: 'Ginza Tokyo', lat: 35.6719, lng: 139.764 },
  { name: 'Dubai Gold Souk', query: 'Gold Souk Deira Dubai', lat: 25.2697, lng: 55.2974 },
];

export const ManualLocationModal: React.FC<ManualLocationModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  onRequestBrowserLocation,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    const result = await geocodeAddress(inputVal.trim());
    setIsSearching(false);

    if (result) {
      onSelectLocation(result.lat, result.lng, result.displayName);
      onClose();
    } else {
      setSearchError('Could not find this address. Try entering a city or street name.');
    }
  };

  const handlePresetSelect = (preset: typeof FAMOUS_JEWELRY_HUBS[0]) => {
    onSelectLocation(preset.lat, preset.lng, preset.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                Set Search Location
              </h3>
              <p className="text-xs text-stone-500">Find jewelry stores anywhere in the world</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Use GPS Button */}
          <button
            type="button"
            onClick={() => {
              onRequestBrowserLocation();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-200 transition flex items-center justify-center space-x-2"
          >
            <Navigation className="w-4 h-4 text-amber-700" />
            <span>Use My Exact Current Location (GPS)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider absolute">
              or enter address / city
            </span>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g., Beverly Hills, CA or Paris or 10001..."
                className="w-full pl-10 pr-24 py-3 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                autoFocus
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                disabled={isSearching || !inputVal.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center space-x-1"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Locate</span>}
              </button>
            </div>
            {searchError && <p className="text-xs text-rose-600 mt-1">{searchError}</p>}
          </form>

          {/* Famous Jewelry Districts Presets */}
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2 flex items-center">
              <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
              World Renowned Jewelry Districts
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FAMOUS_JEWELRY_HUBS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 transition group flex items-start space-x-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 group-hover:text-amber-900 block">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
