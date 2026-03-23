# DASH-8 — Epic: Weather & Environment Widgets

**Type:** Epic
**Priority:** High
**Status:** To Do
**Labels:** `weather`, `widget`, `frontend`, `swedish`

## Summary
Build weather, pollen, air quality, and commute widgets using SMHI as the primary source for Swedish coordinates and OpenWeatherMap as a global fallback.

## Goal
Give users a hyper-local, Sweden-first environmental overview that covers conditions most relevant to daily life in Swedish cities.

---

## Stories

---

### DASH-9 — SMHI Weather Widget

**Type:** Story
**Priority:** High
**Labels:** `weather`, `widget`, `smhi`, `swedish`
**Epic Link:** DASH-8

#### Summary
Show current temperature, wind speed/direction, precipitation, and a 12-hour hourly forecast using SMHI as the primary data source. Fall back to OpenWeatherMap for non-Swedish coordinates.

#### Description
SMHI provides the most accurate micro-climate data for Swedish locations and requires no API key. The widget reads the user's saved location from localStorage (set by the Location Picker) to derive coordinates.

#### Acceptance Criteria
- [ ] Reads `user_location` from localStorage; derives lat/lon from the saved `geonameid` or a coordinate lookup
- [ ] Shows: temperature (°C), feels-like, wind speed (m/s), wind direction, precipitation (mm/h), weather condition icon
- [ ] 12-hour forecast rendered as a horizontal scroll of hourly cards
- [ ] Falls back to OpenWeatherMap OneCall 3.0 if SMHI returns an error or coordinates are outside Sweden
- [ ] Provider badge ("SMHI" / "OWM") shown in footer of widget
- [ ] Refreshes every 30 min (data sourced from Supabase `weather` table via Realtime)
- [ ] Skeleton loader shown during initial fetch

#### Technical Notes
- **Primary API:** SMHI Open Data — `GET https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json` (free, no key)
- **Fallback API:** OpenWeatherMap OneCall 3.0 (API key required)
- **n8n:** Workflow DASH-33 populates the `weather` Supabase table every 30 min
- **Supabase table:** `weather` (new — see SQL in roadmap §6 Workflow 5)
- **Dependency:** Location Picker must be completed first; coordinates derived from saved location

---

### DASH-10 — Pollen Forecast Widget

**Type:** Story
**Priority:** High
**Labels:** `weather`, `widget`, `pollen`, `swedish`
**Epic Link:** DASH-8

#### Summary
Display pollen risk levels for the three main Swedish allergens (Björk/birch, Gräs/grass, Al/alder) plus UV Index for the user's location.

#### Description
Pollen season (March–August) is a major quality-of-life concern in Sweden. This widget gives allergy sufferers a quick daily risk assessment without leaving the dashboard.

#### Acceptance Criteria
- [ ] Shows risk level per pollen type: None / Low / Moderate / High / Very High
- [ ] Pollen types displayed: Björk (birch), Gräs (grass), Al (alder), Gråbo (mugwort) as stretch
- [ ] UV Index shown alongside pollen data with label (Low / Moderate / High / Very High / Extreme)
- [ ] Refreshes daily (pollen data doesn't change intra-day)
- [ ] Graceful fallback when location is outside Sweden ("Pollen data not available for this region")

#### Technical Notes
- **API (Sweden):** Pollenkoll.se (scraping or unofficial API) or Ambee Pollen API with Swedish city param
- **API (UV):** SMHI UV product or OpenWeatherMap UV endpoint
- **Credentials needed:** Ambee API key (if using Ambee)
- **n8n:** Daily trigger workflow to fetch and store in a new `pollen` Supabase table

---

### DASH-11 — Air Quality Index (AQI) Widget

**Type:** Story
**Priority:** Medium
**Labels:** `weather`, `widget`, `aqi`, `environment`
**Epic Link:** DASH-8

#### Summary
Show the Air Quality Index, dominant pollutant (PM2.5 / NO₂ / O₃), and a colour-coded health recommendation label for the user's location.

#### Acceptance Criteria
- [ ] AQI value displayed prominently (0–500 scale)
- [ ] Health label: Good / Moderate / Unhealthy for Sensitive / Unhealthy / Very Unhealthy / Hazardous
- [ ] Dominant pollutant identified (PM2.5, PM10, NO₂, O₃, CO)
- [ ] Color-coded background: green → yellow → orange → red → purple → maroon
- [ ] Refreshes every 60 min

#### Technical Notes
- **API:** OpenWeatherMap Air Pollution — `GET /api/2.5/air_pollution?lat={lat}&lon={lon}` (free tier includes this endpoint)
- **Credentials needed:** OpenWeatherMap API key
- **Alternative:** Ambee Air Quality API for richer data
- **n8n:** Can be folded into the Weather workflow (DASH-33) as an additional HTTP Request node

---

### DASH-12 — Commute Time Widget

**Type:** Story
**Priority:** Medium
**Labels:** `widget`, `productivity`, `maps`, `commute`
**Epic Link:** DASH-8

#### Summary
Show current travel time from home to a configured destination, compared to typical travel time, with a "leave now" recommendation window.

#### Acceptance Criteria
- [ ] Configurable home address and destination (stored in localStorage)
- [ ] Shows current travel time and % difference vs. typical (e.g. "+12 min vs. usual")
- [ ] Travel mode selector: Driving / Transit / Walking / Cycling
- [ ] "Leave now" indicator: highlighted green when current time matches the optimal departure window
- [ ] Refreshes every 5 min during commute hours (06:00–09:00 and 15:00–18:00)
- [ ] Falls back to static "Traffic data unavailable" label outside API quota

#### Technical Notes
- **API:** Google Maps Distance Matrix API — paid after free tier (200 USD/month credit = ~40 000 req)
- **Alternative:** HERE Routing API (free tier: 30 000 req/month)
- **Credentials needed:** Google Maps API key (restricted to Distance Matrix endpoint)
- **Implementation:** Direct HTTP call from Angular service during scheduled polling intervals; no n8n needed
