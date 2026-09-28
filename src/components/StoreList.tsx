import React from 'react';
import { JewelryStore } from '../types/store';
import { StoreCard } from './StoreCard';
import { Gem, SearchX, MapPin, Compass } from 'lucide-react';

interface StoreListProps {
  stores: JewelryStore[];
  isLoading: boolean;
  selectedStoreId: string | null;
  onSelectStore: (store: JewelryStore) => void;
  onViewDetails: (store: JewelryStore) => void;
  userCoords: { lat: number; lng: number } | null;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  onExpandRadius: () => void;
  radiusKm: number;
}

export const StoreList: React.FC<StoreListProps> = ({
  stores,
  isLoading,
  selectedStoreId,
  onSelectStore,
  onViewDetails,
  userCoords,
  bookmarkedIds,
  onToggleBookmark,
  onExpandRadius,
  radiusKm,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row gap-4"
          >
            <div className="w-full sm:w-44 h-36 bg-stone-200 rounded-xl" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-200 rounded w-1/4" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
              <div className="pt-4 flex gap-2">
                <div className="h-8 bg-stone-200 rounded w-20" />
                <div className="h-8 bg-stone-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto my-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="font-serif-luxury text-lg font-bold text-stone-900 mb-2">
          No jewelry stores found within {radiusKm} km
        </h3>
        <p className="text-stone-500 text-sm mb-6 leading-relaxed">
          We couldn't find any jewelry stores matching your active filters within this distance. Try
          expanding your search radius or searching a different area.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onExpandRadius}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition flex items-center justify-center space-x-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Expand Radius to {radiusKm < 10 ? '10 km' : '25 km'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          userCoords={userCoords}
          isSelected={selectedStoreId === store.id}
          onSelect={() => onSelectStore(store)}
          onViewDetails={() => onViewDetails(store)}
          isBookmarked={bookmarkedIds.has(store.id)}
          onToggleBookmark={() => onToggleBookmark(store.id)}
        />
      ))}
    </div>
  );
};
