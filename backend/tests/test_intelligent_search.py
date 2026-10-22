import pytest
from app.services.preference_service import PreferenceService


def test_typo_correction_city():
    service = PreferenceService()
    
    # "hydrabad" -> "hyderabad"
    updates, criteria = service.parse_text_query("top sights in hydrabad")
    assert updates.get("city") == "hyderabad"
    assert criteria.detected_city == "hyderabad"

    # "bangalore" -> "bengaluru"
    updates_blr, _ = service.parse_text_query("breweries in bangalore")
    assert updates_blr.get("city") == "bengaluru"

    # "kioto" -> "kyoto"
    updates_kyo, _ = service.parse_text_query("ancient temples in kioto")
    assert updates_kyo.get("city") == "kyoto"


def test_locality_extraction():
    service = PreferenceService()

    # Uppal in Hyderabad
    updates, criteria = service.parse_text_query("peaceful cafe in uppal", current_city="hyderabad")
    assert updates.get("locality") == "Uppal"
    assert criteria.detected_locality == "Uppal"

    # Indiranagar in Bengaluru
    updates_ind, criteria_ind = service.parse_text_query("romantic dinner in indiranagar", current_city="bengaluru")
    assert updates_ind.get("locality") == "Indiranagar"
    assert updates_ind.get("companion_type") == "couples"

    # Gion in Kyoto
    updates_gion, _ = service.parse_text_query("evening walk in gion", current_city="kyoto")
    assert updates_gion.get("locality") == "Gion"


def test_synonyms_and_interpretation_banner():
    service = PreferenceService()
    updates, criteria = service.parse_text_query("quiet cfe with my girlfriend under 1000 in hydrabad")
    
    assert criteria.detected_city == "hyderabad"
    assert criteria.detected_category == "cafe"
    assert "peaceful" in criteria.detected_atmospheres
    assert criteria.detected_companion == "couples"
    assert criteria.detected_budget == 1000.0
    assert criteria.explanation_banner is not None
    assert "Cafe" in criteria.explanation_banner
    assert "Peaceful" in criteria.explanation_banner
