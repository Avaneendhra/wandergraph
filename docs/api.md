# WanderGraph API Documentation

WanderGraph exposes clean, validated REST endpoints under `/api`.

Interactive Swagger UI is accessible at:
- `http://127.0.0.1:8000/docs`
- ReDoc at `http://127.0.0.1:8000/redoc`

---

## Endpoints Summary

### `GET /api/health`
Checks API health, environment, and provider operational status.
```bash
curl -X GET http://127.0.0.1:8000/api/health
```

### `GET /api/cities`
Returns metadata, currencies, coordinates, and neighborhoods for supported cities.
```bash
curl -X GET http://127.0.0.1:8000/api/cities
```

### `GET /api/categories`
Returns category and subcategory taxonomy.
```bash
curl -X GET http://127.0.0.1:8000/api/categories
```

### `POST /api/search`
Searches places for a city, evaluates conversational preferences, and returns scored, explained recommendations.
```bash
curl -X POST http://127.0.0.1:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "peaceful temples",
    "city": "kyoto",
    "session_id": "test-session-123",
    "limit": 10
  }'
```

### `POST /api/preferences/update`
Partially updates a user session using free-text or direct dictionary overrides while preserving compatible constraints.
```bash
curl -X POST http://127.0.0.1:8000/api/preferences/update \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "user_message": "Somewhere for couples under ¥5,000 in the evening"
  }'
```

### `GET /api/preferences/{session_id}`
Retrieves active session state and active constraints.
```bash
curl -X GET http://127.0.0.1:8000/api/preferences/test-session-123
```

### `DELETE /api/preferences/{session_id}`
Resets all session preferences.
```bash
curl -X DELETE http://127.0.0.1:8000/api/preferences/test-session-123
```

### `DELETE /api/preferences/{session_id}/field/{field_name}`
Removes an individual preference chip (e.g. `companion_type`, `budget_max`, `atmosphere`).
```bash
curl -X DELETE http://127.0.0.1:8000/api/preferences/test-session-123/field/companion_type
```

### `GET /api/graph?city=kyoto`
Returns knowledge graph subgraphs in Cytoscape.js JSON format for frontend visualization.
```bash
curl -X GET "http://127.0.0.1:8000/api/graph?city=kyoto"
```

### `GET /api/graph/node/{node_id}`
Returns ego-graph neighborhood around a specific node (e.g. `place:hyd_charminar`).
```bash
curl -X GET "http://127.0.0.1:8000/api/graph/node/place:hyd_charminar"
```

### `GET /api/places/{place_id}`
Retrieves detailed place data, including verified opening hours and connected graph entities.
```bash
curl -X GET "http://127.0.0.1:8000/api/places/hyd_charminar"
```
