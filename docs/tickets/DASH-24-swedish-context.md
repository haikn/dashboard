# DASH-24 — Epic: Swedish Context Widgets

**Type:** Epic
**Priority:** High
**Status:** To Do
**Labels:** `swedish`, `widget`, `frontend`, `electricity`, `transport`

## Summary
Build widgets that make the dashboard feel purpose-built for Sweden: hourly electricity spot prices per Nord Pool price zone, and real-time SL / public transport departures from a configurable home station.

## Goal
Electricity pricing and public transport are two of the highest-engagement local data points for Swedish users — both have free APIs and strong community demand.

---

## Stories

---

### DASH-25 — Electricity Price (Spotpris) Widget

**Type:** Story
**Priority:** High
**Labels:** `swedish`, `widget`, `electricity`, `spotpris`
**Epic Link:** DASH-24

#### Summary
Show today's and tomorrow's hourly Nord Pool spot prices (öre/kWh) for the user's configured Swedish price zone (SE1–SE4), rendered as a bar chart with the current hour highlighted and cheapest/most expensive hours marked.

#### Description
Electricity prices in Sweden vary dramatically by hour in the day-ahead Nord Pool market. This widget lets users optimise appliance usage by showing when electricity is cheap vs. expensive. Tomorrow's prices are published ~12:30 CET and should appear automatically.

#### Acceptance Criteria
- [ ] Configurable price zone: SE1 (Luleå), SE2 (Sundsvall), SE3 (Stockholm), SE4 (Malmö)
- [ ] Horizontal bar chart or area chart showing 24 hourly prices for today
- [ ] Tomorrow's prices shown in a secondary chart / toggle (available after ~13:00 CET)
- [ ] Current hour's bar is highlighted (distinct colour)
- [ ] Cheapest hour: green label/marker; most expensive: red label/marker
- [ ] Price displayed in öre/kWh (excl. VAT); toggle to SEK/kWh incl. estimated VAT (25%)
- [ ] Threshold alert styling: background tint green when current price < daily average, red when > 150% average
- [ ] Refreshes automatically when new data is available (Supabase Realtime on `electricity_prices`)
- [ ] Zone selector persisted in localStorage

#### Technical Notes
- **API:** elpriset-just-nu.se — `GET https://www.elpriset-just-nu.se/api/v1/prices/{year}/{month}-{day}_{zone}.json` (free, no key)
- **n8n:** Workflow DASH-34 runs at 13:00 and 00:05 CET; upserts `electricity_prices` table
- **Supabase table:** `electricity_prices` (new — SQL in roadmap §6 Workflow 6)
- **Dependency:** `electricity_prices` Supabase table must be created before implementing the widget

---

### DASH-26 — Public Transport Departures Widget

**Type:** Story
**Priority:** High
**Labels:** `swedish`, `widget`, `transport`, `sl`, `trafiklab`
**Epic Link:** DASH-24

#### Summary
Show the next 5–10 departures from a configurable home station with line number, destination, and minutes until departure. Highlight delayed and cancelled services.

#### Description
For daily Stockholm (or other Swedish city) commuters, knowing the next bus/metro/tram departure without opening SL's app or website is a genuine quality-of-life improvement. The widget uses the Trafiklab ResRobot or SL Transport API.

#### Acceptance Criteria
- [ ] Configurable home stop ID (stored in localStorage); a stop search/lookup UI to find the ID
- [ ] Shows: line number (with line colour if available), destination, scheduled time, minutes until departure
- [ ] Delayed departures: show actual departure time in orange and delay in minutes
- [ ] Cancelled departures: strikethrough text with "Cancelled" badge in red
- [ ] Refreshes every 30 s
- [ ] Transport mode filter: All / Metro / Bus / Tram / Train / Ferry (persisted in localStorage)
- [ ] Graceful "No upcoming departures" state (e.g. late at night)
- [ ] Works for SL (Stockholm), Västtrafik (Gothenburg), Skånetrafik (Malmö) via ResRobot

#### Technical Notes
- **API:** Trafiklab.se — ResRobot Departures v2.1
  - `GET https://api.resrobot.se/v2.1/departureBoard?id={stopId}&maxJourneys=10&format=json&accessId={key}`
  - Free registration at trafiklab.se; no usage cost for basic tier
- **Stop search:** ResRobot Stop Lookup — `GET /v2.1/location.name?input={name}&format=json&accessId={key}`
- **Credentials needed:** Trafiklab API key (free after registration)
- **Implementation:** Direct Angular service call (real-time polling, not suitable for n8n batch caching)
- **No Supabase layer needed** — data is real-time and stop-specific; caching would reduce accuracy
