import React from 'react';
import {
  MapPin,
  Star,
  Navigation,
  Phone,
  ExternalLink,
  Clock,
  Eye,
  Bookmark,
  Footprints,
  Car,
} from 'lucide-react';
import { JewelryStore } from '../types/store';
import { formatDistance, getDirectionsUrl, getEstimatedTravelTime } from '../utils/distance';

interface StoreCardProps {
  store: JewelryStore;
  userCoords: { lat: number; lng: number } | null;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  userCoords,
  isSelected,
  onSelect,
  onViewDetails,
  isBookmarked,
  onToggleBookmark,
}) => {
  const directionsUrl = getDirectionsUrl(userCoords, { lat: store.lat, lng: store.lng }, store.name, store.placeId);
  const travelTimes = getEstimatedTravelTime(store.distanceMeters);

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isSelected
          ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
          : 'border-stone-200 hover:border-amber-300 hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Photo Container */}
        <div className="relative w-full sm:w-44 h-40 sm:h-auto flex-shrink-0 bg-stone-100 overflow-hidden">
          {store.photoUrl ? (
            <img
              src={store.photoUrl}
              alt={store.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400 text-xs">
              Photo not available
            </div>
          )}

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            title={isBookmarked ? 'Remove from saved' : 'Save store'}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-stone-900/60 backdrop-blur-sm text-white hover:text-amber-400 hover:bg-stone-900/80 transition"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {/* Store Type Badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-sm text-[10px] uppercase font-semibold tracking-wider text-amber-300">
            {store.storeType}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Header: Name and Distance */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif-luxury text-base font-bold text-stone-900 group-hover:text-amber-800 transition line-clamp-1">
                {store.name}
              </h3>
              <div className="flex-shrink-0 text-right">
                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 font-bold text-xs">
                  {formatDistance(store.distanceMeters)}
                </span>
              </div>
            </div>

            {/* Travel Time Estimate */}
            <div className="flex items-center space-x-3 text-[11px] text-stone-500 mt-1">
              <span className="flex items-center space-x-1" title="Estimated walking time">
                <Footprints className="w-3 h-3 text-stone-400" />
                <span>{travelTimes.walking} walk</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1" title="Estimated driving time">
                <Car className="w-3 h-3 text-stone-400" />
                <span>{travelTimes.driving} drive</span>
              </span>
            </div>

            {/* Rating and Open Status */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {store.rating !== undefined ? (
                <div className="flex items-center space-x-1 bg-amber-50 px-1.5 py-0.5 rounded text-xs font-semibold text-amber-900 border border-amber-200/60">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{store.rating.toFixed(1)}</span>
                  {store.userRatingsTotal !== undefined && (
                    <span className="text-stone-400 font-normal">({store.userRatingsTotal})</span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-stone-400 italic">Rating not available</span>
              )}

              {store.isOpen !== undefined && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    store.isOpen
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>{store.isOpen ? 'Open Now' : 'Closed'}</span>
                </span>
              )}
            </div>

            {/* Address */}
            <p className="text-xs text-stone-600 mt-2 flex items-start space-x-1.5 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
              <span>{store.address || 'Address not available'}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center space-x-1">
              {/* View on Map */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition flex items-center space-x-1"
              >
                <MapPin className="w-3 h-3 text-amber-600" />
                <span>View on Map</span>
              </button>

              {/* View Details */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium border border-amber-200/80 transition flex items-center space-x-1"
              >
                <Eye className="w-3 h-3 text-amber-700" />
                <span>Details</span>
              </button>
            </div>

            <div className="flex items-center space-x-1">
              {/* Call */}
              {store.phone ? (
                <a
                  href={`tel:${store.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-emerald-700 transition"
                  title={`Call ${store.phone}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {/* Get Directions */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium transition flex items-center space-x-1 shadow-xs"
                title="Get navigation directions"
              >
                <Navigation className="w-3 h-3" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
