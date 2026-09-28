import React from 'react';
import { Gem, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onOpenApiSettings: () => void;
  onOpenManualLocation: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenApiSettings, onOpenManualLocation }) => {
  return (
    <footer className="mt-16 border-t border-amber-900/10 bg-white/60 py-8 text-stone-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Gem className="w-4 h-4 text-amber-600" />
            <span className="font-serif-luxury font-bold text-stone-900">JewelFinder</span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-500">
              High-accuracy real-time location-based fine jewelry locator
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <button
              onClick={onOpenManualLocation}
              className="text-stone-600 hover:text-amber-800 transition"
            >
              Search Any City
            </button>
            <button
              onClick={onOpenApiSettings}
              className="text-stone-600 hover:text-amber-800 transition"
            >
              API & Providers
            </button>
            <span className="text-stone-400">|</span>
            <span className="flex items-center text-stone-500">
              <Shield className="w-3.5 h-3.5 text-stone-400 mr-1" />
              Privacy First (No GPS logged)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-stone-200/60 text-center text-stone-400 text-[11px]">
          JewelFinder connects jewelry lovers to authentic boutiques, gold specialists, diamond merchants,
          and bespoke wedding jewelers worldwide with real calculated distances and directions.
        </div>
      </div>
    </footer>
  );
};
