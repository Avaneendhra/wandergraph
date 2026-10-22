import React from 'react';
import { Compass, Network, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProviderStatus } from '../types';

interface NavbarProps {
  currentCityName: string;
  onOpenCitySelector: () => void;
  onOpenGraph: () => void;
  providerStatus?: ProviderStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCityName,
  onOpenCitySelector,
  onOpenGraph,
  providerStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Compass className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-white">Wander<span className="text-indigo-400">Graph</span></span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                KG AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Intelligent Knowledge-Graph Discovery</p>
          </div>
        </div>

        {/* Center / Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* City Selector Button */}
          <button
            onClick={onOpenCitySelector}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 text-sm font-medium text-slate-200 transition-all duration-150"
            title="Change active city"
          >
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span>{currentCityName}</span>
            <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Change</span>
          </button>

          {/* Graph Explorer Button */}
          <button
            onClick={onOpenGraph}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 hover:border-indigo-500/60 text-sm font-semibold text-indigo-300 transition-all shadow-sm"
          >
            <Network className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Graph Explorer</span>
          </button>

          {/* Provider Status Pill */}
          {providerStatus && (
            <div
              className={`hidden md:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border ${
                providerStatus.is_live
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : 'bg-amber-950/50 text-amber-400 border-amber-800/50'
              }`}
              title={providerStatus.status_message}
            >
              {providerStatus.is_live ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Places (New) Live</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dev Mode (Local Seed)</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
