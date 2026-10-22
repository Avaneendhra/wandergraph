from typing import Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
from enum import Enum


class PriceEstimateType(str, Enum):
    VERIFIED = "verified"
    ESTIMATED_BY_PRICE_LEVEL = "estimated_by_price_level"
    UNKNOWN = "unknown"


class PriceEstimate(BaseModel):
    spending_range_text: str
    admission_text: str
    currency: str
    estimate_type: str
    min_spend: Optional[float] = None
    max_spend: Optional[float] = None
    is_free: bool = False
    methodology_note: str


# Documented price level ranges per city currency
PRICE_RANGES_INR: Dict[int, Tuple[float, float, str]] = {
    0: (0.0, 0.0, "Free admission"),
    1: (200.0, 500.0, "₹200 – ₹500 per person"),
    2: (500.0, 1200.0, "₹500 – ₹1,200 per person"),
    3: (1200.0, 2500.0, "₹1,200 – ₹2,500 per person"),
    4: (2500.0, 5000.0, "₹2,500+ per person"),
}

PRICE_RANGES_JPY: Dict[int, Tuple[float, float, str]] = {
    0: (0.0, 0.0, "Free admission"),
    1: (800.0, 1800.0, "¥800 – ¥1,800 per person"),
    2: (1800.0, 4000.0, "¥1,800 – ¥4,000 per person"),
    3: (4000.0, 9000.0, "¥4,000 – ¥9,000 per person"),
    4: (9000.0, 20000.0, "¥9,000+ per person"),
}

# Known landmark admission fees (in local currency)
KNOWN_ADMISSION_FEES: Dict[str, Tuple[float, str]] = {
    # Hyderabad
    "golconda fort": (25.0, "Admission: ₹25 (Domestic) / ₹300 (Foreign)"),
    "charminar": (25.0, "Admission: ₹25 (Domestic) / ₹300 (Foreign)"),
    "chowmahalla palace": (100.0, "Admission: ₹100 per person"),
    "salar jung museum": (50.0, "Admission: ₹50 per person"),
    "birla mandir": (0.0, "Free admission"),
    "hussain sagar": (0.0, "Free lakeside access; boating ₹100–₹350"),
    "shilparamam": (60.0, "Admission: ₹60 per person"),
    "qutb shahi tombs": (50.0, "Admission: ₹50 per person"),
    # Bengaluru
    "lalbagh botanical garden": (30.0, "Admission: ₹30 per person"),
    "cubbon park": (0.0, "Free entry"),
    "bangalore palace": (250.0, "Admission: ₹250 (Domestic) / ₹500 (Foreign)"),
    "visvesvaraya industrial and technological museum": (85.0, "Admission: ₹85 per person"),
    "iskcon temple bangalore": (0.0, "Free admission"),
    # Tokyo
    "senso-ji": (0.0, "Free temple grounds admission"),
    "meiji jingu": (0.0, "Free shrine grounds admission"),
    "tokyo skytree": (2100.0, "Observation deck from ¥2,100"),
    "shinjuku gyoen national garden": (500.0, "Admission: ¥500 per adult"),
    "ueno park": (0.0, "Free park access; museum entry fees separate"),
    "teamlab planets tokyo": (3800.0, "Tickets from ¥3,800"),
    "tokyo national museum": (1000.0, "Admission: ¥1,000 per adult"),
    # Kyoto
    "fushimi inari taisha": (0.0, "Free 24/7 shrine grounds entry"),
    "kinkaku-ji": (500.0, "Admission: ¥500 per adult"),
    "kiyomizu-dera": (400.0, "Admission: ¥400 per adult"),
    "arashiyama bamboo grove": (0.0, "Free public walkway"),
    "gion": (0.0, "Free historic district access"),
    "nijo castle": (800.0, "Admission: ¥800 per adult"),
    "ryoan-ji": (600.0, "Admission: ¥600 per adult"),
}


class PriceService:
    @staticmethod
    def get_currency_for_city(city: str) -> str:
        city_lower = (city or "").strip().lower()
        if city_lower in ["hyderabad", "bengaluru"]:
            return "INR"
        return "JPY"

    @classmethod
    def estimate_price(
        cls,
        place_name: str,
        city: str,
        price_level: Optional[int] = None,
        approx_cost: Optional[float] = None,
        types: Optional[list] = None,
    ) -> PriceEstimate:
        currency = cls.get_currency_for_city(city)
        name_clean = (place_name or "").lower().strip()
        types_list = types or []

        # 1. Check known landmark admission fees
        for landmark_key, (fee, admission_desc) in KNOWN_ADMISSION_FEES.items():
            if landmark_key in name_clean or name_clean in landmark_key:
                is_free = fee == 0.0
                min_spend = fee
                max_spend = fee + (200.0 if currency == "INR" else 1000.0) if fee > 0 else 0.0
                spending_text = (
                    "Free"
                    if is_free
                    else f"{'₹' if currency == 'INR' else '¥'}{int(min_spend):,} – {int(max_spend):,} typical spend"
                )
                return PriceEstimate(
                    spending_range_text=spending_text,
                    admission_text=admission_desc,
                    currency=currency,
                    estimate_type=PriceEstimateType.VERIFIED.value,
                    min_spend=min_spend,
                    max_spend=max_spend,
                    is_free=is_free,
                    methodology_note="Verified official landmark admission fee with estimated incidental expenditure.",
                )

        # 2. Check if verified approx_cost is explicitly provided (e.g. from seed data)
        if approx_cost is not None:
            is_free = approx_cost == 0.0
            symbol = "₹" if currency == "INR" else "¥"
            if is_free:
                return PriceEstimate(
                    spending_range_text="Free",
                    admission_text="Free admission",
                    currency=currency,
                    estimate_type=PriceEstimateType.VERIFIED.value,
                    min_spend=0.0,
                    max_spend=0.0,
                    is_free=True,
                    methodology_note="Verified admission/cost is free of charge.",
                )
            else:
                low = approx_cost * 0.8
                high = approx_cost * 1.3
                return PriceEstimate(
                    spending_range_text=f"~{symbol}{int(approx_cost):,} per person ({symbol}{int(low):,} – {int(high):,})",
                    admission_text=f"Estimated average spend: {symbol}{int(approx_cost):,}",
                    currency=currency,
                    estimate_type=PriceEstimateType.VERIFIED.value,
                    min_spend=low,
                    max_spend=high,
                    is_free=False,
                    methodology_note="Based on verified average spend reported for this venue.",
                )

        # 3. Use Google Places priceLevel mapping if available
        if price_level is not None and 0 <= price_level <= 4:
            ranges = PRICE_RANGES_INR if currency == "INR" else PRICE_RANGES_JPY
            min_val, max_val, label = ranges.get(price_level, (0.0, 0.0, "Free"))
            is_free = price_level == 0
            symbol = "₹" if currency == "INR" else "¥"
            admission_note = (
                "Free admission"
                if is_free
                else f"Price level {price_level}/4 ({label})"
            )
            return PriceEstimate(
                spending_range_text=label,
                admission_text=admission_note,
                currency=currency,
                estimate_type=PriceEstimateType.ESTIMATED_BY_PRICE_LEVEL.value,
                min_spend=min_val,
                max_spend=max_val,
                is_free=is_free,
                methodology_note=f"Estimated from venue price tier {price_level}/4 mapped to {currency} local market averages.",
            )

        # 4. Check venue types: public parks, religious places are typically free entry
        free_types = {"park", "hindu_temple", "shinto_shrine", "buddhist_temple", "church", "place_of_worship"}
        if any(t in free_types for t in types_list):
            return PriceEstimate(
                spending_range_text="Free (Public / Religious Site)",
                admission_text="Free general admission; voluntary donations welcome",
                currency=currency,
                estimate_type=PriceEstimateType.ESTIMATED_BY_PRICE_LEVEL.value,
                min_spend=0.0,
                max_spend=0.0,
                is_free=True,
                methodology_note="Public religious shrines and municipal parks typically offer free general entry.",
            )

        # 5. Transparent Unknown
        return PriceEstimate(
            spending_range_text="Price unverified",
            admission_text="Admission / price information unavailable",
            currency=currency,
            estimate_type=PriceEstimateType.UNKNOWN.value,
            min_spend=None,
            max_spend=None,
            is_free=False,
            methodology_note="No verified pricing or price level returned by data provider. Check directly on-site.",
        )
