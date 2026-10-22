import pytest
from app.services.mock_places import MockPlacesService
from app.services.google_places import GooglePlacesService
from app.config import settings


@pytest.mark.asyncio
async def test_mock_places_provider():
    mock = MockPlacesService()
    status = mock.get_status()
    assert status.is_live is False
    assert "Development Mode" in status.status_message

    # Test all 4 cities
    for city in ["hyderabad", "bengaluru", "tokyo", "kyoto"]:
        results = await mock.search_places(query="all", city=city)
        assert len(results) > 0
        first = results[0]
        assert first.city == city
        assert first.id
        assert first.name
        assert first.coordinates is not None

    # Test details
    details = await mock.get_place_details("hyd_charminar")
    assert details is not None
    assert details.name == "Charminar"
    assert details.city == "hyderabad"
    assert "provenance" in details.model_dump()


def test_google_places_service_status():
    service = GooglePlacesService(api_key=None)
    status = service.get_status()
    assert status.is_live is False
    assert status.api_key_configured is False
    assert "GOOGLE_MAPS_API_KEY is not configured" in status.status_message

    # Test headers and field mask
    service_with_dummy_key = GooglePlacesService(api_key="DUMMY_TEST_KEY_NOT_REAL_12345")
    headers = service_with_dummy_key._headers(settings.places_search_field_mask)
    assert headers["X-Goog-Api-Key"] == "DUMMY_TEST_KEY_NOT_REAL_12345"
    assert "places.id" in headers["X-Goog-FieldMask"]
    assert "places.displayName" in headers["X-Goog-FieldMask"]
    assert "places.location" in headers["X-Goog-FieldMask"]
