import React, { useState } from 'react';
import {
  X,
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Navigation,
  Bookmark,
  Share2,
  Check,
  Footprints,
  Car,
  Compass,
  Info,
} from 'lucide-react';
import { JewelryStore } from '../types/store';
import { formatDistance, getDirectionsUrl, getEstimatedTravelTime } from '../utils/distance';

interface StoreDetailsModalProps {
  store: JewelryStore | null;
  onClose: () => void;
  userCoords: { lat: number; lng: number } | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const StoreDetailsModal: React.FC<StoreDetailsModalProps> = ({
  store,
  onClose,
  userCoords,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!store) return null;

  const directionsUrl = getDirectionsUrl(
    userCoords,
    { lat: store.lat, lng: store.lng },
    store.name,
    store.placeId
  );
  const travelTimes = getEstimatedTravelTime(store.distanceMeters);

  const handleShare = async () => {
    const text = `Check out ${store.name} on JewelFinder (${formatDistance(store.distanceMeters)} away): ${store.address}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: store.name,
          text,
          url: window.location.href,
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const photos = store.photos && store.photos.length > 0 ? store.photos : store.photoUrl ? [store.photoUrl] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-900/20 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Photo Gallery */}
        <div className="relative w-full h-64 sm:h-72 bg-stone-900 overflow-hidden">
          {photos.length > 0 ? (
            <img
              src={photos[activePhotoIndex]}
              alt={`${store.name} photo`}
              className="w-full h-full object-cover transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
              Photos not available
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none" />

          {/* Close & Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
            <button
              onClick={handleShare}
              title="Share store"
              className="p-2.5 rounded-full bg-stone-900/70 hover:bg-stone-900 text-stone-200 hover:text-amber-300 backdrop-blur-md transition shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onToggleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark store'}
              className="p-2.5 rounded-full bg-stone-900/70 hover:bg-stone-900 text-stone-200 hover:text-amber-300 backdrop-blur-md transition shadow-md"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              title="Close modal"
              className="p-2.5 rounded-full bg-stone-900/70 hover:bg-stone-900 text-stone-200 hover:text-white backdrop-blur-md transition shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Photo Dots Selector if multiple */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-6 flex items-center space-x-1.5 z-10">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activePhotoIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Store Category pill */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-full bg-amber-500/90 text-stone-950 font-semibold text-xs uppercase tracking-wider backdrop-blur-md shadow-md">
              {store.storeType}
            </span>
          </div>

          {/* Title on Header */}
          <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
            <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold leading-tight drop-shadow-md">
              {store.name}
            </h2>
            <p className="text-amber-200 text-xs mt-0.5 flex items-center space-x-2">
              <span>{formatDistance(store.distanceMeters)} away</span>
              <span>•</span>
              <span>{travelTimes.walking} walk / {travelTimes.driving} drive</span>
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-18rem)] overflow-y-auto">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Rating */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] uppercase font-semibold text-stone-400 block mb-1">Rating</span>
              <div className="flex items-center justify-center space-x-1 text-sm font-bold text-stone-900">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{store.rating !== undefined ? store.rating.toFixed(1) : 'Not available'}</span>
              </div>
              {store.userRatingsTotal !== undefined && (
                <span className="text-[10px] text-stone-500">{store.userRatingsTotal} reviews</span>
              )}
            </div>

            {/* Distance */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] uppercase font-semibold text-stone-400 block mb-1">Distance</span>
              <span className="text-sm font-bold text-amber-800 block">
                {formatDistance(store.distanceMeters)}
              </span>
              <span className="text-[10px] text-stone-500">Real GPS</span>
            </div>

            {/* Status */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] uppercase font-semibold text-stone-400 block mb-1">Status</span>
              <span
                className={`text-xs font-bold block ${
                  store.isOpen === true
                    ? 'text-emerald-700'
                    : store.isOpen === false
                    ? 'text-rose-700'
                    : 'text-stone-500'
                }`}
              >
                {store.isOpen === true ? 'Open Now' : store.isOpen === false ? 'Closed' : 'Not available'}
              </span>
            </div>

            {/* Source */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] uppercase font-semibold text-stone-400 block mb-1">Source</span>
              <span className="text-xs font-semibold text-stone-700 block capitalize">
                {store.source === 'google' ? 'Google Places' : 'OpenStreetMap'}
              </span>
            </div>
          </div>

          {/* Contact & Location Details */}
          <div className="space-y-3 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 text-xs">
            {/* Address */}
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">Address</p>
                <p className="text-stone-600 mt-0.5">{store.address || 'Address not available'}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Coordinates: {store.lat.toFixed(5)}, {store.lng.toFixed(5)}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start space-x-3 pt-2 border-t border-stone-200/50">
              <Phone className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">Phone</p>
                {store.phone ? (
                  <a href={`tel:${store.phone}`} className="text-amber-800 hover:underline font-medium">
                    {store.phone}
                  </a>
                ) : (
                  <p className="text-stone-400 italic">Not available</p>
                )}
              </div>
            </div>

            {/* Website */}
            <div className="flex items-start space-x-3 pt-2 border-t border-stone-200/50">
              <Globe className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">Website</p>
                {store.website ? (
                  <a
                    href={store.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 hover:underline font-medium break-all"
                  >
                    {store.website}
                  </a>
                ) : (
                  <p className="text-stone-400 italic">Not available</p>
                )}
              </div>
            </div>

            {/* Opening Hours */}
            {store.openingHours && store.openingHours.length > 0 && (
              <div className="flex items-start space-x-3 pt-2 border-t border-stone-200/50">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 mb-1">Weekly Opening Hours</p>
                  <ul className="space-y-0.5 text-stone-600">
                    {store.openingHours.map((schedule, i) => (
                      <li key={i}>{schedule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Categories & Specialties */}
          {store.categories && store.categories.length > 0 && (
            <div>
              <h4 className="font-semibold text-stone-900 text-xs mb-2">Categories & Specialties</h4>
              <div className="flex flex-wrap gap-1.5">
                {store.categories.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200"
                  >
                    {c.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-6 bg-stone-100/80 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-semibold text-xs shadow-xs transition flex items-center space-x-1.5"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Call Store</span>
              </a>
            )}

            {store.website && (
              <a
                href={store.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-semibold text-xs shadow-xs transition flex items-center space-x-1.5"
              >
                <Globe className="w-4 h-4 text-amber-600" />
                <span>Open Website</span>
              </a>
            )}
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-600/20 transition flex items-center space-x-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Turn-by-Turn Directions</span>
          </a>
        </div>
      </div>
    </div>
  );
};
