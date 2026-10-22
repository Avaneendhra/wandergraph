import pytest
from app.services.graph_service import GraphService
from app.services.preference_service import PreferenceState
from app.services.recommendation_service import RecommendationService
from app.services.mock_places import MockPlacesService


@pytest.mark.asyncio
async def test_recommendation_ranking_and_explanations():
    graph_service = GraphService()
    recommender = RecommendationService(graph_service=graph_service)
    mock_provider = MockPlacesService()

    # Search candidates in Hyderabad
    candidates = await mock_provider.search_places(query="monument", city="hyderabad")
    assert len(candidates) > 0

    # User preferences: Hyderabad, couples, peaceful, budget ₹200
    pref = PreferenceState(
        session_id="rec-test",
        city="hyderabad",
        companion_type="couples",
        atmosphere=["peaceful"],
        budget_max=200.0,
        currency="INR",
    )

    scored = recommender.rank_and_explain(candidates, pref)
    assert len(scored) > 0

    # Top result should have positive score and explainable reasons
    top = scored[0]
    assert top.total_score > 0
    assert len(top.matched_reasons) > 0
    assert "Recommended in Hyderabad" in top.explanation


@pytest.mark.asyncio
async def test_hard_budget_constraint():
    graph_service = GraphService()
    recommender = RecommendationService(graph_service=graph_service)
    mock_provider = MockPlacesService()

    # In Bengaluru, search places
    candidates = await mock_provider.search_places(query="places", city="bengaluru")

    # Set strict budget 0 (free only)
    pref = PreferenceState(
        session_id="free-test",
        city="bengaluru",
        budget_max=0.0,
        currency="INR",
    )

    scored = recommender.rank_and_explain(candidates, pref)
    for s in scored:
        # All returned must either be free or cost <= 0
        approx = s.place.approx_cost
        if approx is not None:
            assert approx == 0.0
