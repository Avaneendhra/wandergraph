import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_cities_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/cities")
        assert response.status_code == 200
        cities = response.json()
        for expected in ["hyderabad", "bengaluru", "tokyo", "kyoto"]:
            assert expected in cities
            c = cities[expected]
            assert "name" in c
            assert "coordinates" in c
            assert "latitude" in c["coordinates"]
            assert "longitude" in c["coordinates"]
            assert "currency" in c
            assert "timezone" in c


@pytest.mark.asyncio
async def test_categories_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/categories")
        assert response.status_code == 200
        categories = response.json()
        assert "attractions_culture" in categories
        assert "nature_outdoors" in categories
        assert "food_drink" in categories
