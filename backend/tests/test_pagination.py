import pytest
from app.services.mock_places import MockPlacesService


@pytest.mark.asyncio
async def test_mock_pagination():
    mock = MockPlacesService()

    # Page 1 (limit 2)
    page_1 = await mock.search_places(query="all", city="hyderabad", limit=2)
    assert len(page_1.places) == 2
    assert page_1.next_page_token is not None
    first_id = page_1.places[0].id

    # Page 2 using next_page_token
    page_2 = await mock.search_places(
        query="all",
        city="hyderabad",
        limit=2,
        page_token=page_1.next_page_token,
    )
    assert len(page_2.places) > 0
    second_id = page_2.places[0].id

    # Ensure deduplication / different records across pages
    assert first_id != second_id
