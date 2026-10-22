import React from 'react';
import { X, RotateCcw, Users, Coins, CloudSun, Sparkles, Accessibility, MapPin } from 'lucide-react';
import { PreferenceState } from '../types';

interface PreferenceChipsProps {
  preferences: PreferenceState;
  onRemoveField: (fieldName: string) => void;
  onResetPreferences: () => void;
}

export const PreferenceChips: React.FC<PreferenceChipsProps> = ({
  preferences,
  onRemoveField,
  onResetPreferences,
}) => {
  const hasCustomConstraints =
    Boolean(preferences.locality) ||
    Boolean(preferences.companion_type) ||
    Boolean(preferences.budget_max !== undefined && preferences.budget_max !== null) ||
    Boolean(preferences.atmosphere && preferences.atmosphere.length > 0) ||
    Boolean(preferences.preferred_time) ||
    Boolean(preferences.accessibility_requirements && preferences.accessibility_requirements.length > 0) ||
    Boolean(preferences.indoor_outdoor);

  const currSym = preferences.currency === 'JPY' ? '¥' : '₹';

  return (
    <div className="w-full max-w-5xl mx-auto my-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Active Context:
          </span>

          {/* City (Permanent base constraint) */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            City: {preferences.city.charAt(0).toUpperCase() + preferences.city.slice(1)}
          </span>

          {/* Locality Chip */}
          {preferences.locality && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30">
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              <span>Locality: {preferences.locality}</span>
              <button
                onClick={() => onRemoveField('locality')}
                className="hover:text-white p-0.5 ml-0.5"
                title="Remove locality filter"
                aria-label="Remove locality"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Companion Chip */}
          {preferences.companion_type && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>With: {preferences.companion_type.charAt(0).toUpperCase() + preferences.companion_type.slice(1)}</span>
              <button
                onClick={() => onRemoveField('companion_type')}
                className="hover:text-white p-0.5"
                title="Remove companion constraint"
                aria-label="Remove companion"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Budget Chip */}
          {preferences.budget_max !== undefined && preferences.budget_max !== null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {preferences.budget_max === 0
                  ? 'Free only'
                  : `Max ${currSym}${preferences.budget_max.toLocaleString()}`}
              </span>
              <button
                onClick={() => onRemoveField('budget_max')}
                className="hover:text-white p-0.5"
                title="Remove budget constraint"
                aria-label="Remove budget"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Atmosphere Chip */}
          {preferences.atmosphere && preferences.atmosphere.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vibe: {preferences.atmosphere.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}</span>
              <button
                onClick={() => onRemoveField('atmosphere')}
                className="hover:text-white p-0.5"
                title="Remove atmosphere constraint"
                aria-label="Remove atmosphere"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Preferred Time Chip */}
          {preferences.preferred_time && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
              <CloudSun className="w-3.5 h-3.5 text-yellow-400" />
              <span>Time: {preferences.preferred_time.charAt(0).toUpperCase() + preferences.preferred_time.slice(1)}</span>
              <button
                onClick={() => onRemoveField('preferred_time')}
                className="hover:text-white p-0.5"
                title="Remove time constraint"
                aria-label="Remove time"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Accessibility Chip */}
          {preferences.accessibility_requirements && preferences.accessibility_requirements.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-lime-500/10 text-lime-300 border border-lime-500/30">
              <Accessibility className="w-3.5 h-3.5 text-lime-400" />
              <span>Wheelchair Accessible</span>
              <button
                onClick={() => onRemoveField('accessibility_requirements')}
                className="hover:text-white p-0.5"
                title="Remove accessibility requirement"
                aria-label="Remove accessibility"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Indoor / Outdoor Chip */}
          {preferences.indoor_outdoor && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
              <span>{preferences.indoor_outdoor.charAt(0).toUpperCase() + preferences.indoor_outdoor.slice(1)}</span>
              <button
                onClick={() => onRemoveField('indoor_outdoor')}
                className="hover:text-white p-0.5"
                title="Remove indoor/outdoor constraint"
                aria-label="Remove indoor/outdoor"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Reset Action */}
        {hasCustomConstraints && (
          <button
            onClick={onResetPreferences}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition ml-auto px-2 py-1 rounded hover:bg-slate-800"
            title="Clear all filters and reset"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Constraints</span>
          </button>
        )}
      </div>
    </div>
  );
};
