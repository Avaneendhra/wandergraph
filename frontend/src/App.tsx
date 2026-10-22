import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CitySelector } from './components/CitySelector';
import { SearchBar } from './components/SearchBar';
import { PreferenceChips } from './components/PreferenceChips';
import { QuickFilters } from './components/QuickFilters';
import { PlaceCard } from './components/PlaceCard';
import { ConversationalBar } from './components/ConversationalBar';
import { GraphExplorer } from './components/GraphExplorer';
import { PlaceDetailsModal } from './components/PlaceDetailsModal';
import { SkeletonCard } from './components/SkeletonCard';
import { ErrorAlert } from './components/ErrorAlert';
import { InterpretationBanner } from './components/InterpretationBanner';
import { ItineraryChatbot } from './components/ItineraryChatbot';

import {
  CitiesMap,
  CategoriesMap,
  SearchResponse,
  PreferenceState,
  GraphData,
  ProviderStatus,
} from './types';
import {
  fetchHealth,
  fetchCities,
  fetchCategories,
  searchPlaces,
  updatePreferences,
  resetPreferences,
  removePreferenceField,
  fetchGraph,
} from './services/api';
import { Sparkles, MapPin, Compass, ArrowDownCircle, Loader2, Globe } from 'lucide-react';

export const App: React.FC = () => {
  // Session ID
  const [sessionId] = useState<string>(() => {
    const existing = localStorage.getItem('wandergraph_session_id');
    if (existing) return existing;
    const generated = 'wg-' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('wandergraph_session_id', generated);
    return generated;
  });

  // App Metadata
  const [cities, setCities] = useState<CitiesMap>({});
  const [, setCategories] = useState<CategoriesMap>({});
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | undefined>();

  // Active City & Query State
  const [selectedCityId, setSelectedCityId] = useState<string>('hyderabad');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('popular places');

  // Search Results & Active Preferences
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<PreferenceState>({
    session_id: sessionId,
    city: 'hyderabad',
    currency: 'INR',
    interests: [],
    desired_activities: [],
    atmosphere: [],
    accessibility_requirements: [],
  });

  // Smart Search Interpretation
  const [isInterpretationDismissed, setIsInterpretationDismissed] = useState(false);

  // Knowledge Graph Data
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphFocusedNodeId, setGraphFocusedNodeId] = useState<string | null>(null);

  // Modals & Drawers
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [isGraphExplorerOpen, setIsGraphExplorerOpen] = useState(false);
  const [detailsPlaceId, setDetailsPlaceId] = useState<string | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchHealth()
      .then((health) => setProviderStatus(health.provider_status))
      .catch((err) => console.warn('Health check failed:', err));

    fetchCities()
      .then((data) => setCities(data))
      .catch(() => setErrorMessage('Failed to load supported cities configuration.'));

    fetchCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.warn('Categories load error:', err));
  }, []);

  // Execute Search
  const executeSearch = useCallback(
    async (
      queryText?: string,
      cityOverride?: string,
      categoryOverride?: string | null,
      localityOverride?: string | null
    ) => {
      setIsLoading(true);
      setErrorMessage(null);
      setIsInterpretationDismissed(false);
      const queryToUse = queryText !== undefined ? queryText : currentQuery;
      const cityToUse = cityOverride !== undefined ? cityOverride : selectedCityId;
      const catToUse = categoryOverride !== undefined ? (categoryOverride || undefined) : (activeCategory || undefined);
      const locToUse = localityOverride !== undefined ? (localityOverride || undefined) : (preferences.locality || undefined);

      try {
        const response = await searchPlaces({
          query: queryToUse,
          sessionId,
          city: cityToUse,
          locality: locToUse,
          category: catToUse,
          limit: 12,
        });

        setSearchResults(response);
        setPreferences(response.preferences);
        setNextPageToken(response.next_page_token || null);
        setProviderStatus(response.provider_status);
      } catch (err: any) {
        setErrorMessage(err.message || 'Error occurred while searching places.');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, currentQuery, selectedCityId, activeCategory, preferences.locality]
  );

  // Load More Results (Dynamic Pagination with Deduplication)
  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore || !searchResults) return;
    setIsLoadingMore(true);

    try {
      const response = await searchPlaces({
        query: currentQuery,
        sessionId,
        city: selectedCityId,
        locality: preferences.locality || undefined,
        category: activeCategory || undefined,
        limit: 12,
        pageToken: nextPageToken,
      });

      // Deduplicate new results against already loaded places
      const existingIds = new Set(searchResults.results.map((r) => r.place.id));
      const uniqueNew = response.results.filter((r) => !existingIds.has(r.place.id));

      setSearchResults({
        ...searchResults,
        results: [...searchResults.results, ...uniqueNew],
        total_found: searchResults.total_found + uniqueNew.length,
      });
      setNextPageToken(response.next_page_token || null);
    } catch (err: any) {
      console.warn('Error loading more places:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Load Graph for active city
  const loadGraph = useCallback(async (city: string) => {
    try {
      const data = await fetchGraph(city);
      setGraphData(data);
    } catch (err) {
      console.warn('Graph load error:', err);
    }
  }, []);

  // Initial search on mount
  useEffect(() => {
    executeSearch('popular places', selectedCityId, null, null);
    loadGraph(selectedCityId);
  }, []);

  // Handle City Change
  const handleSelectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    executeSearch('popular places', cityId, null, null);
    loadGraph(cityId);
  };

  // Handle Text Search from SearchBar
  const handleSearchSubmit = (query: string) => {
    setCurrentQuery(query);
    executeSearch(query, selectedCityId, activeCategory);
  };

  // Handle Category Filter Click
  const handleSelectCategory = (cat: string | null) => {
    setActiveCategory(cat);
    executeSearch(currentQuery, selectedCityId, cat);
  };

  // Handle Companion Filter Click
  const handleSelectCompanion = async (comp: string | null) => {
    try {
      setIsLoading(true);
      const updated = await updatePreferences(sessionId, undefined, { companion_type: comp });
      setPreferences(updated.preferences);
      executeSearch(currentQuery, selectedCityId, activeCategory);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update companion preference.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Budget Quick Filter Click
  const handleSelectBudget = async (budget: number | null) => {
    try {
      setIsLoading(true);
      const updated = await updatePreferences(sessionId, undefined, { budget_max: budget });
      setPreferences(updated.preferences);
      executeSearch(currentQuery, selectedCityId, activeCategory);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update budget filter.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Conversational Refinement Message
  const handleSendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      const updated = await updatePreferences(sessionId, message);
      setPreferences(updated.preferences);
      if (updated.preferences.city !== selectedCityId) {
        setSelectedCityId(updated.preferences.city);
        loadGraph(updated.preferences.city);
      }
      executeSearch(message, updated.preferences.city, activeCategory, updated.preferences.locality);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refine preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Removing Individual Constraint Chip
  const handleRemoveField = async (fieldName: string) => {
    try {
      setIsLoading(true);
      const updated = await removePreferenceField(sessionId, fieldName);
      setPreferences(updated.preferences);
      executeSearch(currentQuery, selectedCityId, activeCategory, updated.preferences.locality);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove filter.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset All Constraints
  const handleResetPreferences = async () => {
    try {
      setIsLoading(true);
      const res = await resetPreferences(sessionId);
      setPreferences(res.preferences);
      setActiveCategory(null);
      setCurrentQuery('popular places');
      executeSearch('popular places', selectedCityId, null, null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Explore in Graph Click
  const handleExploreInGraph = (placeId: string) => {
    const formattedNodeId = placeId.startsWith('place:') ? placeId : `place:${placeId}`;
    setGraphFocusedNodeId(formattedNodeId);
    setIsGraphExplorerOpen(true);
  };

  const currentCityName = cities[selectedCityId]?.name || selectedCityId.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        currentCityName={currentCityName}
        onOpenCitySelector={() => setIsCitySelectorOpen(true)}
        onOpenGraph={() => {
          setGraphFocusedNodeId(null);
          setIsGraphExplorerOpen(true);
        }}
        providerStatus={providerStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto pt-2 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MultiDiGraph Powered Place Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{currentCityName}</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 leading-relaxed">
            Tailor experiences, companions, atmosphere, and budgets through progressive conversational refinement.
          </p>
        </div>

        {/* Search Bar with typo tolerance */}
        <SearchBar
          currentCityName={currentCityName}
          onSearch={handleSearchSubmit}
          isLoading={isLoading}
        />

        {/* Intelligent Search Interpretation Banner */}
        {!isInterpretationDismissed && searchResults?.interpreted_criteria && (
          <InterpretationBanner
            criteria={searchResults.interpreted_criteria}
            onDismiss={() => setIsInterpretationDismissed(true)}
          />
        )}

        {/* Locality Expansion Prompt Alert */}
        {searchResults?.locality_expansion_suggested && preferences.locality && (
          <div className="w-full max-w-5xl mx-auto my-3 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-amber-200">
                Only few venues were found directly in <b>{preferences.locality}</b>. Would you like to expand your search across greater <b>{currentCityName}</b>?
              </p>
            </div>
            <button
              onClick={() => handleRemoveField('locality')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition whitespace-nowrap shrink-0"
            >
              Expand to Greater {currentCityName}
            </button>
          </div>
        )}

        {/* Active Context / Preference Chips */}
        <PreferenceChips
          preferences={preferences}
          onRemoveField={handleRemoveField}
          onResetPreferences={handleResetPreferences}
        />

        {/* Quick Category, Companion & Budget Filters */}
        <QuickFilters
          preferences={preferences}
          onSelectCategory={handleSelectCategory}
          onSelectCompanion={handleSelectCompanion}
          onSelectBudget={handleSelectBudget}
          onSelectAtmosphere={(atm) => {
            if (atm) handleSendMessage(`Somewhere ${atm}`);
          }}
          activeCategory={activeCategory}
        />

        {/* Error Alert if any */}
        {errorMessage && (
          <ErrorAlert
            message={errorMessage}
            onRetry={() => executeSearch(currentQuery, selectedCityId, activeCategory)}
          />
        )}

        {/* Results Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {preferences.locality ? `Places in ${preferences.locality}, ${currentCityName}` : `Recommendations in ${currentCityName}`}
              </h2>
              {searchResults && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {searchResults.results.length} loaded
                </span>
              )}
            </div>

            {/* Subgraph button */}
            <button
              onClick={() => {
                setGraphFocusedNodeId(`city:${selectedCityId}`);
                setIsGraphExplorerOpen(true);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore {currentCityName} Graph →</span>
            </button>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : searchResults && searchResults.results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {searchResults.results.map((rec) => (
                  <PlaceCard
                    key={rec.place.id}
                    recommendation={rec}
                    onExploreInGraph={handleExploreInGraph}
                    onViewDetails={(id) => setDetailsPlaceId(id)}
                  />
                ))}
              </div>

              {/* Dynamic Pagination / Load More */}
              {nextPageToken && (
                <div className="mt-10 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-white font-semibold text-xs transition shadow-lg disabled:opacity-60"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Fetching next page of places...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="w-4 h-4 text-indigo-400" />
                        <span>Load More Places in {currentCityName}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 max-w-xl mx-auto">
              <MapPin className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No places match the active criteria</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Try widening your budget, removing locality constraints, or searching for other categories.
              </p>
              <button
                onClick={handleResetPreferences}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Conversational Refinement Engine Bar */}
        <ConversationalBar
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>

      {/* Floating Personalized AI Itinerary Chatbot */}
      <ItineraryChatbot
        sessionId={sessionId}
        cityName={currentCityName}
        cityId={selectedCityId}
        onExploreInGraph={handleExploreInGraph}
        onViewPlaceDetails={(id) => setDetailsPlaceId(id)}
      />

      {/* Modals */}
      <CitySelector
        isOpen={isCitySelectorOpen}
        onClose={() => setIsCitySelectorOpen(false)}
        cities={cities}
        selectedCityId={selectedCityId}
        onSelectCity={handleSelectCity}
      />

      <GraphExplorer
        isOpen={isGraphExplorerOpen}
        onClose={() => setIsGraphExplorerOpen(false)}
        graphData={graphData}
        selectedNodeId={graphFocusedNodeId}
        onFilterByCategory={(cat) => handleSelectCategory(cat)}
      />

      <PlaceDetailsModal
        isOpen={Boolean(detailsPlaceId)}
        onClose={() => setDetailsPlaceId(null)}
        placeId={detailsPlaceId}
        onExploreInGraph={handleExploreInGraph}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>
          WanderGraph © 2026 — Intelligent Knowledge-Graph Discovery Engine.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Compliant with Google Maps Platform Terms of Service & Open Data Licences. Zero restricted caching.
        </p>
      </footer>
    </div>
  );
};

export default App;
