import json
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from app.services.places_provider import (
    PlacesProvider,
    PlaceSearchResult,
    PlaceDetailResult,
    ProviderStatus,
    Coordinates,
    PlacePhoto,
    PhotoAttribution,
    SearchPageResult,
)
from app.services.price_service import PriceService
from app.utils.logging import logger

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "seed_places.json"

# Curated fallback photos per category with authentic photographer credits
CATEGORY_FALLBACK_PHOTOS: Dict[str, Dict[str, Any]] = {
    "attractions_culture": {
        "url": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80",
        "author": "Sravan Kumar",
        "author_uri": "https://unsplash.com/@sravankumar",
    },
    "nature_outdoors": {
        "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        "author": "Sean Oulashin",
        "author_uri": "https://unsplash.com/@oulashin",
    },
    "food_drink": {
        "url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        "author": "Jason Leung",
        "author_uri": "https://unsplash.com/@ninjason",
    },
    "shopping_entertainment": {
        "url": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80",
        "author": "Aleksandar Pasaric",
        "author_uri": "https://unsplash.com/@pasaric",
    },
    "leisure_practical": {
        "url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
        "author": "Ant Rozetsky",
        "author_uri": "https://unsplash.com/@rozetsky",
    },
}


class MockPlacesService(PlacesProvider):
    """
    Deterministic development and test provider.
    Uses independently sourced, curated seed place data with explicit provenance.
    Supports multi-page pagination simulation and authentic photo attributions.
    """

    def __init__(self):
        self._places = self._load_data()

    def _load_data(self) -> List[Dict[str, Any]]:
        if not DATA_FILE.exists():
            logger.warning(f"Seed places file not found: {DATA_FILE}")
            return []
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_status(self) -> ProviderStatus:
        return ProviderStatus(
            provider_name="WanderGraph Development Mock Provider",
            is_live=False,
            api_key_configured=False,
            status_message="Running in Development Mode with curated local seed dataset. (Set GOOGLE_MAPS_API_KEY to activate live Google Places API New).",
        )

    def _get_mock_photos(self, place: Dict[str, Any]) -> List[PlacePhoto]:
        cat = place.get("category", "attractions_culture")
        photo_info = CATEGORY_FALLBACK_PHOTOS.get(cat, CATEGORY_FALLBACK_PHOTOS["attractions_culture"])
        return [
            PlacePhoto(
                name=f"mock_photos/{place['id']}_1",
                width_px=800,
                height_px=600,
                attributions=[
                    PhotoAttribution(
                        display_name=photo_info["author"],
                        uri=photo_info["author_uri"],
                    )
                ],
                proxy_url=photo_info["url"],
            )
        ]

    async def search_places(
        self,
        query: str,
        city: str,
        limit: int = 12,
        category: Optional[str] = None,
        page_token: Optional[str] = None,
        locality: Optional[str] = None,
    ) -> SearchPageResult:
        city_lower = city.lower().strip()
        query_lower = query.lower().strip()

        matched: List[PlaceSearchResult] = []
        for p in self._places:
            if p.get("city", "").lower() != city_lower:
                continue

            # Check category match if provided
            if category and category.lower() not in p.get("category", "").lower():
                continue

            # Check locality match if provided
            if locality:
                p_loc = (p.get("neighborhood") or "").lower()
                p_addr = (p.get("address") or "").lower()
                p_name = p.get("name", "").lower()
                loc_lower = locality.lower()
                if loc_lower not in p_loc and loc_lower not in p_addr and loc_lower not in p_name:
                    # Non-locality places filtered or placed behind
                    continue

            # Query matching: extract meaningful keywords excluding conversational stop words
            STOP_WORDS = {
                "all", "places", "place", "best", "top", "popular", "show", "me",
                "the", "in", "for", "with", "my", "to", "go", "somewhere", "find",
                "good", "a", "an", "of", "and", "under", "or", "around", "looking", "actually",
                "hyderabad", "bengaluru", "tokyo", "kyoto"
            }
            words = [w for w in re.findall(r"\w+", query_lower) if w not in STOP_WORDS and len(w) > 2]

            if words:
                searchable_text = " ".join([
                    p.get("name", ""),
                    p.get("category", ""),
                    p.get("primary_type", ""),
                    p.get("neighborhood", ""),
                    " ".join(p.get("companion_suitability", [])),
                    " ".join(p.get("interests", [])),
                    " ".join(p.get("atmosphere", [])),
                    " ".join(p.get("activities", [])),
                    p.get("city", ""),
                ]).lower()

                if not any(kw in searchable_text for kw in words):
                    continue

            coords = None
            if "coordinates" in p:
                coords = Coordinates(
                    latitude=p["coordinates"]["latitude"],
                    longitude=p["coordinates"]["longitude"],
                )

            # Leave photos empty so image_service enriches with real Wikimedia Commons photos
            photos: List[PlacePhoto] = []
            photo_ref = None

            # Price estimate
            price_est = PriceService.estimate_price(
                place_name=p["name"],
                city=p["city"],
                price_level=p.get("price_level"),
                approx_cost=p.get("approx_cost"),
                types=[p.get("category", ""), p.get("primary_type", "")],
            )

            matched.append(
                PlaceSearchResult(
                    id=p["id"],
                    name=p["name"],
                    city=p["city"],
                    locality=p.get("neighborhood"),
                    formatted_address=p.get("address"),
                    coordinates=coords,
                    primary_type=p.get("primary_type"),
                    types=[p.get("category", ""), p.get("primary_type", "")],
                    rating=p.get("rating"),
                    user_ratings_total=p.get("user_ratings_total"),
                    price_level=p.get("price_level"),
                    approx_cost=p.get("approx_cost"),
                    currency=p.get("currency") or price_est.currency,
                    price_estimate=price_est,
                    opening_hours_text=p.get("opening_hours_text"),
                    is_open_now=True,
                    photos=photos,
                    photo_reference=photo_ref,
                    provenance=p.get("provenance", {}),
                )
            )

        # Pagination simulation
        offset = 0
        if page_token and page_token.startswith("mock_page_"):
            try:
                offset = int(page_token.replace("mock_page_", ""))
            except ValueError:
                offset = 0

        paged_items = matched[offset : offset + limit]
        next_offset = offset + limit
        next_page_token = f"mock_page_{next_offset}" if next_offset < len(matched) else None

        return SearchPageResult(places=paged_items, next_page_token=next_page_token)

    async def get_place_details(self, place_id: str) -> Optional[PlaceDetailResult]:
        for p in self._places:
            if p["id"] == place_id or f"gplaces:{p['id']}" == place_id:
                coords = None
                if "coordinates" in p:
                    coords = Coordinates(
                        latitude=p["coordinates"]["latitude"],
                        longitude=p["coordinates"]["longitude"],
                    )
                photos = self._get_mock_photos(p)
                price_est = PriceService.estimate_price(
                    place_name=p["name"],
                    city=p["city"],
                    price_level=p.get("price_level"),
                    approx_cost=p.get("approx_cost"),
                    types=[p.get("category", ""), p.get("primary_type", "")],
                )
                return PlaceDetailResult(
                    id=p["id"],
                    name=p["name"],
                    city=p["city"],
                    locality=p.get("neighborhood"),
                    formatted_address=p.get("address"),
                    coordinates=coords,
                    types=[p.get("category", ""), p.get("primary_type", "")],
                    rating=p.get("rating"),
                    user_ratings_total=p.get("user_ratings_total"),
                    price_level=p.get("price_level"),
                    approx_cost=p.get("approx_cost"),
                    currency=p.get("currency") or price_est.currency,
                    price_estimate=price_est,
                    opening_hours_text=p.get("opening_hours_text"),
                    website_uri=f"https://www.google.com/maps/search/?api=1&query={p['name'].replace(' ', '+')}+{p['city'].capitalize()}",
                    editorial_summary=f"{p['name']} is a celebrated landmark in {p['city'].capitalize()} known for its {', '.join(p.get('atmosphere', []))} atmosphere.",
                    photos=photos,
                    provenance=p.get("provenance", {}),
                )
        return None
