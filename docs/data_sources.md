# WanderGraph Data Sources & Provenance Architecture

WanderGraph emphasizes strict data provenance, attribution, and licensing integrity. In accordance with Section 6.4 and Section 7 of the specification, the application never presents unverified assumptions as real-world facts or manufactures fake records.

---

## 1. Supported Data Sources

### 1.1 Google Places API (New)
- **Role**: Dynamic runtime place discovery and detail lookups.
- **Licensing & Policy**: Subject to the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms) and [Places API Policies](https://developers.google.com/maps/documentation/places/web-service/policies).
- **Data Retention Rules**:
  - No permanent caching or mass offline storage of Google Places data.
  - Place IDs are stored/referenced solely for runtime detail retrieval as permitted.
  - Attributions and provider notices are strictly maintained and surfaced to end users.
- **Provenance Label**: `source_returned`.

### 1.2 OpenStreetMap (OSM)
- **Role**: Base geographic metadata and neighborhood boundary relationships.
- **Licensing**: Open Database License (ODbL) © OpenStreetMap contributors.
- **Data Policy**: Attribution is provided and geographic boundary definitions adhere to open dataset terms.
- **Provenance Label**: `independently_verified`.

### 1.3 Official Municipal & Tourism Registries
- **Role**: Landmark schedules, cultural heritage records, ticket price baselines.
- **Sources**:
  - Archaeological Survey of India (ASI) & Telangana Tourism (Hyderabad).
  - Karnataka Department of Horticulture & Karnataka Tourism (Bengaluru).
  - Tokyo Convention & Visitors Bureau (TCVB) & Ministry of the Environment (Tokyo).
  - Kyoto City Tourism Association (Kyoto).
- **Provenance Label**: `independently_verified`.

---

## 2. Provenance Status Definitions

Every factual attribute in WanderGraph carries one of the following explicit statuses:

| Status | Meaning |
|---|---|
| `independently_verified` | Fact checked against official governmental, municipal, or venue websites. |
| `source_returned` | Returned at runtime by an external API (e.g. Google Places) but not independently audited. |
| `user_supplied` | Explicitly provided or overridden by the end-user during conversational session. |
| `inferred` | Calculated via transparent heuristic rules (e.g., proximity calculated using Haversine formula). |
| `unknown` | Explicitly marked as unverified (e.g., current price range or opening status unconfirmed). |
| `stale` | Previously verified data whose verification timestamp exceeds freshness thresholds. |
| `disputed` | Conflicting information reported across different official sources. |
