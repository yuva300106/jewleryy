import React, { useEffect, useState } from 'react';
import { Radio, RefreshCw, Crosshair, AlertTriangle } from 'lucide-react';
import { UserLocation } from '../types/store';

interface LocationStatusProps {
  location: UserLocation;
  onToggleLiveTracking: () => void;
  onRefresh: () => void;
  isLoadingStores: boolean;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  location,
  onToggleLiveTracking,
  onRefresh,
  isLoadingStores,
}) => {
  const [timeAgoText, setTimeAgoText] = useState<string>('just now');

  useEffect(() => {
    if (!location.timestamp) return;

    const updateTimer = () => {
      const secondsAgo = Math.floor((Date.now() - (location.timestamp || Date.now())) / 1000);
      if (secondsAgo < 5) {
        setTimeAgoText('just now');
      } else if (secondsAgo < 60) {
        setTimeAgoText(`${secondsAgo} seconds ago`);
      } else {
        const minutesAgo = Math.floor(secondsAgo / 60);
        setTimeAgoText(`${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 5000);
    return () => clearInterval(interval);
  }, [location.timestamp]);

  if (!location.coords) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 mb-4 shadow-sm">
      <div className="flex items-center space-x-2">
        {/* Pulsing Dot */}
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              location.isLiveTracking ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              location.isLiveTracking ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          />
        </span>

        <span className="font-medium">
          {location.isManualLocation ? (
            <span>Manual center: <strong>{location.locationName || 'Custom Location'}</strong></span>
          ) : (
            <span>
              {location.isLiveTracking ? 'Live GPS tracking active' : 'GPS position locked'}
              {' • '}
              <span className="text-stone-600">Location updated {timeAgoText}</span>
            </span>
          )}
        </span>

        {location.accuracy !== null && !location.isManualLocation && (
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 text-[10px] font-mono border border-amber-300/40">
            ±{Math.round(location.accuracy)}m
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Toggle Live Tracking */}
        {!location.isManualLocation && (
          <button
            onClick={onToggleLiveTracking}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${
              location.isLiveTracking
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
            title={location.isLiveTracking ? 'Disable continuous GPS tracking' : 'Enable continuous GPS tracking'}
          >
            <Radio className={`w-3 h-3 ${location.isLiveTracking ? 'text-emerald-600 animate-pulse' : 'text-stone-400'}`} />
            <span>{location.isLiveTracking ? 'Live: ON' : 'Live: OFF'}</span>
          </button>
        )}

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoadingStores}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 transition disabled:opacity-50"
          title="Refresh nearby stores"
        >
          <RefreshCw className={`w-3 h-3 ${isLoadingStores ? 'animate-spin text-amber-600' : 'text-stone-500'}`} />
          <span>{isLoadingStores ? 'Searching...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
};
