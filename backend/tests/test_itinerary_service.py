import pytest
from app.services.graph_service import GraphService
from app.services.mock_places import MockPlacesService
from app.services.itinerary_service import ItineraryService


@pytest.mark.asyncio
async def test_itinerary_generation():
    graph_service = GraphService()
    itinerary_service = ItineraryService(graph_service=graph_service)
    mock_provider = MockPlacesService()

    # Generate full-day itinerary
    itinerary = await itinerary_service.generate_itinerary(
        session_id="itin-test-1",
        user_message="Plan a romantic day in Hyderabad with good food",
        city="hyderabad",
        places_provider=mock_provider,
    )

    assert itinerary.city == "hyderabad"
    assert len(itinerary.stops) >= 3
    assert "₹" in itinerary.total_estimated_spend or "Free" in itinerary.total_estimated_spend
    assert "Sequenced" in itinerary.travel_feasibility_note or "transit" in itinerary.travel_feasibility_note.lower()

    # Verify stop attributes
    first_stop = itinerary.stops[0]
    assert first_stop.time_slot != ""
    assert first_stop.place.name != ""
    assert first_stop.estimated_cost != ""


@pytest.mark.asyncio
async def test_itinerary_stop_replacement():
    graph_service = GraphService()
    itinerary_service = ItineraryService(graph_service=graph_service)
    mock_provider = MockPlacesService()

    itinerary = await itinerary_service.generate_itinerary(
        session_id="itin-test-2",
        user_message="Plan a half day in Bengaluru",
        city="bengaluru",
        places_provider=mock_provider,
    )

    original_stop_name = itinerary.stops[0].place.name

    # Replace stop 0
    updated = await itinerary_service.replace_stop(
        session_id="itin-test-2",
        stop_index=0,
        preference_note="park garden nature",
    )

    assert len(updated.stops) == len(itinerary.stops)
    # Replaced venue is different or valid
    assert updated.stops[0].place.name != ""
