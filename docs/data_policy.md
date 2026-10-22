# WanderGraph Data Policy & Google Maps Platform Compliance

## 1. Compliance Statement

WanderGraph respects all applicable third-party terms of service, including the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms) and [Places API Policies](https://developers.google.com/maps/documentation/places/web-service/policies).

### Key Commitments:
1. **No Bulk Storage or Scraping**: WanderGraph does not bulk scrape, copy, or create permanent offline substitutes for Google's places database.
2. **Runtime Discovery**: External places are retrieved on-demand during user searches.
3. **Place ID Usage**: Place IDs are stored and referenced solely as permitted by Google Maps Platform policies (e.g., for linking or fetching real-time details).
4. **Field Mask Minimization**: Requests use explicit `X-Goog-FieldMask` headers to avoid downloading or paying for unnecessary fields.
5. **Attribution & Provenance**: Author and provider attributions returned by external APIs are passed through and surfaced to users in place details.
6. **No Secret Leakage**: `GOOGLE_MAPS_API_KEY` is maintained exclusively on the backend server and is never passed to or bundled in the client application.

---

## 2. Privacy & User Session Policy

- **Session Isolation**: User preferences are scoped strictly to individual UUID sessions (`session_id`) stored in memory or client local storage. There is zero cross-user preference leakage.
- **Location Privacy**: The application defaults to manual city selection and does not track the user's continuous background GPS location.
- **Transient Preference State**: Sessions can be cleared or reset by the user at any time with a single click.
