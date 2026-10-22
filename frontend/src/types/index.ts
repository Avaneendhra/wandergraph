export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PhotoAttribution {
  display_name: string;
  uri?: string;
  photo_uri?: string;
}

export interface PlacePhoto {
  name: string;
  width_px?: number;
  height_px?: number;
  attributions: PhotoAttribution[];
  proxy_url?: string;
}

export interface PriceEstimate {
  spending_range_text: string;
  admission_text: string;
  currency: string;
  estimate_type: 'verified' | 'estimated_by_price_level' | 'unknown' | string;
  min_spend?: number | null;
  max_spend?: number | null;
  is_free: boolean;
  methodology_note: string;
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  city: string;
  locality?: string | null;
  formatted_address?: string;
  coordinates?: Coordinates;
  primary_type?: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  approx_cost?: number;
  currency?: string;
  price_estimate?: PriceEstimate;
  opening_hours_text?: string;
  is_open_now?: boolean;
  attributions?: string[];
  photo_reference?: string;
  photos?: PlacePhoto[];
  provenance?: {
    source?: string;
    verification_status?: string;
    retrieval_date?: string;
    confidence?: string;
    source_place_id?: string;
  };
}

export interface PlaceDetailResult {
  id: string;
  name: string;
  city: string;
  locality?: string | null;
  formatted_address?: string;
  coordinates?: Coordinates;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  approx_cost?: number;
  currency?: string;
  price_estimate?: PriceEstimate;
  opening_hours_text?: string;
  regular_opening_hours?: Record<string, any>;
  website_uri?: string;
  national_phone_number?: string;
  editorial_summary?: string;
  attributions?: string[];
  photos?: PlacePhoto[];
  provenance?: Record<string, any>;
}

export interface ScoredRecommendation {
  place: PlaceSearchResult;
  total_score: number;
  matched_reasons: string[];
  unverified_attributes: string[];
  explanation: string;
  match_confidence: 'high' | 'moderate' | 'potential';
}

export interface InterpretedCriteria {
  original_query?: string;
  corrected_query?: string;
  detected_city?: string;
  detected_locality?: string;
  detected_category?: string;
  detected_atmospheres: string[];
  detected_companion?: string;
  detected_budget?: number;
  was_corrected: boolean;
  explanation_banner?: string;
}

export interface PreferenceState {
  session_id: string;
  city: string;
  locality?: string | null;
  budget_max?: number | null;
  currency: string;
  companion_type?: string | null;
  interests: string[];
  desired_activities: string[];
  atmosphere: string[];
  indoor_outdoor?: string | null;
  preferred_time?: string | null;
  accessibility_requirements: string[];
  crowd_preference?: string | null;
  search_query?: string | null;
  interpreted_criteria?: InterpretedCriteria | null;
}

export interface ProviderStatus {
  provider_name: string;
  is_live: boolean;
  api_key_configured: boolean;
  status_message: string;
}

export interface SearchRequestParams {
  query?: string;
  sessionId?: string;
  city?: string;
  locality?: string;
  category?: string;
  limit?: number;
  pageToken?: string;
}

export interface SearchResponse {
  session_id: string;
  preferences: PreferenceState;
  results: ScoredRecommendation[];
  total_found: number;
  next_page_token?: string | null;
  interpreted_criteria?: InterpretedCriteria | null;
  locality_expansion_suggested?: boolean;
  provider_status: ProviderStatus;
}

export interface CityInfo {
  id: string;
  name: string;
  country: string;
  country_code: string;
  primary_language: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  coordinates: Coordinates;
  popular_neighborhoods: string[];
}

export type CitiesMap = Record<string, CityInfo>;

export interface Subcategory {
  id: string;
  name: string;
  google_types?: string[];
}

export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
}

export type CategoriesMap = Record<string, CategoryGroup>;

export interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    type: string;
    color: string;
    properties?: Record<string, any>;
    provenance?: any;
  };
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    relation: string;
    properties?: Record<string, any>;
    provenance?: any;
  };
}

export interface GraphData {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    nodes_by_type: Record<string, number>;
    edges_by_relation: Record<string, number>;
  };
}

// Itinerary Chatbot Types
export interface ItineraryStop {
  stop_index: number;
  time_slot: string;
  place: PlaceSearchResult;
  duration_minutes: number;
  visit_purpose: string;
  estimated_cost: string;
  opening_hours_note: string;
  replacement_options: Array<{ id: string; name: string; primary_type?: string; rating?: number }>;
}

export interface ItineraryResponse {
  session_id: string;
  city: string;
  title: string;
  theme: string;
  date_or_day: string;
  total_estimated_spend: string;
  travel_feasibility_note: string;
  stops: ItineraryStop[];
  conversation_history: Array<{ role: string; content: string }>;
}

export interface ItineraryMessageRequest {
  session_id: string;
  message: string;
  city?: string;
}

export interface ReplaceStopRequest {
  session_id: string;
  stop_index: number;
  replacement_place_id?: string;
  preference_note?: string;
}
