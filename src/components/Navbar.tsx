import React from 'react';
import { Gem, MapPin, RefreshCw, Settings, Navigation2, Bookmark } from 'lucide-react';
import { UserLocation } from '../types/store';

interface NavbarProps {
  userLocation: UserLocation;
  onRefreshLocation: () => void;
  onOpenManualLocation: () => void;
  onOpenApiSettings: () => void;
  activeProvider: 'google' | 'osm';
  favoriteCount: number;
  onToggleFavoritesOnly: () => void;
  showFavoritesOnly: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  userLocation,
  onRefreshLocation,
  onOpenManualLocation,
  onOpenApiSettings,
  activeProvider,
  favoriteCount,
  onToggleFavoritesOnly,
  showFavoritesOnly,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-amber-900/30 text-stone-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 p-0.5 shadow-md shadow-amber-950/40">
              <div className="w-full h-full bg-stone-900 rounded-[10px] flex items-center justify-center">
                <Gem className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif-luxury text-xl font-bold tracking-wider text-amber-100">
                  Jewel<span className="text-amber-400">Finder</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {activeProvider === 'google' ? 'Google Places' : 'OpenStreetMap'}
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-stone-400">
                Discover nearby fine jewelers & boutiques
              </p>
            </div>
          </div>

          {/* Location indicator & Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Current Location Pill */}
            <button
              onClick={onOpenManualLocation}
              title="Change search location"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 text-stone-200 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">
                {userLocation.locationName ||
                  (userLocation.coords
                    ? `${userLocation.coords.lat.toFixed(3)}, ${userLocation.coords.lng.toFixed(3)}`
                    : 'Select Location')}
              </span>
              {userLocation.isManualLocation && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300">
                  Manual
                </span>
              )}
            </button>

            {/* Refresh GPS location */}
            <button
              onClick={onRefreshLocation}
              disabled={userLocation.status === 'requesting'}
              title="Refresh GPS location"
              className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-amber-400 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${userLocation.status === 'requesting' ? 'animate-spin text-amber-400' : ''}`}
              />
            </button>

            {/* Favorites filter toggle */}
            <button
              onClick={onToggleFavoritesOnly}
              title="Saved jewelry stores"
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                showFavoritesOnly
                  ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold'
                  : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300 border-stone-700/60'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-stone-950' : ''}`} />
              <span className="hidden sm:inline">Saved</span>
              {favoriteCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    showFavoritesOnly ? 'bg-stone-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* API Settings */}
            <button
              onClick={onOpenApiSettings}
              title="Maps & API Provider Settings"
              className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-amber-400 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
