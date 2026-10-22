import {
  CitiesMap,
  CategoriesMap,
  SearchResponse,
  PreferenceState,
  GraphData,
  PlaceSearchResult,
  SearchRequestParams,
  ItineraryResponse,
} from '../types';

function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || envUrl.trim() === '') return '/api';
  let clean = envUrl.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    clean = `https://${clean}`;
  }
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

const API_BASE = resolveApiBase();

export function getPhotoProxyUrl(photoName: string, maxWidth = 800, maxHeight = 600): string {
  if (photoName.startsWith('http://') || photoName.startsWith('https://')) {
    return photoName;
  }
  return `${API_BASE}/places/photo?name=${encodeURIComponent(photoName)}&max_width=${maxWidth}&max_height=${maxHeight}`;
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch API health');
  return res.json();
}

export async function fetchCities(): Promise<CitiesMap> {
  const res = await fetch(`${API_BASE}/cities`);
  if (!res.ok) throw new Error('Failed to fetch cities');
  return res.json();
}

export async function fetchCategories(): Promise<CategoriesMap> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function searchPlaces(params: SearchRequestParams): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: params.query || 'popular places',
      session_id: params.sessionId,
      city: params.city,
      locality: params.locality,
      category: params.category,
      limit: params.limit || 12,
      page_token: params.pageToken,
    }),
  });
  if (!res.ok) throw new Error('Failed to execute search');
  return res.json();
}

export async function updatePreferences(
  sessionId: string,
  userMessage?: string,
  directUpdates?: Record<string, any>
): Promise<{ session_id: string; preferences: PreferenceState }> {
  const res = await fetch(`${API_BASE}/preferences/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      user_message: userMessage,
      direct_updates: directUpdates,
    }),
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
}

export async function resetPreferences(
  sessionId: string
): Promise<{ session_id: string; preferences: PreferenceState }> {
  const res = await fetch(`${API_BASE}/preferences/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to reset preferences');
  return res.json();
}

export async function removePreferenceField(
  sessionId: string,
  fieldName: string
): Promise<{ session_id: string; preferences: PreferenceState }> {
  const res = await fetch(`${API_BASE}/preferences/${sessionId}/field/${fieldName}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove preference field');
  return res.json();
}

export async function fetchGraph(city?: string): Promise<GraphData> {
  const url = city ? `${API_BASE}/graph?city=${encodeURIComponent(city)}` : `${API_BASE}/graph`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch knowledge graph');
  return res.json();
}

export async function fetchNodeNeighborhood(nodeId: string, depth = 1): Promise<{ nodes: any[]; edges: any[] }> {
  const res = await fetch(`${API_BASE}/graph/node/${encodeURIComponent(nodeId)}?depth=${depth}`);
  if (!res.ok) throw new Error('Failed to fetch node neighborhood');
  return res.json();
}

export async function fetchPlaceDetails(placeId: string): Promise<{ place: PlaceSearchResult; graph_connections?: any }> {
  const res = await fetch(`${API_BASE}/places/${encodeURIComponent(placeId)}`);
  if (!res.ok) throw new Error('Failed to fetch place details');
  return res.json();
}

// Itinerary Chatbot API Calls
export async function sendItineraryMessage(
  sessionId: string,
  message: string,
  city?: string
): Promise<ItineraryResponse> {
  const res = await fetch(`${API_BASE}/itinerary/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      city,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to process itinerary request');
  }
  return res.json();
}

export async function replaceItineraryStop(
  sessionId: string,
  stopIndex: number,
  replacementPlaceId?: string,
  preferenceNote?: string
): Promise<ItineraryResponse> {
  const res = await fetch(`${API_BASE}/itinerary/replace-stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      stop_index: stopIndex,
      replacement_place_id: replacementPlaceId,
      preference_note: preferenceNote,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to replace stop');
  }
  return res.json();
}

export async function resetItinerary(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/itinerary/${sessionId}`, {
    method: 'DELETE',
  });
}
