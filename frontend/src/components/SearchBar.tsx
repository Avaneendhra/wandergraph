import React, { useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';

interface SearchBarProps {
  currentCityName: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const CITY_PROMPTS: Record<string, string[]> = {
  Hyderabad: [
    'Best historical monuments in Hyderabad',
    'Romantic lakeside spots for couples in evening',
    'Quiet parks under ₹100',
    'Old City heritage & photography walks',
  ],
  Bengaluru: [
    'Lush gardens and parks in morning',
    'Microbreweries and social dining in Indiranagar',
    'Peaceful spots for solo reading',
    'Bangalore Palace and royal heritage',
  ],
  Tokyo: [
    'Traditional Shinto shrines and temples',
    'Peaceful gardens in Shinjuku for couples',
    'Exciting vibrant spots around Shibuya',
    'Free cultural attractions in evening',
  ],
  Kyoto: [
    'Peaceful UNESCO zen temples',
    'Romantic evening walks in Gion district',
    'Arashiyama bamboo grove and nature trails',
    'Family friendly traditional experiences under ¥3,000',
  ],
};

export const SearchBar: React.FC<SearchBarProps> = ({
  currentCityName,
  onSearch,
  isLoading,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
  };

  const suggestions = CITY_PROMPTS[currentCityName] || CITY_PROMPTS['Hyderabad'];

  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-indigo-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search places, vibes, activities in ${currentCityName}...`}
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm md:text-base shadow-xl backdrop-blur-md transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-24 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Explore'}
          </button>
        </div>
      </form>

      {/* Suggested Query Chips */}
      <div className="mt-3 flex items-center flex-wrap gap-1.5 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Try:
        </span>
        {suggestions.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(prompt)}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-slate-200 transition text-[11px]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
