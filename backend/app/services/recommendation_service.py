from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.services.preference_service import PreferenceState
from app.services.places_provider import PlaceSearchResult
from app.services.graph_service import GraphService
from app.utils.logging import logger


class ScoredRecommendation(BaseModel):
    place: PlaceSearchResult
    total_score: float
    matched_reasons: List[str] = Field(default_factory=list)
    unverified_attributes: List[str] = Field(default_factory=list)
    explanation: str
    match_confidence: str  # "high", "moderate", "potential"


class RecommendationService:
    def __init__(self, graph_service: GraphService):
        self.graph_service = graph_service

    def rank_and_explain(
        self,
        candidates: Any,
        preferences: PreferenceState,
    ) -> List[ScoredRecommendation]:
        scored: List[ScoredRecommendation] = []
        candidate_list: List[PlaceSearchResult] = candidates.places if hasattr(candidates, "places") else list(candidates)

        for candidate in candidate_list:
            # 1. Hard constraint: City check
            if candidate.city.lower() != preferences.city.lower():
                continue

            # Graph attributes lookup
            place_attrs = self.graph_service.get_place_attributes(candidate.id)

            score = 0.0
            reasons: List[str] = []
            unverified: List[str] = []

            # Base rating score
            if candidate.rating:
                score += float(candidate.rating) * 1.2
            else:
                score += 3.5  # Neutral default for places without rating

            # 2. Locality alignment (High priority soft/hard constraint)
            if preferences.locality:
                loc_lower = preferences.locality.lower()
                cand_addr = (candidate.formatted_address or "").lower()
                cand_name = candidate.name.lower()
                cand_loc = (candidate.locality or "").lower()

                if loc_lower == cand_loc or loc_lower in cand_addr or loc_lower in cand_name:
                    score += 6.0
                    reasons.append(f"Located directly in {preferences.locality}")
                else:
                    # If user explicitly searched for a locality, de-prioritize non-locality venues
                    score -= 3.0

            # 3. Budget constraint check using PriceEstimate & graph data
            if preferences.budget_max is not None:
                budget = preferences.budget_max
                pe = candidate.price_estimate

                if budget == 0.0:
                    # Looking for Free places only
                    is_free = (
                        (pe and pe.is_free)
                        or candidate.approx_cost == 0.0
                        or candidate.price_level == 0
                    )
                    if is_free:
                        score += 4.0
                        reasons.append("Free admission / no-cost entry")
                    elif candidate.price_level is not None and candidate.price_level > 0:
                        continue  # Exclude paid places when looking for free
                    else:
                        unverified.append("Free entry unverified")
                else:
                    # Looking for places under numeric budget
                    est_min = pe.min_spend if (pe and pe.min_spend is not None) else candidate.approx_cost
                    if est_min is not None:
                        if est_min <= budget:
                            score += 3.0
                            reasons.append(f"Within budget ({preferences.currency} {int(est_min):,})")
                        else:
                            continue  # Exceeds budget -> filter out
                    elif candidate.price_level is not None:
                        # Price level heuristics
                        if candidate.price_level <= 2 or budget >= 2500:
                            score += 1.5
                            reasons.append("Price level consistent with budget")
                        else:
                            continue
                    else:
                        unverified.append("Price range unverified")

            # 4. Accessibility requirement
            if "wheelchair_accessible" in preferences.accessibility_requirements:
                has_wheelchair = place_attrs.get("accessibility", {}).get("wheelchair_accessible_entrance")
                if has_wheelchair is True:
                    score += 3.0
                    reasons.append("Wheelchair accessible entrance verified")
                elif has_wheelchair is False:
                    continue  # Strict hard constraint
                else:
                    unverified.append("Wheelchair accessibility unverified")

            # 5. Companion suitability (Soft preference)
            if preferences.companion_type:
                connected_companions = place_attrs.get("connected_companions", [])
                if preferences.companion_type.lower() in connected_companions:
                    score += 3.5
                    reasons.append(f"Ideal for {preferences.companion_type}")

            # 6. Atmosphere preference (Soft preference)
            if preferences.atmosphere:
                connected_atmospheres = place_attrs.get("connected_atmospheres", [])
                matched_atm = [
                    atm for atm in preferences.atmosphere
                    if atm.lower() in connected_atmospheres
                ]
                if matched_atm:
                    score += 2.5 * len(matched_atm)
                    reasons.append(f"{', '.join(matched_atm).capitalize()} atmosphere")

            # 7. Preferred time of day (Soft preference)
            if preferences.preferred_time:
                connected_times = place_attrs.get("connected_times_of_day", [])
                if preferences.preferred_time.lower() in connected_times:
                    score += 2.0
                    reasons.append(f"Great for {preferences.preferred_time} visits")

            # 8. Indoor / Outdoor preference
            if preferences.indoor_outdoor:
                place_in_out = place_attrs.get("indoor_outdoor")
                if place_in_out:
                    if preferences.indoor_outdoor in [place_in_out, "both"]:
                        score += 1.5
                        reasons.append(f"Matches {preferences.indoor_outdoor} setting")
                else:
                    unverified.append("Indoor/outdoor classification unverified")

            # 9. Confidence determination
            if len(reasons) >= 3 and not unverified:
                confidence = "high"
            elif len(reasons) >= 1:
                confidence = "moderate"
            else:
                confidence = "potential"

            # 10. Honest evidence explanation synthesis
            city_name = preferences.city.capitalize()
            reasons_str = "; ".join(reasons) if reasons else "matches general discovery criteria"
            explanation_parts = [f"Recommended in {city_name} because it {reasons_str.lower()}."]

            if unverified:
                explanation_parts.append(f"Notice: {', '.join(unverified)}.")

            full_explanation = " ".join(explanation_parts)

            scored.append(
                ScoredRecommendation(
                    place=candidate,
                    total_score=round(score, 2),
                    matched_reasons=reasons,
                    unverified_attributes=unverified,
                    explanation=full_explanation,
                    match_confidence=confidence,
                )
            )

        # Sort descending by total score
        scored.sort(key=lambda x: x.total_score, reverse=True)
        return scored
