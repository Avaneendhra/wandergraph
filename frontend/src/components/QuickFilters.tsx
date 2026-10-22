import React from 'react';
import { Landmark, Trees, Utensils, Heart, Users, User, Wine, Coins } from 'lucide-react';
import { PreferenceState } from '../types';

interface QuickFiltersProps {
  preferences: PreferenceState;
  onSelectCategory: (cat: string | null) => void;
  onSelectCompanion: (comp: string | null) => void;
  onSelectBudget?: (budget: number | null) => void;
  onSelectAtmosphere?: (atm: string | null) => void;
  activeCategory: string | null;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  preferences,
  onSelectCategory,
  onSelectCompanion,
  onSelectBudget,
  activeCategory,
}) => {
  const isJpy = preferences.currency === 'JPY';

  // Budget tiers per currency
  const budgetTiers = isJpy
    ? [
        { label: 'Free', value: 0 },
        { label: '< ¥1,500', value: 1500 },
        { label: '< ¥4,000', value: 4000 },
      ]
    : [
        { label: 'Free', value: 0 },
        { label: '< ₹500', value: 500 },
        { label: '< ₹1,500', value: 1500 },
      ];

  return (
    <div className="w-full max-w-5xl mx-auto my-3 flex flex-col lg:flex-row gap-3 items-center justify-between text-xs">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
            !activeCategory
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Categories
        </button>
        <button
          onClick={() => onSelectCategory('tourist_attraction')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
            activeCategory === 'tourist_attraction'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-indigo-400" />
          Attractions
        </button>
        <button
          onClick={() => onSelectCategory('park')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
            activeCategory === 'park'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Trees className="w-3.5 h-3.5 text-emerald-400" />
          Nature & Parks
        </button>
        <button
          onClick={() => onSelectCategory('restaurant')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
            activeCategory === 'restaurant'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-amber-400" />
          Food & Drink
        </button>
      </div>

      {/* Companion & Budget Quick Selectors */}
      <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
        {/* Companions */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'couples', label: 'Couples', icon: Heart, color: 'text-rose-400' },
            { id: 'family', label: 'Family', icon: Users, color: 'text-amber-400' },
            { id: 'solo', label: 'Solo', icon: User, color: 'text-cyan-400' },
            { id: 'friends', label: 'Friends', icon: Wine, color: 'text-purple-400' },
          ].map((comp) => {
            const isSelected = preferences.companion_type === comp.id;
            const IconComponent = comp.icon;
            return (
              <button
                key={comp.id}
                onClick={() => onSelectCompanion(isSelected ? null : comp.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <IconComponent className={`w-3 h-3 ${comp.color}`} />
                <span>{comp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Budget Tiers */}
        {onSelectBudget && (
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <Coins className="w-3.5 h-3.5 text-emerald-400 mr-0.5" />
            {budgetTiers.map((tier) => {
              const isSelected = preferences.budget_max === tier.value;
              return (
                <button
                  key={tier.label}
                  onClick={() => onSelectBudget(isSelected ? null : tier.value)}
                  className={`px-2 py-0.5 rounded-md border text-[11px] font-medium transition ${
                    isSelected
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {tier.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
