from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.services.preference_service import PreferenceState, InterpretedCriteria
from app.services.places_provider import ProviderStatus, PlaceSearchResult
from app.services.recommendation_service import ScoredRecommendation


class SearchRequest(BaseModel):
    query: Optional[str] = "tourist attractions"
    session_id: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    category: Optional[str] = None
    limit: int = 12
    page_token: Optional[str] = None


class SearchResponse(BaseModel):
    session_id: str
    preferences: PreferenceState
    results: List[ScoredRecommendation]
    total_found: int
    next_page_token: Optional[str] = None
    interpreted_criteria: Optional[InterpretedCriteria] = None
    locality_expansion_suggested: bool = False
    provider_status: ProviderStatus


class PreferenceUpdateRequest(BaseModel):
    session_id: str
    user_message: Optional[str] = None
    direct_updates: Optional[Dict[str, Any]] = None


class GraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    stats: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    provider_status: ProviderStatus


# Itinerary Chatbot Schemas
class ItineraryStop(BaseModel):
    stop_index: int
    time_slot: str
    place: PlaceSearchResult
    duration_minutes: int
    visit_purpose: str
    estimated_cost: str
    opening_hours_note: str
    replacement_options: List[Dict[str, Any]] = Field(default_factory=list)


class ItineraryResponse(BaseModel):
    session_id: str
    city: str
    title: str
    theme: str
    date_or_day: str
    total_estimated_spend: str
    travel_feasibility_note: str
    stops: List[ItineraryStop] = Field(default_factory=list)
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)


class ItineraryMessageRequest(BaseModel):
    session_id: str
    message: str
    city: Optional[str] = None


class ReplaceStopRequest(BaseModel):
    session_id: str
    stop_index: int
    replacement_place_id: Optional[str] = None
    preference_note: Optional[str] = None
