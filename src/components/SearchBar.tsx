import React, { useState } from 'react';
import { Search, X, MapPin, Sparkles } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onSearch: (q: string) => void;
  onOpenManualLocation: () => void;
  locationName?: string;
}

const QUICK_SEARCH_CHIPS = [
  { label: 'All Jewelry', query: '' },
  { label: 'Gold Jewelry', query: 'gold' },
  { label: 'Diamonds', query: 'diamond' },
  { label: 'Bridal & Rings', query: 'bridal' },
  { label: 'Tiffany & Co.', query: 'Tiffany' },
  { label: 'Cartier', query: 'Cartier' },
  { label: 'Luxury Watches', query: 'watch' },
  { label: 'Custom Jeweler', query: 'custom' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onSearch,
  onOpenManualLocation,
  locationName,
}) => {
  const [localInput, setLocalInput] = useState(query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localInput);
  };

  const handleClear = () => {
    setLocalInput('');
    onSearch('');
  };

  return (
    <div className="w-full space-y-3">
      {/* Search Bar Input Container */}
      <form onSubmit={handleSubmit} className="relative flex items-center shadow-sm">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-5 h-5 text-amber-700/70" />
          </div>

          <input
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Search jewelry stores near me (e.g., diamond, gold, Tiffany, bridal)..."
            className="w-full pl-11 pr-24 py-3.5 rounded-xl border border-stone-300/80 bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition shadow-inner"
          />

          {localInput && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-14 pr-2 flex items-center text-stone-400 hover:text-stone-600 transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center space-x-1"
          >
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* Quick Search Categories & Location Trigger */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center space-x-1.5 flex-nowrap">
          <span className="text-stone-400 text-[11px] font-medium flex items-center pr-1">
            <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
            Popular:
          </span>
          {QUICK_SEARCH_CHIPS.map((chip) => {
            const isActive = (chip.query === '' && query === '') || (chip.query !== '' && query.toLowerCase().includes(chip.query.toLowerCase()));
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setLocalInput(chip.query);
                  onSearch(chip.query);
                }}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs transition border ${
                  isActive
                    ? 'bg-amber-600 text-white border-amber-600 font-medium shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenManualLocation}
          className="whitespace-nowrap flex items-center space-x-1 text-xs text-amber-800 hover:text-amber-900 font-medium px-2 py-1 rounded-md hover:bg-amber-100/50 transition flex-shrink-0"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-600" />
          <span>Change Location</span>
        </button>
      </div>
    </div>
  );
};
