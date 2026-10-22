# WanderGraph Developer Guide & Setup Instructions

## 1. Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Node.js 18+ (tested with Node.js v22)
- npm 9+

---

## 2. Quickstart

### 2.1 Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API runs at `http://127.0.0.1:8000`. Test health:
```bash
curl http://127.0.0.1:8000/api/health
```

### 2.2 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`. Open in your browser.

---

## 3. Google Places API (New) Configuration

By default, WanderGraph operates in **Development Mode** with curated local seed datasets for Hyderabad, Bengaluru, Tokyo, and Kyoto.

To activate live Google Places API (New) searches:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project with billing enabled.
3. Enable the **Places API (New)**.
4. Create an API Key under Credentials.
5. Restrict the key to the **Places API (New)** only.
6. Set the environment variable:
   ```bash
   # Windows PowerShell
   $env:GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"

   # Or in wandergraph/backend/.env
   GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
   ```
7. Restart the backend server. The `/api/health` endpoint and UI header badge will automatically reflect:
   `Google Places API (New) Live`.

### Budget & Quota Recommendations:
- Set daily quota limits in the Google Cloud Console (e.g. 1,000 requests/day).
- WanderGraph requests only essential fields using `X-Goog-FieldMask` to minimize SKU billing tiers.

---

## 4. Running Automated Tests

### 4.1 Backend Pytest Suite
```bash
cd backend
python -m pytest -v tests
```
Runs 14 automated tests covering health checks, city configurations, graph construction, node/edge validations, preference session isolation, partial constraint preservation, and explainability scoring.

### 4.2 Frontend Vitest Suite
```bash
cd frontend
npm test
```
Runs unit tests for the Navbar, PreferenceChips, and PlaceCard components.

### 4.3 Production Build
```bash
cd frontend
npm run build
```
Generates production-optimized static assets in `frontend/dist/`.
