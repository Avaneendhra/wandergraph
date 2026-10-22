from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.services.price_service import PriceEstimate


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class PhotoAttribution(BaseModel):
    display_name: str
    uri: Optional[str] = None
    photo_uri: Optional[str] = None


class PlacePhoto(BaseModel):
    name: str
    width_px: Optional[int] = None
    height_px: Optional[int] = None
    attributions: List[PhotoAttribution] = Field(default_factory=list)
    proxy_url: Optional[str] = None


class PlaceSearchResult(BaseModel):
    id: str
    name: str
    city: str
    locality: Optional[str] = None
    formatted_address: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    primary_type: Optional[str] = None
    types: List[str] = Field(default_factory=list)
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    price_level: Optional[int] = None
    approx_cost: Optional[float] = None
    currency: Optional[str] = None
    price_estimate: Optional[PriceEstimate] = None
    opening_hours_text: Optional[str] = None
    is_open_now: Optional[bool] = None
    attributions: List[str] = Field(default_factory=list)
    photo_reference: Optional[str] = None
    photos: List[PlacePhoto] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)


class PlaceDetailResult(BaseModel):
    id: str
    name: str
    city: str
    locality: Optional[str] = None
    formatted_address: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    types: List[str] = Field(default_factory=list)
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    price_level: Optional[int] = None
    approx_cost: Optional[float] = None
    currency: Optional[str] = None
    price_estimate: Optional[PriceEstimate] = None
    opening_hours_text: Optional[str] = None
    regular_opening_hours: Optional[Dict[str, Any]] = None
    website_uri: Optional[str] = None
    national_phone_number: Optional[str] = None
    editorial_summary: Optional[str] = None
    attributions: List[str] = Field(default_factory=list)
    photos: List[PlacePhoto] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)


class SearchPageResult(BaseModel):
    places: List[PlaceSearchResult] = Field(default_factory=list)
    next_page_token: Optional[str] = None

    def __len__(self) -> int:
        return len(self.places)

    def __iter__(self):
        return iter(self.places)

    def __getitem__(self, item):
        return self.places[item]


class ProviderStatus(BaseModel):
    provider_name: str
    is_live: bool
    api_key_configured: bool
    status_message: str


class PlacesProvider(ABC):
    @abstractmethod
    async def search_places(
        self,
        query: str,
        city: str,
        limit: int = 10,
        category: Optional[str] = None,
        page_token: Optional[str] = None,
        locality: Optional[str] = None,
    ) -> SearchPageResult:
        pass

    @abstractmethod
    async def get_place_details(self, place_id: str) -> Optional[PlaceDetailResult]:
        pass

    @abstractmethod
    def get_status(self) -> ProviderStatus:
        pass
