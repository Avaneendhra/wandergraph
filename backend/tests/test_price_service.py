import pytest
from app.services.price_service import PriceService, PriceEstimateType


def test_known_admission_fees():
    # Golconda Fort in Hyderabad
    est = PriceService.estimate_price("Golconda Fort", "hyderabad")
    assert est.currency == "INR"
    assert est.is_free is False
    assert est.estimate_type == PriceEstimateType.VERIFIED.value
    assert "Admission: ₹25" in est.admission_text
    assert est.min_spend == 25.0

    # Birla Mandir (Free temple)
    est_birla = PriceService.estimate_price("Birla Mandir", "hyderabad")
    assert est_birla.is_free is True
    assert est_birla.spending_range_text == "Free"

    # Kinkaku-ji in Kyoto
    est_kyoto = PriceService.estimate_price("Kinkaku-ji", "kyoto")
    assert est_kyoto.currency == "JPY"
    assert est_kyoto.min_spend == 500.0
    assert "¥500" in est_kyoto.admission_text


def test_inr_price_levels():
    # Level 1 (Budget)
    est_l1 = PriceService.estimate_price("Chutneys", "hyderabad", price_level=1)
    assert est_l1.currency == "INR"
    assert est_l1.min_spend == 200.0
    assert est_l1.max_spend == 500.0
    assert "₹200 – ₹500 per person" in est_l1.spending_range_text

    # Level 3 (Expensive)
    est_l3 = PriceService.estimate_price("Jewel of Nizam", "hyderabad", price_level=3)
    assert est_l3.min_spend == 1200.0
    assert est_l3.max_spend == 2500.0


def test_jpy_price_levels():
    # Level 2 (Moderate) in Tokyo
    est_tokyo = PriceService.estimate_price("Izakaya Torikizoku", "tokyo", price_level=2)
    assert est_tokyo.currency == "JPY"
    assert est_tokyo.min_spend == 1800.0
    assert est_tokyo.max_spend == 4000.0
    assert "¥1,800 – ¥4,000 per person" in est_tokyo.spending_range_text


def test_unknown_price_handling():
    est_unknown = PriceService.estimate_price("Random Mysterious Gallery", "bengaluru")
    assert est_unknown.estimate_type == PriceEstimateType.UNKNOWN.value
    assert est_unknown.spending_range_text == "Price unverified"
    assert est_unknown.min_spend is None
    assert "unavailable" in est_unknown.admission_text.lower()
