# Dashboard Roadmap

---

## 1. Finance — Stockholm Market & Market Intelligence

> Focus on **Nasdaq Stockholm** first, then layer in global market intelligence.

- [ ] **OMXS30 Index widget** *(Swedish priority)*
  - Source: [Yahoo Finance API via RapidAPI](https://rapidapi.com/sparior/api/yahoo-finance15) — ticker `^OMX` for the index
  - Show index level, daily change %, and a mini sparkline for the session
  - Track major Swedish stocks: Investor AB (`INVE-B.ST`), Volvo B (`VOLV-B.ST`), Evolution (`EVO.ST`)

- [ ] **SEK Exchange Rate widget** *(Swedish priority)*
  - Source: [Frankfurter API](https://www.frankfurter.app/) (free, no key) or Alpha Vantage Forex
  - Show SEK/USD and SEK/EUR with daily change; highlight if rate moves >1% (currency volatility is high)

- [ ] **Fear & Greed Index widget**
  - Source: [Alternative.me API](https://alternative.me/crypto/fear-and-greed-index/)
  - Show current crypto market sentiment as a gauge/label (Extreme Fear → Extreme Greed)

- [ ] **Whale Alert feed widget**
  - Source: [Whale Alert API](https://docs.whale-alert.io/)
  - Small real-time feed of large on-chain transactions; highlight direction (exchange in/out, wallet-to-wallet)

- [ ] **Stock Technical Signals widget**
  - Source: Finnhub or [Alpha Vantage](https://www.alphavantage.co/)
  - Display simple Buy / Hold / Sell indicators computed from RSI and Moving Averages (SMA 50 / SMA 200)
  - Avoid raw numbers — show actionable signal labels

- [ ] **Gas Tracker widget**
  - Source: Etherscan Gas Oracle (free, no key needed for basic) or Blocknative
  - Show real-time Ethereum gas (Gwei) for Slow / Standard / Fast
  - Stretch: Bitcoin mempool fee rate via mempool.space API

---

## 2. Weather & Environment — Sweden-First

> **SMHI** gives higher accuracy than global providers for Swedish micro-climates — use it as the primary source.

- [ ] **SMHI Weather widget** *(Swedish priority)*
  - Source: [SMHI Open Data API](https://opendata.smhi.se/apidocs/metfcst/) — free, **no API key required**
  - Endpoint: `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json`
  - Show current temperature, wind, precipitation, and hourly forecast for the next 12 h
  - Fall back to OpenWeatherMap for non-Swedish coordinates

- [ ] **Pollen Forecast widget** *(Swedish priority — popular in spring)*
  - Source: [Pollenkoll](https://pollenkoll.se/) or [Ambee Pollen API](https://www.getambee.com/api/pollen) scoped to Swedish cities
  - Display risk levels for Björk (birch), Gräs (grass), and Al (alder) — the Swedish spring trifecta
  - Include UV Index from SMHI or OpenWeatherMap UV endpoint

- [ ] **Air Quality Index (AQI) widget**
  - Source: [OpenWeatherMap Air Pollution API](https://openweathermap.org/api/air-pollution) or Ambee
  - Show AQI, dominant pollutant (PM2.5 / NO₂), and a colour-coded health label

- [ ] **Commute Time widget**
  - Source: [Google Maps Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix)
  - Configurable home → destination; show current travel time vs. typical
  - Highlight "leave now" window when time is within threshold

---

## 3. Developer & Productivity Widgets

> Widgets that keep a builder's workflow front and centre.

- [ ] **GitHub Activity widget**
  - Source: [GitHub REST API](https://docs.github.com/en/rest)
  - Show contribution streak (calendar heatmap or streak counter)
  - Latest open issues / PRs across configured repos

- [ ] **System Health widget**
  - Source: small Node.js bridge (Express + `systeminformation` npm package) running on a home server / Raspberry Pi
  - Show CPU %, temperature, memory usage, disk free
  - Expose as a local `/api/health` endpoint; dashboard polls it

- [ ] **Website Uptime widget**
  - Source: [UptimeRobot API v2](https://uptimerobot.com/api/)
  - List personal project URLs with current status (Up / Down / Paused) and uptime %

---

## Recommended Free APIs (2026)

| Category         | API                  | Why                                                               |
|------------------|----------------------|-------------------------------------------------------------------|
| Stocks / Forex   | Alpha Vantage        | Best free tier for historical & real-time stock data              |
| Swedish Stocks   | Yahoo Finance (RapidAPI) | Most reliable for Nasdaq Stockholm tickers (`.ST` suffix)    |
| SEK Exchange     | Frankfurter API      | Free, no key — EUR/SEK and USD/SEK rates                          |
| Crypto           | CoinGecko            | Most reliable free source — 10 000+ coins, no key required        |
| Weather (Sweden) | SMHI Open Data       | Free, no key — highest accuracy for Swedish coordinates           |
| Weather (Global) | OpenWeatherMap       | "Gold Standard" for non-Swedish coordinates; OneCall 3.0          |
| Pollen (Sweden)  | Pollenkoll / Ambee   | Pollenkoll for Sweden-specific species; Ambee for global fallback  |
| Electricity      | Entso-E / elpriset-just-nu | Nord Pool spot prices per Swedish price zone (SE1–SE4)    |
| Public Transport | Trafiklab.se         | SL, Västtrafik, Skånetrafik real-time departures — free tier      |
| News             | NewsAPI.org          | Headline news filterable by category and keyword                  |
| Metals (Gold)    | GoldAPI.io           | Specialised spot prices for Gold, Silver, and Platinum            |
| Sports (Football)| API-Football         | Full Allsvenskan + Superettan coverage — 100 req/day free         |
| Ice Hockey (SHL) | Elite Prospects API  | SHL scores, standings, and player data                            |
| Sports (General) | TheSportsDB          | Multi-sport results and team data, free with no key               |
| Formula 1        | Jolpica F1 API       | Full F1 season data, free replacement for deprecated Ergast       |

---

## 4. Sports — Allsvenskan, SHL & Beyond

> Football and ice hockey are king in Sweden — prioritise Swedish leagues.

- [ ] **"Next Match" Countdown widget** *(Swedish priority)*
  - Configurable favourite team (AIK, Malmö FF, Djurgården, Färjestad BK, etc.)
  - Shows opponent, venue, and a live countdown to kick-off / puck drop
  - Source: API-Football for Allsvenskan (`league=113`); Sportradar or Elite Prospects for SHL

- [ ] **Allsvenskan Fixtures & Table widget** *(Swedish priority)*
  - Source: [API-Football](https://www.api-football.com/) — full Allsvenskan and Superettan coverage
  - Show current league standings table + this week's fixtures
  - Live score updates during matchdays (poll every 60 s, back off when idle)

- [ ] **SHL (Swedish Hockey League) widget** *(Swedish priority)*
  - Source: [Elite Prospects API](https://www.eliteprospects.com/api) or [Sportradar Ice Hockey API](https://developer.sportradar.com/hockey/)
  - Display upcoming games, live score, and current standings
  - Flash score cell on goal (reuse existing flash animation)

- [ ] **Live Score widget (general)**
  - Source: API-Football live endpoint or [TheSportsDB](https://www.thesportsdb.com/api.php) (free, no key for basic)
  - Highlight scorers and match minute

- [ ] **Results / Recent Form widget**
  - Source: API-Football `/fixtures?last=5`
  - Show last 5 results with W / D / L badges and scoreline
  - Mini form bar (e.g. `W W D L W`) coloured green / grey / red

- [ ] **Multi-sport stretch goals**
  - Formula 1: [Jolpica F1 API](https://api.jolpi.ca/ergast/) (free, replaces deprecated Ergast)
  - Basketball: [balldontlie API](https://www.balldontlie.io/) (free, no key)

---

## 5. Swedish Context Widgets

> Widgets that make the dashboard feel built *for Sweden* — highly requested locally.

- [ ] **Electricity Price (Spotpris) widget** *(High priority — very trending in Sweden)*
  - Source: [Entso-E Transparency Platform API](https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html) — free, requires registration for API key
  - Alternatively: [elpriset-just-nu.se API](https://www.elpriset-just-nu.se/) (Swedish community API, simpler)
  - Configurable price zone: **SE1** (Luleå), **SE2** (Sundsvall), **SE3** (Stockholm), **SE4** (Malmö)
  - Show today's and tomorrow's hourly spot price (öre/kWh) as a bar chart
  - Highlight cheapest and most expensive hours; show current hour's price prominently
  - Threshold alert styling: green when cheap, red when expensive

- [ ] **Public Transport Departures widget** *(High priority for Stockholm users)*
  - Source: [Trafiklab.se](https://www.trafiklab.se/) — provides APIs for SL, Västtrafik, Skånetrafik, and more
    - **SL Departures API** (ResRobot or SL Transport): real-time departures for any stop
    - No cost for basic usage after free registration
  - Configurable home station (stop ID)
  - Show next 5–10 departures with line number, destination, and minutes until departure
  - Highlight delayed departures in red; cancelled in strikethrough

- [ ] **Pollen Forecast widget** *(see also Section 2 — link into the same component)*
  - Covered in Section 2; surface here as a standalone widget option for the widget zone

---

## Implementation Notes

- Each widget should be a standalone Angular component lazy-loaded via `NgComponentOutlet` (same pattern as the existing widget zone).
- Add a new `PanelId` / `WidgetType` entry per widget; keep feature flags in a central `widget-catalog.ts`.
- API keys must **never** be committed — use environment variables injected via `app.config.ts` tokens (follow the existing `SUPABASE_TOKEN` pattern).
- Rate-limit awareness: Alpha Vantage free tier = 25 req/day; CoinGecko free = 30 req/min. Build a simple cache layer (RxJS `shareReplay` or a signal-based TTL cache) before wiring up auto-refresh.
- Information

https://www.ip2location.com/free/region-multilingual

---

## 6. n8n Data Pipeline — Architecture & Workflow Plan

> **Goal:** Replace manual/ad-hoc API calls with a reliable, scheduled data pipeline.
> n8n fetches from external APIs → transforms → upserts into Supabase → Supabase Realtime pushes to Angular automatically.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          n8n (self-hosted or cloud)                 │
│                                                                     │
│  Cron Trigger → HTTP Request → Code (transform) → Supabase Upsert  │
│                                     │                               │
│                              Error Handler                          │
│                            (activity_log)                           │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │  REST API (service_role key)
                                       ▼
                              ┌─────────────────┐
                              │    Supabase DB   │
                              │  stocks          │
                              │  currencies      │
                              │  precious_metals │
                              │  crypto          │
                              │  price_ticks     │
                              │  weather         │  ← new tables
                              │  electricity     │  ← new tables
                              │  sports_*        │  ← new tables
                              └────────┬─────────┘
                                       │  Supabase Realtime (WebSocket)
                                       ▼
                              Angular Dashboard
                              (already subscribed)
```

### n8n Setup Prerequisites

- [ ] Deploy n8n — options ranked by ease:
  1. **n8n Cloud** (free tier: 5 active workflows, 2 500 executions/month) — no ops overhead
  2. **Railway / Render** — `n8n` Docker image, free hobby tier
  3. **Self-hosted on a VPS / Raspberry Pi** — full control, no limits
- [ ] Add a single **Supabase credential** in n8n using the `service_role` key (Settings → API → `service_role`). This key bypasses RLS so n8n can write to all tables.
- [ ] Store all API keys as **n8n Credentials** (never hard-code them in workflow nodes).

---

### Workflow 1 — Market Prices: Stocks (OMXS30 + Global)

**Trigger:** Cron — every **5 min**, Mon–Fri 09:00–17:30 CET (Stockholm exchange hours)

**Steps:**
1. **HTTP Request** → Yahoo Finance via RapidAPI
   - Tickers: `^OMX`, `INVE-B.ST`, `VOLV-B.ST`, `EVO.ST`, `AAPL`, `TSLA`, `NVDA`
   - Endpoint: `GET /v8/finance/quote?symbols=<tickers>`
2. **Code node** — map response fields to the `stocks` table schema:
   ```js
   // fields: symbol, name, exchange, currency, price, change, change_percent,
   //         open, previous_close, high_24h, low_24h, volume, market_cap
   ```
3. **HTTP Request (Supabase upsert)** → `POST /rest/v1/stocks`
   - Header: `Prefer: resolution=merge-duplicates` (upsert on `symbol`)
4. **HTTP Request (Supabase insert)** → `POST /rest/v1/price_ticks`
   - Insert one tick row per symbol for sparkline history

**Error path:** On HTTP error → insert a row into `activity_log` with `level=error`.

---

### Workflow 2 — Forex: SEK Rates

**Trigger:** Cron — every **15 min**, 24/7

**Steps:**
1. **HTTP Request** → Frankfurter API (free, no key)
   - `GET https://api.frankfurter.app/latest?from=SEK&to=USD,EUR,GBP,NOK,DKK`
2. **Code node** — expand `rates` object into one row per pair:
   ```
   { base_currency: 'SEK', quote_currency: 'USD', rate: ... }
   ```
3. **Supabase upsert** → `currencies` table (unique on `base_currency, quote_currency`)

> Frankfurter updates once per trading day; 15 min polling is fine and free.

---

### Workflow 3 — Crypto Prices

**Trigger:** Cron — every **2 min**, 24/7 (crypto never sleeps)

**Steps:**
1. **HTTP Request** → CoinGecko (free, no key for basic)
   - `GET /api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,ripple&order=market_cap_desc`
2. **Code node** — map to `crypto` table schema
3. **Supabase upsert** → `crypto` table (unique on `symbol`)
4. **Supabase insert** → `price_ticks` (one row per coin, `asset_type = 'crypto'`)

> CoinGecko free tier: 30 req/min — 2-min cadence for 4 coins = safe.

---

### Workflow 4 — Precious Metals

**Trigger:** Cron — every **10 min**, Mon–Fri 08:00–22:00 CET

**Steps:**
1. **HTTP Request** → GoldAPI.io (free tier: 100 req/month → switch to daily polling on free tier)
   - `GET /api/v1/XAU/USD` (gold), `XAG` (silver), `XPT` (platinum), `XPD` (palladium)
   - Or: use **Metals.live** which offers 100 free req/day with no key
2. **Code node** — shape into `precious_metals` schema (`metal`, `unit = 'troy_oz'`, `currency = 'USD'`)
3. **Supabase upsert** → `precious_metals` (unique on `metal, unit, currency`)
4. **Supabase insert** → `price_ticks` (`asset_type = 'metal'`)

---

### Workflow 5 — Weather (SMHI primary · OpenWeatherMap fallback)

**Trigger:** Cron — every **30 min**, 24/7

**New Supabase table needed:**
```sql
create table if not exists weather (
  id            uuid        primary key default gen_random_uuid(),
  location_key  text        not null unique, -- e.g. 'stockholm', 'gothenburg'
  city          text        not null,
  provider      text        not null,        -- 'smhi' | 'owm'
  temperature   numeric(5,2),               -- °C
  feels_like    numeric(5,2),
  wind_speed    numeric(6,2),               -- m/s
  wind_dir      integer,                    -- degrees
  precipitation numeric(6,2),              -- mm/h
  condition     text,                       -- 'Clear', 'Rain', etc.
  icon_code     text,
  humidity      integer,
  forecast_json jsonb,                      -- next 12 h hourly array
  updated_at    timestamptz not null default now()
);
alter publication supabase_realtime add table weather;
```

**Steps:**
1. **HTTP Request** → SMHI Point Forecast (no key)
   - `GET https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/18.0686/lat/59.3293/data.json`
   - One request per configured city (Stockholm coords hardcoded, others configurable)
2. **Code node** — extract `t` (temp), `ws` (wind speed), `wd` (wind dir), `pmean` (precip), build `forecast_json` array
3. **IF node** — if SMHI returns error → fallback to OpenWeatherMap `onecall` endpoint
4. **Supabase upsert** → `weather` table (upsert on `location_key`)

---

### Workflow 6 — Electricity Spot Prices (Nord Pool / SE zones)

**Trigger:** Cron — once per day at **13:00 CET** (tomorrow's prices are published ~12:30)
Also run at **00:05** to capture today reliably.

**New Supabase table needed:**
```sql
create table if not exists electricity_prices (
  id          bigint generated always as identity primary key,
  price_zone  text        not null,   -- 'SE1' | 'SE2' | 'SE3' | 'SE4'
  hour_at     timestamptz not null,   -- start of the hour (UTC)
  price_ore   numeric(10,4) not null, -- öre/kWh (excl. VAT)
  unique (price_zone, hour_at)
);
alter publication supabase_realtime add table electricity_prices;
```

**Steps:**
1. **HTTP Request** → `https://www.elpriset-just-nu.se/api/v1/prices/{year}/{month}-{day}_{zone}.json`
   - Run once per zone: SE1, SE2, SE3, SE4
2. **Code node** — convert array of `{ time_start, SEK_per_kWh }` → multiply × 100 for öre, parse timestamp
3. **Supabase upsert** → `electricity_prices` (unique on `price_zone, hour_at`)

> elpriset-just-nu.se is a free community API maintained by the Swedish community; no key required.

---

### Workflow 7 — Sports: Allsvenskan (API-Football)

**Trigger:** Cron — every **60 s** on matchdays, otherwise daily at **07:00**

**New Supabase table needed:**
```sql
create table if not exists sports_fixtures (
  id            bigint        primary key,   -- external fixture ID
  league_id     integer       not null,
  season        integer       not null,
  home_team     text          not null,
  away_team     text          not null,
  home_score    integer,
  away_score    integer,
  status        text          not null,      -- 'NS' | '1H' | 'HT' | '2H' | 'FT'
  minute        integer,
  kickoff_at    timestamptz   not null,
  venue         text,
  updated_at    timestamptz   not null default now()
);
create table if not exists sports_standings (
  id            bigint generated always as identity primary key,
  league_id     integer       not null,
  season        integer       not null,
  team_name     text          not null,
  rank          integer       not null,
  played        integer,
  won           integer,
  drawn         integer,
  lost          integer,
  goals_for     integer,
  goals_against integer,
  points        integer,
  updated_at    timestamptz   not null default now(),
  unique (league_id, season, team_name)
);
alter publication supabase_realtime add table sports_fixtures;
alter publication supabase_realtime add table sports_standings;
```

**Steps:**
1. **HTTP Request** → API-Football `/fixtures?league=113&season=2026` (Allsvenskan)
2. **Code node** — shape to `sports_fixtures` schema
3. **Supabase upsert** → `sports_fixtures` (upsert on `id`)
4. Separate sub-workflow: standings via `/standings?league=113&season=2026` → `sports_standings`

> API-Football free tier: 100 req/day — run live-score polling only on matchdays using an **IF node** checking `kickoff_at` proximity.

---

### Workflow 8 — Error Logging

Every workflow should include a shared **error path**:

**Steps (on any node failure):**
1. **HTTP Request** → Supabase `POST /rest/v1/activity_log`
   ```json
   {
     "level": "error",
     "message": "{{ $workflow.name }} failed: {{ $json.error.message }}"
   }
   ```
   The Angular dashboard's existing `RealtimeActivityService` will surface this instantly via Supabase Realtime — you get free in-app error visibility.

---

### Scheduling Summary

| Workflow | API | Cadence | Table(s) |
|---|---|---|---|
| Stocks | Yahoo Finance / Alpha Vantage | 5 min (market hours) | `stocks`, `price_ticks` |
| Forex | Frankfurter | 15 min | `currencies` |
| Crypto | CoinGecko | 2 min | `crypto`, `price_ticks` |
| Metals | GoldAPI.io / Metals.live | 10 min (market hours) | `precious_metals`, `price_ticks` |
| Weather | SMHI + OWM | 30 min | `weather` |
| Electricity | elpriset-just-nu | Daily 13:00 + 00:05 | `electricity_prices` |
| Sports (live) | API-Football | 60 s on matchdays | `sports_fixtures` |
| Sports (standings) | API-Football | Daily 07:00 | `sports_standings` |
| Error logging | — | On failure | `activity_log` |

---

### Implementation Order (recommended)

- [ ] **Step 1 — n8n setup**: Deploy n8n, add Supabase `service_role` credential, add API key credentials
- [ ] **Step 2 — Crypto workflow**: Easiest — CoinGecko needs no key, table already exists
- [ ] **Step 3 — Forex workflow**: Frankfurter needs no key, `currencies` table already exists
- [ ] **Step 4 — Metals workflow**: `precious_metals` table already exists
- [ ] **Step 5 — Stocks workflow**: Needs RapidAPI key for Yahoo Finance
- [ ] **Step 6 — Create new SQL tables**: `weather`, `electricity_prices`, `sports_fixtures`, `sports_standings`
- [ ] **Step 7 — Weather workflow**: SMHI (no key) → good for testing Supabase upsert with new tables
- [ ] **Step 8 — Electricity workflow**: elpriset-just-nu (no key)
- [ ] **Step 9 — Sports workflow**: API-Football key required; add matchday IF-node logic
- [ ] **Step 10 — Angular widgets**: Wire up each new table with a Supabase Realtime subscription (follow `MarketDataService` pattern)
