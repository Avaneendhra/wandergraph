import re
import uuid
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
from app.utils.logging import logger


CITY_SYNONYMS: Dict[str, str] = {
    "hydrabad": "hyderabad",
    "hyderbad": "hyderabad",
    "hyd": "hyderabad",
    "secunderabad": "hyderabad",
    "bangalore": "bengaluru",
    "bengalore": "bengaluru",
    "bangaluru": "bengaluru",
    "blr": "bengaluru",
    "tokio": "tokyo",
    "kioto": "kyoto",
    "kyto": "kyoto",
}

COMMON_WORDS = {
    "to", "too", "in", "at", "on", "and", "for", "with", "the", "a", "an", "of",
    "by", "or", "so", "as", "go", "me", "my", "we", "he", "it", "not", "out",
    "all", "any", "few", "day", "see", "get", "top", "now", "off", "up", "very"
}

CITY_LOCALITIES: Dict[str, List[str]] = {
    "hyderabad": [
        "uppal", "banjara hills", "jubilee hills", "hitec city", "gachibowli", "charminar",
        "begumpet", "secunderabad", "kondapur", "madhapur", "manikonda", "kukatpally",
        "mehdipatnam", "dilsukhnagar", "ameerpet", "abids", "tank bund", "somajiguda",
        "himayatnagar", "nampally", "koti", "tolichowki", "lingampally", "miyapur",
        "tarnaka", "habsiguda", "malkajgiri", "alwal", "shamshabad",
    ],
    "bengaluru": [
        "indiranagar", "koramangala", "whitefield", "hsr layout", "jayanagar", "jp nagar",
        "malleshwaram", "mg road", "church street", "electronic city", "ulsoor",
        "basavanagudi", "marathahalli", "bellandur", "hebbal", "sadashivanagar",
        "frazer town", "rajajinagar", "banashankari", "btm layout", "kammanahalli",
    ],
    "tokyo": [
        "shibuya", "shinjuku", "ginza", "asakusa", "roppongi", "akihabara", "harajuku",
        "ueno", "odaiba", "ikebukuro", "nakameguro", "shimokitazawa", "yanaka",
        "omotesando", "marunouchi", "tsukiji", "toyosu", "kichijoji", "daikanyama",
        "ebisu", "meguro", "shinagawa", "kanda",
    ],
    "kyoto": [
        "gion", "arashiyama", "higashiyama", "fushimi", "pontocho", "kawaramachi",
        "kita", "sakyo", "kamigyo", "shimogyo", "ujis", "sagano", "kinkakuji", "kiyomizu",
    ],
}

CATEGORY_SYNONYMS: Dict[str, List[str]] = {
    "cafe": ["coffee", "cfe", "cafes", "espresso", "latte", "cappuccino", "bakery", "tea house", "cafe"],
    "bar_nightlife": ["beer", "pub", "bar", "brewery", "craft beer", "cocktails", "nightlife", "club"],
    "restaurant": ["dinner", "lunch", "food", "eat", "restaurant", "dining", "cuisine", "breakfast", "biryani", "ramen", "sushi"],
    "culture_history": ["monument", "temple", "shrine", "historic", "heritage", "museum", "culture", "sightseeing", "palace", "fort", "castle"],
    "nature_outdoors": ["park", "garden", "lake", "nature", "walk", "greenery", "outdoors", "outdoor", "bamboo", "hills"],
    "shopping": ["shopping", "market", "bazaar", "mall", "souvenir", "crafts", "textiles"],
}

ATMOSPHERE_SYNONYMS: Dict[str, List[str]] = {
    "peaceful": ["peaceful", "quiet", "calm", "serene", "tranquil", "not too crowded", "peace", "relaxing", "zen"],
    "romantic": ["romantic", "intimate", "candlelight", "cozy", "date", "sunset view"],
    "lively": ["lively", "vibrant", "energetic", "buzzing", "busy", "crowded", "happening"],
    "scenic": ["scenic", "view", "panoramic", "skyline", "lake view", "landscape", "vista"],
    "spiritual": ["spiritual", "sacred", "holy", "devotional", "temple", "shrine"],
    "cultural": ["cultural", "traditional", "ancient", "historical", "heritage"],
    "adventurous": ["adventurous", "thrill", "hiking", "trekking", "adventure"],
}


def levenshtein_distance(s1: str, s2: str) -> int:
    """Compute standard Levenshtein edit distance."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def fuzzy_match_token(token: str, candidates: List[str], max_dist: int = 2) -> Optional[str]:
    """Find candidate with minimum edit distance <= max_dist."""
    best_candidate = None
    best_dist = max_dist + 1
    for candidate in candidates:
        # Exact match or substring
        if token == candidate:
            return candidate
        dist = levenshtein_distance(token, candidate)
        threshold = 1 if len(candidate) <= 4 else max_dist
        if dist <= threshold and dist < best_dist:
            best_dist = dist
            best_candidate = candidate
    return best_candidate

class InterpretedCriteria(BaseModel):
    original_query: Optional[str] = None
    corrected_query: Optional[str] = None
    detected_city: Optional[str] = None
    detected_locality: Optional[str] = None
    detected_category: Optional[str] = None
    detected_atmospheres: List[str] = Field(default_factory=list)
    detected_companion: Optional[str] = None
    detected_budget: Optional[float] = None
    was_corrected: bool = False
    explanation_banner: Optional[str] = None


class PreferenceState(BaseModel):
    session_id: str
    city: str = "hyderabad"
    locality: Optional[str] = None
    budget_max: Optional[float] = None
    currency: str = "INR"
    companion_type: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    desired_activities: List[str] = Field(default_factory=list)
    atmosphere: List[str] = Field(default_factory=list)
    indoor_outdoor: Optional[str] = None
    preferred_time: Optional[str] = None
    accessibility_requirements: List[str] = Field(default_factory=list)
    crowd_preference: Optional[str] = None
    search_query: Optional[str] = None
    interpreted_criteria: Optional[InterpretedCriteria] = None


class PreferenceService:
    def __init__(self):
        self._sessions: Dict[str, PreferenceState] = {}

    def get_or_create_session(
        self,
        session_id: Optional[str] = None,
        initial_city: str = "hyderabad",
    ) -> PreferenceState:
        if not session_id or session_id not in self._sessions:
            new_id = session_id or str(uuid.uuid4())
            curr = "INR" if initial_city.lower() in ["hyderabad", "bengaluru"] else "JPY"
            state = PreferenceState(session_id=new_id, city=initial_city.lower(), currency=curr)
            self._sessions[new_id] = state
            return state
        return self._sessions[session_id]

    def reset_session(self, session_id: str) -> PreferenceState:
        city = "hyderabad"
        if session_id in self._sessions:
            city = self._sessions[session_id].city
        curr = "INR" if city in ["hyderabad", "bengaluru"] else "JPY"
        state = PreferenceState(session_id=session_id, city=city, currency=curr)
        self._sessions[session_id] = state
        return state

    def remove_field(self, session_id: str, field_name: str) -> PreferenceState:
        state = self.get_or_create_session(session_id)
        if hasattr(state, field_name):
            field_val = getattr(state, field_name)
            if isinstance(field_val, list):
                setattr(state, field_name, [])
            else:
                setattr(state, field_name, None)
        return state

    def parse_text_query(self, text: str, current_city: Optional[str] = None) -> Tuple[Dict[str, Any], InterpretedCriteria]:
        """
        Layered intelligent search pipeline:
        1. Normalization & word-level tokenization.
        2. Spelling correction / fuzzy matching for city & locality.
        3. Synonyms for categories, activities & atmospheres.
        4. Companion & budget constraint extraction.
        5. Generates structured InterpretedCriteria.
        """
        updates: Dict[str, Any] = {}
        text_lower = text.lower().strip()
        tokens = re.findall(r"\b[a-z0-9_-]+\b", text_lower)

        detected_city: Optional[str] = None
        detected_locality: Optional[str] = None
        detected_category: Optional[str] = None
        detected_atmospheres: List[str] = []
        detected_companion: Optional[str] = None
        detected_budget: Optional[float] = None
        was_corrected = False

        # 1. City extraction (exact, synonym, and fuzzy)
        canonical_cities = ["hyderabad", "bengaluru", "tokyo", "kyoto"]
        for c in canonical_cities:
            if c in text_lower:
                detected_city = c
                break

        if not detected_city:
            for token in tokens:
                if token in CITY_SYNONYMS:
                    detected_city = CITY_SYNONYMS[token]
                    was_corrected = True
                    break
                if token not in COMMON_WORDS and len(token) >= 4:
                    fuzzy_city = fuzzy_match_token(token, canonical_cities, max_dist=2)
                    if fuzzy_city:
                        detected_city = fuzzy_city
                        was_corrected = True
                        break

        active_city = detected_city or current_city or "hyderabad"
        if detected_city:
            updates["city"] = detected_city
            updates["currency"] = "INR" if detected_city in ["hyderabad", "bengaluru"] else "JPY"

        # 2. Locality extraction (look in active city's known localities, plus multi-city check)
        city_localities = CITY_LOCALITIES.get(active_city, [])
        # Check multi-word localities first
        for loc in city_localities:
            if loc in text_lower:
                detected_locality = loc.title()
                break

        # If not found directly, try fuzzy token / bigram match
        if not detected_locality:
            # Check bigrams for two-word localities (e.g. "banjara hills", "hsr layout")
            bigrams = [" ".join(tokens[i:i+2]) for i in range(len(tokens) - 1)]
            for bigram in bigrams:
                match = fuzzy_match_token(bigram, city_localities, max_dist=2)
                if match:
                    detected_locality = match.title()
                    was_corrected = True
                    break

            if not detected_locality:
                for token in tokens:
                    if len(token) >= 4:
                        match = fuzzy_match_token(token, city_localities, max_dist=2)
                        if match:
                            detected_locality = match.title()
                            was_corrected = True
                            break

        # If locality found in another city and no explicit city given, switch city!
        if not detected_locality and not detected_city:
            for other_city, other_locs in CITY_LOCALITIES.items():
                for loc in other_locs:
                    if loc in text_lower:
                        detected_locality = loc.title()
                        detected_city = other_city
                        updates["city"] = other_city
                        updates["currency"] = "INR" if other_city in ["hyderabad", "bengaluru"] else "JPY"
                        break
                if detected_locality:
                    break

        if detected_locality:
            updates["locality"] = detected_locality

        # 3. Companion extraction
        if any(w in text_lower for w in ["girlfriend", "boyfriend", "partner", "wife", "husband", "couples", "couple", "date", "romantic"]):
            detected_companion = "couples"
        elif any(w in text_lower for w in ["family", "parents", "kids", "children", "relatives"]):
            detected_companion = "family"
        elif any(w in text_lower for w in ["friends", "buddies", "gang", "group", "colleagues"]):
            detected_companion = "friends"
        elif any(w in text_lower for w in ["solo", "alone", "myself", "single"]):
            detected_companion = "solo"
        elif "business" in text_lower:
            detected_companion = "business"

        if detected_companion:
            updates["companion_type"] = detected_companion

        # 4. Category & Activity extraction via Synonyms
        for cat_key, syn_list in CATEGORY_SYNONYMS.items():
            for syn in syn_list:
                if syn in text_lower or fuzzy_match_token(syn, tokens, max_dist=1):
                    detected_category = cat_key
                    if cat_key not in updates.get("interests", []):
                        updates.setdefault("interests", []).append(cat_key)
                    break
            if detected_category:
                break

        # 5. Atmosphere extraction
        for atm_key, syn_list in ATMOSPHERE_SYNONYMS.items():
            for syn in syn_list:
                if syn in text_lower:
                    detected_atmospheres.append(atm_key)
                    break

        if detected_atmospheres:
            updates["atmosphere"] = list(dict.fromkeys(detected_atmospheres))

        # 6. Preferred time of day
        if "morning" in text_lower or "sunrise" in text_lower:
            updates["preferred_time"] = "morning"
        elif "afternoon" in text_lower or "lunch" in text_lower:
            updates["preferred_time"] = "afternoon"
        elif "evening" in text_lower or "sunset" in text_lower:
            updates["preferred_time"] = "evening"
        elif "night" in text_lower or "late night" in text_lower:
            updates["preferred_time"] = "night"

        # 7. Budget extraction
        if "free" in text_lower or "zero cost" in text_lower:
            detected_budget = 0.0
            updates["budget_max"] = 0.0
        else:
            budget_match = re.search(
                r"(?:under|below|within|budget of|<|less than)\s*[₹¥$]?\s*([0-9]+(?:,[0-9]+)*)",
                text_lower,
            )
            if budget_match:
                amount_str = budget_match.group(1).replace(",", "")
                try:
                    detected_budget = float(amount_str)
                    updates["budget_max"] = detected_budget
                except ValueError:
                    pass

        # 8. Indoor / Outdoor
        if any(w in text_lower for w in ["outdoor", "outside", "open air", "alfresco"]):
            updates["indoor_outdoor"] = "outdoor"
        elif any(w in text_lower for w in ["indoor", "inside"]):
            updates["indoor_outdoor"] = "indoor"

        # 9. Accessibility
        if "wheelchair" in text_lower or "accessible" in text_lower:
            updates["accessibility_requirements"] = ["wheelchair_accessible"]

        # Build human-readable banner summary
        banner_parts = []
        if detected_category:
            cat_display = detected_category.replace("_", " ").title()
            banner_parts.append(f"**{cat_display}**")
        if detected_locality:
            banner_parts.append(f"in **{detected_locality}**")
        if detected_city:
            banner_parts.append(f"({detected_city.title()})")
        if detected_atmospheres:
            banner_parts.append(f"• Atmosphere: {', '.join(detected_atmospheres).title()}")
        if detected_companion:
            banner_parts.append(f"• Ideal for {detected_companion.title()}")
        if detected_budget is not None:
            curr_sym = "₹" if active_city in ["hyderabad", "bengaluru"] else "¥"
            banner_parts.append(f"• Budget: {curr_sym}{int(detected_budget):,}")

        explanation_banner = "Interpreted as: " + " ".join(banner_parts) if banner_parts else None

        interpreted = InterpretedCriteria(
            original_query=text,
            corrected_query=text,
            detected_city=detected_city,
            detected_locality=detected_locality,
            detected_category=detected_category,
            detected_atmospheres=detected_atmospheres,
            detected_companion=detected_companion,
            detected_budget=detected_budget,
            was_corrected=was_corrected,
            explanation_banner=explanation_banner,
        )

        return updates, interpreted

    def update_preferences(
        self,
        session_id: str,
        user_message: Optional[str] = None,
        direct_updates: Optional[Dict[str, Any]] = None,
    ) -> PreferenceState:
        state = self.get_or_create_session(session_id)
        interpreted: Optional[InterpretedCriteria] = None

        # 1. Parse free-text if provided
        if user_message:
            parsed, interpreted = self.parse_text_query(user_message, current_city=state.city)
            for k, v in parsed.items():
                if isinstance(v, list) and hasattr(state, k):
                    current_list = getattr(state, k)
                    combined = list(dict.fromkeys(current_list + v))
                    setattr(state, k, combined)
                elif hasattr(state, k):
                    setattr(state, k, v)
            state.search_query = user_message
            state.interpreted_criteria = interpreted

        # 2. Apply direct explicit overrides
        if direct_updates:
            for k, v in direct_updates.items():
                if hasattr(state, k) and v is not None:
                    setattr(state, k, v)

        # Update currency if city changed
        if state.city in ["hyderabad", "bengaluru"]:
            state.currency = "INR"
        elif state.city in ["tokyo", "kyoto"]:
            state.currency = "JPY"

        logger.info(
            f"Updated preferences for session {session_id}: city={state.city}, locality={state.locality}, companion={state.companion_type}, budget={state.budget_max}"
        )
        return state
