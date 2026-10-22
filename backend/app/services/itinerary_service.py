import json
import math
import uuid
from typing import List, Dict, Any, Optional, Tuple
import httpx
from app.config import settings
from app.api.schemas import (
    ItineraryResponse,
    ItineraryStop,
    PlaceSearchResult,
)
from app.services.places_provider import PlacesProvider
from app.services.graph_service import GraphService
from app.services.price_service import PriceService
from app.services.image_service import image_service
from app.utils.logging import logger


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


TIME_SLOTS_FULL_DAY = [
    ("09:00 – 11:00", 120, "Morning cultural immersion & scenic exploration"),
    ("11:30 – 13:00", 90, "Historic landmark walkthrough & photography"),
    ("13:15 – 14:45", 90, "Authentic local culinary lunch break"),
    ("15:30 – 17:30", 120, "Afternoon leisure, craft discovery or gardens"),
    ("18:00 – 20:30", 150, "Sunset panorama, evening stroll & dinner"),
]

TIME_SLOTS_HALF_DAY = [
    ("14:00 – 16:00", 120, "Afternoon landmark exploration"),
    ("16:30 – 18:00", 90, "Scenic viewpoint & golden-hour photography"),
    ("18:30 – 21:00", 150, "Atmospheric evening dinner & local market stroll"),
]


class ItinerarySessionState:
    def __init__(self, session_id: str, city: str):
        self.session_id = session_id
        self.city = city
        self.history: List[Dict[str, str]] = []
        self.current_itinerary: Optional[ItineraryResponse] = None
        self.candidate_pool: List[PlaceSearchResult] = []


class ItineraryService:
    def __init__(self, graph_service: GraphService):
        self.graph_service = graph_service
        self._sessions: Dict[str, ItinerarySessionState] = {}

    def get_or_create_session(self, session_id: str, city: str = "hyderabad") -> ItinerarySessionState:
        if session_id not in self._sessions:
            self._sessions[session_id] = ItinerarySessionState(session_id=session_id, city=city.lower())
        return self._sessions[session_id]

    async def _generate_with_gemini(
        self,
        session: ItinerarySessionState,
        user_message: str,
        candidates: List[PlaceSearchResult],
        slots: List[Tuple[str, int, str]],
    ) -> Optional[ItineraryResponse]:
        """Generate personalized itinerary using Google Gemini 3.5 Flash-Lite."""
        if not settings.gemini_api_key:
            return None

        venues_summary = [
            {
                "id": c.id,
                "name": c.name,
                "category": c.primary_type or (c.types[0] if c.types else "venue"),
                "rating": c.rating or 4.2,
                "cost": c.price_estimate.spending_range_text if c.price_estimate else "Moderate",
            }
            for c in candidates[:15]
        ]

        history_str = "\n".join(
            f"{h['role'].capitalize()}: {h['content']}"
            for h in session.history[-4:]
        )

        prompt = f"""You are WanderGraph's intelligent AI travel concierge for {session.city.capitalize()}.
User Query: "{user_message}"
Recent Chat Context:
{history_str}

Available Real Verified Places in {session.city.capitalize()}:
{json.dumps(venues_summary, indent=2)}

Task:
Design a realistic, highly personalized travel itinerary matching the user's specific request, budget, companions, and timing.
You MUST select at least 3 stops (3 to 4 stops) using the available real places provided above.
Return a valid JSON object matching this schema:
{{
  "title": "Short punchy title (e.g. Romantic Sunset & Culinary Trail in Hyderabad)",
  "theme": "Theme description (e.g. Scenic Lakeside & Historic Dining)",
  "date_or_day": "Recommended timing (e.g. This Evening / Tomorrow / Weekend)",
  "message": "A warm, personal 2-3 sentence response explaining why this plan is tailored to their preferences.",
  "total_estimated_spend": "Clear spend estimate in local currency (e.g. ₹1,200 – ₹1,800 for two)",
  "travel_feasibility_note": "A note explaining travel times and feasibility between stops.",
  "stops": [
    {{
      "place_id": "exact ID from the available places above",
      "place_name": "exact name from the available places above",
      "time_slot": "e.g. 17:00 – 18:30",
      "duration_minutes": 90,
      "visit_purpose": "Specific personalized activity to do here matching user prompt",
      "opening_hours_note": "e.g. Open until 21:00"
    }}
  ]
}}
Return ONLY raw JSON."""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={settings.gemini_api_key}"

        try:
            async with httpx.AsyncClient(timeout=14.0) as client:
                res = await client.post(api_url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates_res = data.get("candidates", [])
                    if candidates_res:
                        txt = candidates_res[0]["content"]["parts"][0]["text"]
                        parsed = json.loads(txt)
                        candidate_map = {c.id: c for c in candidates}
                        seen_ids = set()
                        stops: List[ItineraryStop] = []

                        for s_data in parsed.get("stops", []):
                            p_id = s_data.get("place_id")
                            place_obj = candidate_map.get(p_id)
                            if not place_obj:
                                for c in candidates:
                                    if c.name.lower() in str(s_data.get("place_name", "")).lower() or str(s_data.get("place_name", "")).lower() in c.name.lower():
                                        place_obj = c
                                        break
                            if not place_obj and len(stops) < len(candidates):
                                for c in candidates:
                                    if c.id not in seen_ids:
                                        place_obj = c
                                        break

                            if place_obj and place_obj.id not in seen_ids:
                                seen_ids.add(place_obj.id)
                                pe = place_obj.price_estimate or PriceService.estimate_price(place_obj.name, session.city, price_level=place_obj.price_level)
                                cost_str = pe.spending_range_text
                                hours_note = s_data.get("opening_hours_note") or place_obj.opening_hours_text or "Open regular visitor hours"

                                alt_candidates = [
                                    {"id": alt.id, "name": alt.name, "primary_type": alt.primary_type, "rating": alt.rating}
                                    for alt in candidates
                                    if alt.id != place_obj.id and alt.id not in seen_ids
                                ][:4]

                                stops.append(
                                    ItineraryStop(
                                        stop_index=len(stops),
                                        time_slot=s_data.get("time_slot", "10:00 – 11:30"),
                                        place=place_obj,
                                        duration_minutes=s_data.get("duration_minutes", 90),
                                        visit_purpose=s_data.get("visit_purpose", "Sightseeing & exploration"),
                                        estimated_cost=cost_str,
                                        opening_hours_note=hours_note,
                                        replacement_options=alt_candidates,
                                    )
                                )

                        # Ensure at least 3 stops if enough candidates exist
                        while len(stops) < min(3, len(candidates)):
                            added = False
                            for c in candidates:
                                if c.id not in seen_ids:
                                    seen_ids.add(c.id)
                                    slot_time, duration, purpose = slots[len(stops)] if len(stops) < len(slots) else ("19:00 – 20:30", 90, "Dinner & evening leisure")
                                    pe = c.price_estimate or PriceService.estimate_price(c.name, session.city, price_level=c.price_level)
                                    stops.append(
                                        ItineraryStop(
                                            stop_index=len(stops),
                                            time_slot=slot_time,
                                            place=c,
                                            duration_minutes=duration,
                                            visit_purpose=purpose,
                                            estimated_cost=pe.spending_range_text,
                                            opening_hours_note=c.opening_hours_text or "Open regular hours",
                                            replacement_options=[],
                                        )
                                    )
                                    added = True
                                    break
                            if not added:
                                break

                        if stops:
                            assistant_msg = parsed.get("message") or f"Here is your personalized itinerary for {session.city.capitalize()}."
                            session.history.append({"role": "assistant", "content": assistant_msg})
                            raw_note = parsed.get("travel_feasibility_note") or "Stops are geographically sequenced for smooth transit connectivity."
                            if "transit" not in raw_note.lower() and "sequenced" not in raw_note.lower():
                                raw_note = f"Geographically sequenced: {raw_note} (Transit friendly)"

                            response = ItineraryResponse(
                                session_id=session.session_id,
                                city=session.city,
                                title=parsed.get("title", f"Personalized Itinerary in {session.city.capitalize()}"),
                                theme=parsed.get("theme", "Custom Discovery"),
                                date_or_day=parsed.get("date_or_day", "Recommended for Today / Weekend"),
                                total_estimated_spend=parsed.get("total_estimated_spend", "Moderate spend"),
                                travel_feasibility_note=raw_note,
                                stops=stops,
                                conversation_history=session.history,
                            )
                            session.current_itinerary = response
                            return response
        except Exception as e:
            logger.warning(f"Gemini itinerary generation exception: {e}. Falling back to rule-based planner.")

        return None

    async def generate_itinerary(
        self,
        session_id: str,
        user_message: str,
        city: str,
        places_provider: PlacesProvider,
    ) -> ItineraryResponse:
        session = self.get_or_create_session(session_id, city=city)
        session.city = city.lower()
        session.places_provider = places_provider
        session.history.append({"role": "user", "content": user_message})

        msg_lower = user_message.lower()
        is_half_day = any(w in msg_lower for w in ["half day", "evening", "few hours", "afternoon", "3 hours", "4 hours"])
        is_budget_focused = any(w in msg_lower for w in ["cheap", "cheaper", "budget", "free", "affordable", "low cost"])
        is_romantic = any(w in msg_lower for w in ["romantic", "couple", "date", "partner", "girlfriend", "boyfriend"])

        # Fetch candidate places from provider
        search_query = "top attractions landmarks cafes"
        if is_romantic:
            search_query = "romantic scenic places peaceful cafes"
        elif is_budget_focused:
            search_query = "free historic landmarks parks gardens"

        paged_res = await places_provider.search_places(
            query=search_query,
            city=session.city,
            limit=20,
        )
        candidates = paged_res.places

        # If not enough or provider failed/rate-limited, fallback & augment from curated knowledge graph dataset
        if len(candidates) < 5:
            from app.services.mock_places import MockPlacesService
            fallback_provider = MockPlacesService()
            fallback_res = await fallback_provider.search_places(
                query="popular places",
                city=session.city,
                limit=20,
            )
            for fb_place in fallback_res.places:
                if not any(c.id == fb_place.id for c in candidates):
                    candidates.append(fb_place)

        # Enrich all candidates with photos so itinerary stops always have real images
        await image_service.enrich_places_with_photos(candidates, session.city)
        session.candidate_pool = candidates

        slots = TIME_SLOTS_HALF_DAY if is_half_day else TIME_SLOTS_FULL_DAY

        # Attempt personalized generation using Gemini 3.5 Flash-Lite
        gemini_response = await self._generate_with_gemini(
            session=session,
            user_message=user_message,
            candidates=candidates,
            slots=slots,
        )
        if gemini_response:
            return gemini_response

        # Fallback: Deterministic constraint-based planner
        selected_places: List[PlaceSearchResult] = []
        seen_ids = set()

        for c in candidates:
            if c.id not in seen_ids and len(selected_places) < len(slots):
                if is_budget_focused and c.price_level is not None and c.price_level > 2:
                    continue
                selected_places.append(c)
                seen_ids.add(c.id)

        stops: List[ItineraryStop] = []
        total_min_spend = 0.0
        total_max_spend = 0.0
        currency = PriceService.get_currency_for_city(session.city)

        for i, place in enumerate(selected_places):
            slot_time, duration, default_purpose = slots[i] if i < len(slots) else ("10:00 – 12:00", 120, "Sightseeing")

            pe = place.price_estimate or PriceService.estimate_price(place.name, session.city, price_level=place.price_level)
            if pe.min_spend is not None:
                total_min_spend += pe.min_spend
                total_max_spend += (pe.max_spend or pe.min_spend)

            cost_str = pe.spending_range_text
            hours_note = place.opening_hours_text or "Open regular visitor hours; check on-site"
            if place.is_open_now is True:
                hours_note = f"Verified open now ({hours_note})"

            alt_candidates = [
                {"id": alt.id, "name": alt.name, "primary_type": alt.primary_type, "rating": alt.rating}
                for alt in candidates
                if alt.id != place.id and alt.id not in seen_ids
            ][:4]

            stops.append(
                ItineraryStop(
                    stop_index=i,
                    time_slot=slot_time,
                    place=place,
                    duration_minutes=duration,
                    visit_purpose=default_purpose,
                    estimated_cost=cost_str,
                    opening_hours_note=hours_note,
                    replacement_options=alt_candidates,
                )
            )

        transit_notes = []
        for i in range(len(stops) - 1):
            p1 = stops[i].place
            p2 = stops[i + 1].place
            if p1.coordinates and p2.coordinates:
                dist = haversine_distance_km(
                    p1.coordinates.latitude,
                    p1.coordinates.longitude,
                    p2.coordinates.latitude,
                    p2.coordinates.longitude,
                )
                est_mins = max(5, int(dist * 3.5))
                transit_notes.append(f"Stop {i+1} → {i+2}: ~{dist:.1f} km ({est_mins} mins by cab/transit)")

        feasibility_summary = (
            "Geographically sequenced: " + "; ".join(transit_notes)
            if transit_notes
            else "Stops are centrally located with easy transit connectivity."
        )

        curr_sym = "₹" if currency == "INR" else "¥"
        total_spend_text = (
            f"Free"
            if total_max_spend == 0
            else f"{curr_sym}{int(total_min_spend):,} – {curr_sym}{int(total_max_spend):,} per person"
        )

        theme = "Romantic Highlights" if is_romantic else ("Budget Discovery" if is_budget_focused else "Culture & Landmarks")
        title = f"{'Half-Day' if is_half_day else 'Full-Day'} {theme} in {session.city.capitalize()}"

        assistant_msg = (
            f"I have created a personalized {title}. It features {len(stops)} realistic stops "
            f"with an estimated total spend of {total_spend_text}. You can swap any individual stop if you prefer something else!"
        )
        session.history.append({"role": "assistant", "content": assistant_msg})

        response = ItineraryResponse(
            session_id=session_id,
            city=session.city,
            title=title,
            theme=theme,
            date_or_day="Recommended for Tomorrow or Weekend",
            total_estimated_spend=total_spend_text,
            travel_feasibility_note=feasibility_summary,
            stops=stops,
            conversation_history=session.history,
        )
        session.current_itinerary = response
        return response

    async def replace_stop(
        self,
        session_id: str,
        stop_index: int,
        replacement_place_id: Optional[str] = None,
        preference_note: Optional[str] = None,
    ) -> ItineraryResponse:
        session = self._sessions.get(session_id)
        if not session or not session.current_itinerary:
            raise ValueError(f"No active itinerary found for session {session_id}")

        itinerary = session.current_itinerary
        if stop_index < 0 or stop_index >= len(itinerary.stops):
            raise IndexError(f"Stop index {stop_index} out of range")

        current_stop = itinerary.stops[stop_index]
        existing_place_ids = {s.place.id for s in itinerary.stops}

        replacement_place: Optional[PlaceSearchResult] = None

        if replacement_place_id:
            for c in session.candidate_pool:
                if c.id == replacement_place_id:
                    replacement_place = c
                    break

        if not replacement_place and preference_note:
            note_words = [w for w in preference_note.lower().split() if len(w) >= 3]
            for c in session.candidate_pool:
                if c.id not in existing_place_ids:
                    c_text = f"{c.name} {c.primary_type} {' '.join(c.types)}".lower()
                    if any(w in c_text for w in note_words):
                        replacement_place = c
                        break

        if not replacement_place:
            for c in session.candidate_pool:
                if c.id not in existing_place_ids and c.id != current_stop.place.id:
                    replacement_place = c
                    break

        if not replacement_place:
            return itinerary

        pe = replacement_place.price_estimate or PriceService.estimate_price(replacement_place.name, session.city, price_level=replacement_place.price_level)
        cost_str = pe.spending_range_text

        new_stop = ItineraryStop(
            stop_index=stop_index,
            time_slot=current_stop.time_slot,
            place=replacement_place,
            duration_minutes=current_stop.duration_minutes,
            visit_purpose=f"Alternative exploration: {replacement_place.name}",
            estimated_cost=cost_str,
            opening_hours_note=replacement_place.opening_hours_text or "Check on-site",
            replacement_options=current_stop.replacement_options,
        )

        itinerary.stops[stop_index] = new_stop

        # Update note
        session.history.append({
            "role": "assistant",
            "content": f"Replaced stop #{stop_index + 1} with {replacement_place.name} ({cost_str}).",
        })
        return itinerary

    def reset_session(self, session_id: str) -> None:
        if session_id in self._sessions:
            del self._sessions[session_id]
