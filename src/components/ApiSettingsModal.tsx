import React, { useState } from 'react';
import { X, Key, CheckCircle2, ShieldCheck, ExternalLink, HelpCircle, Sparkles } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: 'google' | 'osm';
  onSaveGoogleKey: (key: string) => void;
  onSelectProvider: (provider: 'google' | 'osm') => void;
  currentKey: string;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  activeProvider,
  onSaveGoogleKey,
  onSelectProvider,
  currentKey,
}) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGoogleKey(keyInput.trim());
    if (keyInput.trim()) {
      onSelectProvider('google');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleUseFreeOSM = () => {
    onSelectProvider('osm');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 to-stone-850 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-amber-100">
                Maps & Places Provider Settings
              </h3>
              <p className="text-xs text-stone-300">
                Choose between OpenStreetMap or Google Maps Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-8rem)] overflow-y-auto">
          {/* Provider Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* OpenStreetMap / Photon (Default Free) */}
            <div
              onClick={handleUseFreeOSM}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                activeProvider === 'osm'
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                  : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-stone-900 text-sm">OpenStreetMap & Photon</span>
                {activeProvider === 'osm' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                )}
              </div>
              <p className="text-xs text-stone-600 mb-2">
                100% Free, active out of the box with zero setup required. Uses real live global jewelry
                store coordinates and addresses.
              </p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Active & Ready
              </span>
            </div>

            {/* Google Maps Platform */}
            <div
              onClick={() => onSelectProvider('google')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                activeProvider === 'google'
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                  : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-stone-900 text-sm">Google Maps Platform</span>
                {activeProvider === 'google' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                )}
              </div>
              <p className="text-xs text-stone-600 mb-2">
                Uses official Google Places API, real Google user reviews, photos, and ratings. Requires
                an API key.
              </p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Requires API Key
              </span>
            </div>
          </div>

          {/* Google Maps API Key Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Google Maps API Key</span>
                <span className="text-[11px] font-normal text-stone-400">Stored securely in your browser</span>
              </label>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs font-mono focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key saved and applied!</span>
                </span>
              ) : (
                <span className="text-xs text-stone-500">
                  You can also set <code className="bg-stone-100 px-1 py-0.5 rounded">GOOGLE_MAPS_API_KEY</code> in <code className="bg-stone-100 px-1 py-0.5 rounded">.env</code>
                </span>
              )}

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-sm"
              >
                Save & Apply
              </button>
            </div>
          </form>

          {/* Required Google Cloud APIs Guide */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-stone-700 space-y-2">
            <div className="flex items-center space-x-1.5 font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Required Google APIs to Enable:</span>
            </div>
            <p className="text-[11px] text-stone-600">
              To use your Google Maps API key, ensure these 4 APIs are enabled in your Google Cloud Console:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-800 font-medium pl-1">
              <li><strong>Maps JavaScript API</strong> (for rendering the interactive map)</li>
              <li><strong>Places API (New) / Places API</strong> (for searching nearby jewelry stores and details)</li>
              <li><strong>Geocoding API</strong> (for manual address searches)</li>
              <li><strong>Directions API</strong> (for turn-by-turn navigation)</li>
            </ul>
            <div className="pt-2">
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-amber-800 hover:text-amber-950 font-semibold text-[11px] underline"
              >
                <span>Open Google Cloud Console API Library</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
