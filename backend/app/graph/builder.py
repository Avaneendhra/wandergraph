import json
import math
import os
from pathlib import Path
from typing import Dict, Any, List
import networkx as nx

from app.graph.schema import NodeType, RelationType, VerificationStatus, DataProvenance
from app.utils.logging import logger

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def load_json_file(filename: str) -> Any:
    file_path = DATA_DIR / filename
    if not file_path.exists():
        logger.warning(f"Data file not found: {file_path}")
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_knowledge_graph() -> nx.MultiDiGraph:
    """
    Constructs the WanderGraph NetworkX MultiDiGraph seeded with
    cities, categories, semantic concepts, and verified places.
    """
    g = nx.MultiDiGraph()

    cities_data: Dict[str, Any] = load_json_file("cities.json")
    categories_data: Dict[str, Any] = load_json_file("categories.json")
    seed_places: List[Dict[str, Any]] = load_json_file("seed_places.json")

    # 1. Add standard CompanionType nodes
    companion_types = ["family", "couples", "solo", "friends", "business"]
    for comp in companion_types:
        node_id = f"companion:{comp}"
        g.add_node(
            node_id,
            label=comp.capitalize(),
            type=NodeType.COMPANION_TYPE.value,
            properties={"name": comp},
            provenance={"source": "WanderGraph Ontology", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
        )

    # 2. Add standard Atmosphere nodes
    atmospheres = ["peaceful", "romantic", "lively", "scenic", "cultural", "spiritual", "adventurous", "serene", "energetic", "futuristic", "traditional", "grand", "natural", "educational", "mystical", "zen"]
    for atm in atmospheres:
        node_id = f"atmosphere:{atm}"
        g.add_node(
            node_id,
            label=atm.capitalize(),
            type=NodeType.ATMOSPHERE.value,
            properties={"name": atm},
            provenance={"source": "WanderGraph Ontology", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
        )

    # 3. Add standard TimeOfDay nodes
    times_of_day = ["morning", "afternoon", "evening", "night"]
    for tod in times_of_day:
        node_id = f"time_of_day:{tod}"
        g.add_node(
            node_id,
            label=tod.capitalize(),
            type=NodeType.TIME_OF_DAY.value,
            properties={"name": tod},
            provenance={"source": "WanderGraph Ontology", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
        )

    # 4. Add standard PriceRange nodes
    price_ranges = [
        ("free", "Free (₹0 / ¥0)", 0),
        ("budget", "Budget Friendly", 1),
        ("moderate", "Moderate", 2),
        ("upscale", "Upscale / Premium", 3),
    ]
    for pr_id, pr_label, pr_level in price_ranges:
        node_id = f"price_range:{pr_id}"
        g.add_node(
            node_id,
            label=pr_label,
            type=NodeType.PRICE_RANGE.value,
            properties={"level": pr_level, "code": pr_id},
            provenance={"source": "WanderGraph Ontology", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
        )

    # 5. Add Accessibility Feature node
    g.add_node(
        "accessibility:wheelchair_accessible",
        label="Wheelchair Accessible",
        type=NodeType.ACCESSIBILITY_FEATURE.value,
        properties={"code": "wheelchair_accessible"},
        provenance={"source": "WanderGraph Ontology", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
    )

    # 6. Add Cities & Neighborhoods
    for city_id, city_info in cities_data.items():
        city_node_id = f"city:{city_id}"
        g.add_node(
            city_node_id,
            label=city_info["name"],
            type=NodeType.CITY.value,
            properties=city_info,
            provenance={"source": "Official Municipal & Geographic Registries", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
        )

        for nh in city_info.get("popular_neighborhoods", []):
            nh_slug = nh.lower().replace(" ", "_").replace("/", "_")
            nh_node_id = f"neighborhood:{city_id}:{nh_slug}"
            g.add_node(
                nh_node_id,
                label=nh,
                type=NodeType.NEIGHBORHOOD.value,
                properties={"name": nh, "city": city_id},
                provenance={"source": "Official Municipal Data", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
            )
            g.add_edge(
                nh_node_id,
                city_node_id,
                relation=RelationType.LOCATED_IN.value,
                provenance={"source": "Administrative Hierarchy", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
            )

    # 7. Add Category & Subcategory taxonomy
    for cat_group_id, cat_group in categories_data.items():
        for subcat in cat_group.get("subcategories", []):
            subcat_id = subcat["id"]
            cat_node_id = f"category:{subcat_id}"
            g.add_node(
                cat_node_id,
                label=subcat["name"],
                type=NodeType.CATEGORY.value,
                properties={
                    "group": cat_group["name"],
                    "google_types": subcat.get("google_types", []),
                },
                provenance={"source": "WanderGraph Category Taxonomy", "status": VerificationStatus.INDEPENDENTLY_VERIFIED.value},
            )

    # 8. Add Seed Places and Relationships
    places_by_id: Dict[str, Dict[str, Any]] = {}

    for place in seed_places:
        place_id = place["id"]
        place_node_id = f"place:{place_id}"
        places_by_id[place_id] = place

        # Place Node
        g.add_node(
            place_node_id,
            label=place["name"],
            type=NodeType.PLACE.value,
            properties={
                "id": place_id,
                "name": place["name"],
                "city": place["city"],
                "neighborhood": place.get("neighborhood"),
                "category": place.get("category"),
                "primary_type": place.get("primary_type"),
                "coordinates": place.get("coordinates"),
                "address": place.get("address"),
                "price_level": place.get("price_level"),
                "approx_cost": place.get("approx_cost"),
                "currency": place.get("currency"),
                "rating": place.get("rating"),
                "user_ratings_total": place.get("user_ratings_total"),
                "opening_hours_text": place.get("opening_hours_text"),
                "indoor_outdoor": place.get("indoor_outdoor"),
            },
            provenance=place.get("provenance"),
        )

        # LOCATED_IN City
        city_node_id = f"city:{place['city']}"
        if g.has_node(city_node_id):
            g.add_edge(
                place_node_id,
                city_node_id,
                relation=RelationType.LOCATED_IN.value,
                provenance=place.get("provenance"),
            )

        # IN_NEIGHBORHOOD
        if place.get("neighborhood"):
            nh_slug = place["neighborhood"].lower().replace(" ", "_").replace("/", "_")
            nh_node_id = f"neighborhood:{place['city']}:{nh_slug}"
            if not g.has_node(nh_node_id):
                g.add_node(
                    nh_node_id,
                    label=place["neighborhood"],
                    type=NodeType.NEIGHBORHOOD.value,
                    properties={"name": place["neighborhood"], "city": place["city"]},
                )
                g.add_edge(nh_node_id, city_node_id, relation=RelationType.LOCATED_IN.value)
            g.add_edge(
                place_node_id,
                nh_node_id,
                relation=RelationType.IN_NEIGHBORHOOD.value,
                provenance=place.get("provenance"),
            )

        # HAS_CATEGORY
        cat_id = place.get("category")
        if cat_id:
            cat_node_id = f"category:{cat_id}"
            if not g.has_node(cat_node_id):
                g.add_node(cat_node_id, label=cat_id.replace("_", " ").title(), type=NodeType.CATEGORY.value)
            g.add_edge(
                place_node_id,
                cat_node_id,
                relation=RelationType.HAS_CATEGORY.value,
                provenance=place.get("provenance"),
            )

        # SUITABLE_FOR CompanionType
        for comp in place.get("companion_suitability", []):
            comp_node_id = f"companion:{comp}"
            if g.has_node(comp_node_id):
                g.add_edge(
                    place_node_id,
                    comp_node_id,
                    relation=RelationType.SUITABLE_FOR.value,
                    provenance=place.get("provenance"),
                )

        # HAS_ATMOSPHERE
        for atm in place.get("atmosphere", []):
            atm_node_id = f"atmosphere:{atm}"
            if not g.has_node(atm_node_id):
                g.add_node(atm_node_id, label=atm.capitalize(), type=NodeType.ATMOSPHERE.value)
            g.add_edge(
                place_node_id,
                atm_node_id,
                relation=RelationType.HAS_ATMOSPHERE.value,
                provenance=place.get("provenance"),
            )

        # HAS_PRICE_RANGE
        price_lvl = place.get("price_level", 0)
        code_map = {0: "free", 1: "budget", 2: "moderate", 3: "upscale"}
        pr_node_id = f"price_range:{code_map.get(price_lvl, 'moderate')}"
        if g.has_node(pr_node_id):
            g.add_edge(
                place_node_id,
                pr_node_id,
                relation=RelationType.HAS_PRICE_RANGE.value,
                provenance=place.get("provenance"),
            )

        # RECOMMENDED_FOR TimeOfDay
        for tod in place.get("preferred_time", []):
            tod_node_id = f"time_of_day:{tod}"
            if g.has_node(tod_node_id):
                g.add_edge(
                    place_node_id,
                    tod_node_id,
                    relation=RelationType.RECOMMENDED_FOR.value,
                    provenance=place.get("provenance"),
                )

        # RECOMMENDED_FOR Interests
        for interest in place.get("interests", []):
            int_node_id = f"interest:{interest}"
            if not g.has_node(int_node_id):
                g.add_node(
                    int_node_id,
                    label=interest.replace("_", " ").title(),
                    type=NodeType.INTEREST.value,
                )
            g.add_edge(
                place_node_id,
                int_node_id,
                relation=RelationType.RECOMMENDED_FOR.value,
                provenance=place.get("provenance"),
            )

        # SUPPORTS_ACTIVITY
        for act in place.get("activities", []):
            act_node_id = f"activity:{act}"
            if not g.has_node(act_node_id):
                g.add_node(
                    act_node_id,
                    label=act.replace("_", " ").title(),
                    type=NodeType.ACTIVITY.value,
                )
            g.add_edge(
                place_node_id,
                act_node_id,
                relation=RelationType.SUPPORTS_ACTIVITY.value,
                provenance=place.get("provenance"),
            )

        # HAS_ACCESSIBILITY_FEATURE
        if place.get("accessibility", {}).get("wheelchair_accessible_entrance"):
            g.add_edge(
                place_node_id,
                "accessibility:wheelchair_accessible",
                relation=RelationType.HAS_ACCESSIBILITY_FEATURE.value,
                provenance=place.get("accessibility"),
            )

    # 9. Calculate NEARBY_TO relationships between places in the same city (<= 4km)
    places_list = list(places_by_id.values())
    for i in range(len(places_list)):
        for j in range(i + 1, len(places_list)):
            p1 = places_list[i]
            p2 = places_list[j]
            if p1["city"] == p2["city"]:
                c1 = p1.get("coordinates")
                c2 = p2.get("coordinates")
                if c1 and c2:
                    dist = haversine_distance_km(
                        c1["latitude"], c1["longitude"], c2["latitude"], c2["longitude"]
                    )
                    if dist <= 4.0:
                        dist_round = round(dist, 2)
                        p1_node = f"place:{p1['id']}"
                        p2_node = f"place:{p2['id']}"
                        g.add_edge(
                            p1_node,
                            p2_node,
                            relation=RelationType.NEARBY_TO.value,
                            properties={"distance_km": dist_round},
                            provenance={
                                "source": "Haversine Distance Calculation",
                                "verification_status": VerificationStatus.INDEPENDENTLY_VERIFIED.value,
                            },
                        )
                        g.add_edge(
                            p2_node,
                            p1_node,
                            relation=RelationType.NEARBY_TO.value,
                            properties={"distance_km": dist_round},
                            provenance={
                                "source": "Haversine Distance Calculation",
                                "verification_status": VerificationStatus.INDEPENDENTLY_VERIFIED.value,
                            },
                        )

    logger.info(
        f"Knowledge graph constructed: {g.number_of_nodes()} nodes, {g.number_of_edges()} edges"
    )
    return g
