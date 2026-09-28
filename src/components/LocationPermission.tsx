import React from 'react';
import { MapPin, Navigation, AlertCircle, Compass, Search } from 'lucide-react';
import { UserLocation } from '../types/store';

interface LocationPermissionProps {
  locationState: UserLocation;
  onRequestLocation: () => void;
  onEnterManualLocation: () => void;
  onDismiss?: () => void;
}

export const LocationPermission: React.FC<LocationPermissionProps> = ({
  locationState,
  onRequestLocation,
  onEnterManualLocation,
  onDismiss,
}) => {
  const isDenied = locationState.status === 'denied';
  const isError = locationState.status === 'error' || locationState.status === 'unavailable' || locationState.status === 'timeout';
  const isRequesting = locationState.status === 'requesting';

  // If already granted, don't show the permission banner/modal
  if (locationState.status === 'granted') {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-stone-100 p-6 md:p-8 border border-amber-900/30 shadow-2xl my-6">
      {/* Subtle gold decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 mb-4 shadow-lg shadow-amber-500/20">
          {isDenied || isError ? (
            <AlertCircle className="w-7 h-7 text-amber-950" />
          ) : (
            <Compass className="w-7 h-7 text-amber-950 animate-spin-slow" />
          )}
        </div>

        {/* Heading & description according to specifications */}
        {isDenied ? (
          <>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-amber-100 mb-2">
              We couldn't access your location.
            </h2>
            <p className="text-stone-300 text-sm sm:text-base mb-6 leading-relaxed">
              Location permissions are currently blocked in your browser. You can grant access in
              your browser's address bar settings, or simply type your city or address manually.
            </p>
          </>
        ) : isError ? (
          <>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-amber-100 mb-2">
              Location request timed out or unavailable.
            </h2>
            <p className="text-stone-300 text-sm sm:text-base mb-6 leading-relaxed">
              {locationState.errorMessage ||
                'Your location could not be determined. Please enable location services or enter a location manually.'}
            </p>
          </>
        ) : (
          <>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-amber-100 mb-2">
              Find jewelry stores near you
            </h2>
            <p className="text-stone-300 text-sm sm:text-base mb-6 leading-relaxed">
              Allow location access to discover jewelry stores near your current location. We use
              high-accuracy GPS to calculate real distances and directions.
            </p>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isDenied || isError ? (
            <button
              onClick={onRequestLocation}
              disabled={isRequesting}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-sm shadow-md transition transform active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${isRequesting ? 'animate-spin' : ''}`} />
              <span>{isRequesting ? 'Requesting...' : 'Try Again'}</span>
            </button>
          ) : (
            <button
              onClick={onRequestLocation}
              disabled={isRequesting}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-semibold text-sm shadow-lg shadow-amber-500/25 transition transform active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${isRequesting ? 'animate-spin' : ''}`} />
              <span>{isRequesting ? 'Accessing GPS...' : 'Use My Location'}</span>
            </button>
          )}

          <button
            onClick={onEnterManualLocation}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700/80 font-medium text-sm transition transform active:scale-95"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Enter Location Manually</span>
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-[11px] text-stone-400 mt-5">
          🔒 Your location is strictly processed in your browser to retrieve nearby places and is
          never stored permanently on remote servers.
        </p>
      </div>
    </div>
  );
};
