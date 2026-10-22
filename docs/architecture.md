# WanderGraph Architecture & Technical Design

WanderGraph is an intelligent, knowledge-graph-powered place discovery platform built for **Hyderabad**, **Bengaluru**, **Tokyo**, and **Kyoto**. It enables conversational preference refinement, explainable recommendations, and interactive graph exploration.

```
                    ┌──────────────────────────────────────────────┐
                    │            React + TypeScript Client         │
                    │   Vite • Tailwind CSS • Cytoscape.js Explorer│
                    └──────────────────────┬───────────────────────┘
                                           │ HTTP/JSON
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │               FastAPI Backend                │
                    │      REST API Endpoints & Request Validation  │
                    └──────┬───────────────┬───────────────┬───────┘
                           │               │               │
                           ▼               ▼               ▼
      ┌─────────────────────────┐  ┌──────────────┐  ┌───────────────────────┐
      │  Preference Engine      │  │ NetworkX     │  │ Places Provider       │
      │  • Session Isolation    │  │ MultiDiGraph │  │ • Google Places (New) │
      │  • Constraint Preserving│  │ • Typed Nodes│  │ • Development Mock    │
      │  • Deterministic NLP    │  │ • Semantics  │  │ • Selective Field Mask│
      └────────────┬────────────┘  └───────┬──────┘  └───────────┬───────────┘
                   │                       │                     │
                   └───────────────────────┼─────────────────────┘
                                           │
                                           ▼
                            ┌──────────────────────────────┐
                            │    Recommendation Engine     │
                            │   • Hard Constraint Filter   │
                            │   • Soft Preference Scoring  │
                            │   • Evidence-Based Reasoner  │
                            └──────────────────────────────┘
```

---

## 1. Backend Components

### 1.1 FastAPI REST Layer (`app/api/`)
- Modern, asynchronous endpoints with Pydantic request/response validation.
- CORS restricted to configured origins.
- OpenAPI specification automatically generated at `/docs` and `/redoc`.

### 1.2 Knowledge Graph Engine (`app/graph/` & `app/services/graph_service.py`)
- Powered by an in-memory **NetworkX `MultiDiGraph`**.
- Supports typed nodes: `Place`, `City`, `Neighborhood`, `Category`, `Activity`, `Interest`, `CompanionType`, `Atmosphere`, `PriceRange`, `TimeOfDay`, `Amenity`, `AccessibilityFeature`.
- Supports directed semantic relationships: `LOCATED_IN`, `IN_NEIGHBORHOOD`, `HAS_CATEGORY`, `SUPPORTS_ACTIVITY`, `SUITABLE_FOR`, `HAS_AMENITY`, `HAS_ACCESSIBILITY_FEATURE`, `HAS_PRICE_RANGE`, `HAS_ATMOSPHERE`, `RECOMMENDED_FOR`, `RELATED_TO`, `NEARBY_TO`.
- Provides ego-graph extraction (neighborhoods) and formatting directly into Cytoscape.js format.

### 1.3 Places Provider Layer (`app/services/places_provider.py`)
- **Abstract Provider Interface**: decouples external APIs from internal graph and ranking logic.
- **`GooglePlacesService`**:
  - Implements Google Places API (New) endpoints (`/v1/places:searchText` and `/v1/places/{id}`).
  - Uses explicit field masks (`places.id`, `places.displayName`, `places.location`, etc.) to control billing and bandwidth.
  - Zero restricted caching: Place IDs are used for runtime retrieval without storing restricted provider data.
- **`MockPlacesService`**:
  - Deterministic development provider seeded with authentic places across all 4 cities with explicit provenance.
  - Enables zero-configuration testing and local exploration out of the box.

### 1.4 Conversational Preference Engine (`app/services/preference_service.py`)
- Persistent in-memory session state isolated by `session_id`.
- Deterministic regex-based NLP parser extracting destination cities, companion types, budgets, atmospheres, times of day, and accessibility.
- **Constraint Preservation**: incremental updates (e.g., adding "under ₹1,000") preserve already compatible preferences (e.g., "Kyoto" and "Couples").
- Individual constraint removal and clean session reset.

### 1.5 Explainable Recommendation Engine (`app/services/recommendation_service.py`)
- Rule-based, transparent scoring without opaque machine learning models.
- Hard constraints: Destination city match, budget ceiling, wheelchair accessibility.
- Soft scoring: Graph connectivity to selected companion types, atmospheres, interests, and preferred times.
- Honest evidence-based explanations distinguishing confirmed facts from unverified attributes.

---

## 2. Frontend Components (`frontend/src/`)

- **Vite + React 18 + TypeScript**: fast bundling, type safety, and reactive state management.
- **Tailwind CSS**: responsive glassmorphic dark UI tailored for travel exploration.
- **Cytoscape.js (`GraphExplorer.tsx`)**:
  - Full canvas rendering of knowledge graph subgraphs.
  - Force-directed (CoSE), concentric, breadth-first, and circular layouts.
  - Zoom, pan, center, reset, and node search.
  - Interactive Node Inspector drawer displaying node properties and provenance.
- **Dynamic Context Chips (`PreferenceChips.tsx`)**:
  - Visual display of active constraints.
  - One-click removal of individual constraints or full reset.
- **Conversational Bar (`ConversationalBar.tsx`)**:
  - Bottom refinement bar supporting conversational follow-ups.
