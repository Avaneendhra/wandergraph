import React from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { CitiesMap } from '../types';

interface CitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  cities: CitiesMap;
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
}

const CITY_EMOJIS: Record<string, string> = {
  hyderabad: '🇮🇳',
  bengaluru: '🇮🇳',
  tokyo: '🇯🇵',
  kyoto: '🇯🇵',
};

const CITY_HIGHLIGHTS: Record<string, string> = {
  hyderabad: 'Historic Nizami architecture, pearls, vibrant bazaars, and scenic lakeside promenades.',
  bengaluru: 'Garden city with lush botanical parks, craft brewpubs, tech hubs, and heritage palaces.',
  tokyo: 'Dynamic metropolis fusing ancient Shinto shrines, neon alleys, and tranquil gardens.',
  kyoto: 'Historic cultural capital famous for UNESCO temples, bamboo groves, and traditional tea houses.',
};

export const CitySelector: React.FC<CitySelectorProps> = ({
  isOpen,
  onClose,
  cities,
  selectedCityId,
  onSelectCity,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Choose Destination City
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a city to discover places and explore its knowledge graph.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* City Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5">
          {Object.values(cities).map((city) => {
            const isSelected = city.id === selectedCityId;
            return (
              <button
                key={city.id}
                onClick={() => {
                  onSelectCity(city.id);
                  onClose();
                }}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/80 ring-2 ring-indigo-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl" role="img" aria-label={city.country}>
                      {CITY_EMOJIS[city.id] || '📍'}
                    </span>
                    <span className="font-bold text-white text-base">{city.name}</span>
                  </div>
                  {isSelected ? (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {city.currency_symbol} {city.currency}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {CITY_HIGHLIGHTS[city.id] || `${city.name}, ${city.country}`}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {city.popular_neighborhoods.slice(0, 3).map((nh) => (
                    <span
                      key={nh}
                      className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/60"
                    >
                      {nh}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-800/60">
          <p className="text-[11px] text-slate-500">
            More cities can be added via the extensible configuration engine without redesigning the graph schema.
          </p>
        </div>
      </div>
    </div>
  );
};
