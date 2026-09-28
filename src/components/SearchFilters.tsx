import React from 'react';
import { SlidersHorizontal, RotateCcw, Star, Clock, Compass, Tag } from 'lucide-react';
import { FilterState, StoreCategory, SortOption } from '../types/store';

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
  totalResults: number;
}

const RADIUS_OPTIONS = [
  { label: '1 km', value: 1 },
  { label: '2 km', value: 2 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
];

const CATEGORY_OPTIONS: { label: string; value: StoreCategory }[] = [
  { label: 'All Categories', value: 'all' },
  { label: 'Jewelry Stores', value: 'jewelry' },
  { label: 'Gold Jewelry', value: 'gold' },
  { label: 'Diamonds', value: 'diamond' },
  { label: 'Bridal & Rings', value: 'bridal' },
  { label: 'Luxury & Designer', value: 'luxury' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Nearest First', value: 'distance' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Most Relevant', value: 'relevance' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const hasActiveFilters =
    filters.radiusKm !== 10 ||
    filters.minRating > 0 ||
    filters.openNowOnly ||
    filters.storeType !== 'all' ||
    filters.sortBy !== 'distance' ||
    filters.query !== '';

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-stone-900 text-sm">Refine Results</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
            {totalResults} store{totalResults === 1 ? '' : 's'}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-900 font-medium hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Radius Selector */}
        <div>
          <label className="block text-stone-700 font-medium mb-1.5 flex items-center space-x-1">
            <Compass className="w-3.5 h-3.5 text-stone-400" />
            <span>Search Radius</span>
          </label>
          <div className="flex items-center space-x-1 bg-stone-100/80 p-0.5 rounded-lg">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ radiusKm: opt.value })}
                className={`flex-1 py-1 px-1.5 rounded-md font-medium transition text-center ${
                  filters.radiusKm === opt.value
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Store Category */}
        <div>
          <label className="block text-stone-700 font-medium mb-1.5 flex items-center space-x-1">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            <span>Store Type</span>
          </label>
          <select
            value={filters.storeType}
            onChange={(e) => onChange({ storeType: e.target.value as StoreCategory })}
            className="w-full py-1.5 px-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-stone-700 font-medium mb-1.5 flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Minimum Rating</span>
          </label>
          <div className="flex items-center space-x-1 bg-stone-100/80 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onChange({ minRating: 0 })}
              className={`flex-1 py-1 px-1.5 rounded-md font-medium transition text-center ${
                filters.minRating === 0
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onChange({ minRating: 3 })}
              className={`flex-1 py-1 px-1.5 rounded-md font-medium transition text-center ${
                filters.minRating === 3
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              3+ ★
            </button>
            <button
              type="button"
              onClick={() => onChange({ minRating: 4 })}
              className={`flex-1 py-1 px-1.5 rounded-md font-medium transition text-center ${
                filters.minRating === 4
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              4+ ★
            </button>
          </div>
        </div>

        {/* Sort & Open Now */}
        <div className="flex flex-col justify-between">
          <div>
            <label className="block text-stone-700 font-medium mb-1.5">Sort Results By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value as SortOption })}
              className="w-full py-1.5 px-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.openNowOnly}
                onChange={(e) => onChange({ openNowOnly: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 border-stone-300"
              />
              <span className="text-stone-700 text-xs font-medium flex items-center space-x-1">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>Open Now Only</span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
