# DASH-27 — Epic: n8n Data Pipeline

**Type:** Epic
**Priority:** High
**Status:** To Do
**Labels:** `n8n`, `pipeline`, `infrastructure`, `supabase`

## Summary
Build and deploy the full n8n automation pipeline that fetches data from external APIs on a schedule, transforms it, and upserts it into Supabase tables. Supabase Realtime then pushes the data to the Angular dashboard automatically.

## Architecture
```
External API → n8n (Cron → HTTP → Code → Supabase upsert)
                                    ↓
                             Supabase DB
                                    ↓ Realtime WebSocket
                           Angular Dashboard
```

---

## Stories

---

### DASH-28 — n8n Infrastructure Setup

**Type:** Task
**Priority:** High
**Labels:** `n8n`, `infrastructure`, `devops`
**Epic Link:** DASH-27

#### Summary
Deploy n8n, configure the Supabase credential, and add all necessary API key credentials so workflows can be built against a live environment.

#### Acceptance Criteria
- [ ] n8n instance is running and accessible (cloud, Railway, Render, or self-hosted)
- [ ] Supabase credential added in n8n using the `service_role` key (bypasses RLS for writes)
- [ ] All external API keys added as named n8n Credentials (never hard-coded in workflow nodes):
  - RapidAPI key (Yahoo Finance)
  - Alpha Vantage API key
  - OpenWeatherMap API key
  - API-Football key
  - Trafiklab key (stretch)
- [ ] A shared **error workflow** is set up: on any node failure → insert into Supabase `activity_log` with `level = 'error'`
- [ ] n8n instance URL documented in team notes

#### Technical Notes
- **Recommended deployment order:**
  1. n8n Cloud (free tier: 5 active workflows, 2 500 executions/month) — fastest to start
  2. Railway — `n8n` Docker image, `$5/month` hobby plan, no execution limits
  3. Self-hosted VPS / Raspberry Pi — full control
- **Supabase credential:** Settings → API → copy `service_role` (secret) key
- **Security:** Never expose the `service_role` key in the Angular app; it is n8n-only

---

### DASH-29 — n8n Workflow: Stocks (OMXS30 + Global)

**Type:** Task
**Priority:** High
**Labels:** `n8n`, `workflow`, `stocks`, `finance`
**Epic Link:** DASH-27

#### Summary
Build the n8n workflow that fetches OMXS30 and global stock quotes from Yahoo Finance via RapidAPI every 5 minutes during Stockholm exchange hours and upserts the results into Supabase.

#### Acceptance Criteria
- [ ] Cron trigger: every 5 min, Mon–Fri 09:00–17:30 CET only
- [ ] Fetches: `^OMX`, `INVE-B.ST`, `VOLV-B.ST`, `EVO.ST`, `AAPL`, `TSLA`, `NVDA`
- [ ] Code node maps response to `stocks` table schema (symbol, name, exchange, currency, price, change, change_percent, open, previous_close, high_24h, low_24h, volume, market_cap)
- [ ] Supabase upsert to `stocks` with `Prefer: resolution=merge-duplicates`
- [ ] For each symbol: insert one row into `price_ticks` (`asset_type = 'stock'`, `symbol`, `price`, `tick_at = now()`)
- [ ] Error node: on failure → insert into `activity_log`

#### Technical Notes
- **API:** `GET https://yahoo-finance15.p.rapidapi.com/api/v8/finance/quote?symbols=^OMX,...`
- **Headers:** `X-RapidAPI-Key`, `X-RapidAPI-Host: yahoo-finance15.p.rapidapi.com`
- **Supabase REST:** `POST https://{project}.supabase.co/rest/v1/stocks` with `apikey` and `Authorization: Bearer <service_role_key>` headers
- **Credentials needed:** RapidAPI key, Supabase credential

---

### DASH-30 — n8n Workflow: Forex (SEK Rates)

**Type:** Task
**Priority:** High
**Labels:** `n8n`, `workflow`, `forex`, `currencies`
**Epic Link:** DASH-27

#### Summary
Build the n8n workflow that fetches SEK exchange rates from Frankfurter API every 15 minutes and upserts them into the `currencies` Supabase table.

#### Acceptance Criteria
- [ ] Cron trigger: every 15 min, 24/7
- [ ] Fetches `GET https://api.frankfurter.app/latest?from=SEK&to=USD,EUR,GBP,NOK,DKK`
- [ ] Code node expands the `rates` object into one item per currency pair: `{ base_currency: 'SEK', quote_currency: 'USD', rate: X }`
- [ ] Supabase upsert to `currencies` (unique on `base_currency, quote_currency`)
- [ ] Error node on failure

#### Technical Notes
- **API:** Frankfurter is free, no API key — simplest workflow to build first
- **Note:** Frankfurter updates rates once per trading day; 15-min polling is harmless (same response until next day)

---

### DASH-31 — n8n Workflow: Crypto Prices

**Type:** Task
**Priority:** High
**Labels:** `n8n`, `workflow`, `crypto`
**Epic Link:** DASH-27

#### Summary
Build the n8n workflow that fetches crypto market data from CoinGecko every 2 minutes and upserts into `crypto` and `price_ticks`.

#### Acceptance Criteria
- [ ] Cron trigger: every 2 min, 24/7
- [ ] Fetches `GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,ripple&order=market_cap_desc&per_page=10&page=1&sparkline=false`
- [ ] Code node maps to `crypto` schema (symbol, name, price_usd, change_24h, change_percent_24h, high_24h, low_24h, volume_24h, market_cap, market_cap_rank, circulating_supply)
- [ ] Supabase upsert to `crypto` (unique on `symbol`)
- [ ] Insert one row per coin into `price_ticks` (`asset_type = 'crypto'`)
- [ ] Error node on failure
- [ ] Rate limit guard: confirm 30-req/min CoinGecko limit is respected (2-min cadence × 1 request = safe)

#### Technical Notes
- **API:** CoinGecko free tier — no API key required for basic endpoints
- **Schema note:** CoinGecko returns `id` (e.g. `bitcoin`) not symbol; Code node must map `id → symbol` (BTC, ETH, etc.)

---

### DASH-32 — n8n Workflow: Precious Metals

**Type:** Task
**Priority:** Medium
**Labels:** `n8n`, `workflow`, `metals`, `finance`
**Epic Link:** DASH-27

#### Summary
Build the n8n workflow that fetches gold, silver, platinum, and palladium spot prices every 10 minutes during market hours and upserts into `precious_metals` and `price_ticks`.

#### Acceptance Criteria
- [ ] Cron trigger: every 10 min, Mon–Fri 08:00–22:00 CET
- [ ] Fetches XAU (gold), XAG (silver), XPT (platinum), XPD (palladium) in USD
- [ ] Code node maps to `precious_metals` schema (metal, unit = `troy_oz`, currency = `USD`, price, change, change_percent, bid, ask, high_24h, low_24h)
- [ ] Supabase upsert to `precious_metals` (unique on `metal, unit, currency`)
- [ ] Insert one row per metal into `price_ticks` (`asset_type = 'metal'`)
- [ ] Error node on failure

#### Technical Notes
- **API option 1:** GoldAPI.io — free tier 100 req/month; switch to once-daily if free tier is insufficient
- **API option 2:** Metals.live — 100 free req/day, no key required (preferred for free tier)
  - `GET https://metals.live/api/spot` — returns all four metals in one call
- **Credentials needed:** GoldAPI.io key (if using GoldAPI)

---

### DASH-33 — n8n Workflow: Weather

**Type:** Task
**Priority:** High
**Labels:** `n8n`, `workflow`, `weather`, `smhi`
**Epic Link:** DASH-27

#### Summary
Build the n8n workflow that fetches weather forecasts from SMHI (primary) or OpenWeatherMap (fallback) every 30 minutes and upserts into the `weather` Supabase table.

#### Acceptance Criteria
- [ ] Cron trigger: every 30 min, 24/7
- [ ] One execution per configured city (starting with Stockholm lat=59.3293, lon=18.0686)
- [ ] Primary: `GET https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json`
- [ ] IF node: if SMHI returns non-2xx → switch to OpenWeatherMap OneCall 3.0 fallback
- [ ] Code node extracts: `t` (temp), `ws` (wind speed), `wd` (wind dir), `pmean` (precip), `Wsymb2` (condition), builds `forecast_json` as 12-element array
- [ ] Supabase upsert to `weather` (unique on `location_key`)
- [ ] Error node on failure
- [ ] **Prerequisite:** `weather` Supabase table must be created first (SQL in roadmap §6)

#### Technical Notes
- **SMHI parameters of interest:** `t` (temp °C), `ws` (wind m/s), `wd` (wind deg), `pmean` (precip mm/h), `r` (humidity %), `Wsymb2` (weather symbol code 1–27)
- **Credentials needed:** OpenWeatherMap API key (for fallback only)

---

### DASH-34 — n8n Workflow: Electricity Spot Prices

**Type:** Task
**Priority:** High
**Labels:** `n8n`, `workflow`, `electricity`, `swedish`
**Epic Link:** DASH-27

#### Summary
Build the n8n workflow that fetches tomorrow's Nord Pool spot prices for SE1–SE4 zones every day at 13:00 CET (and today's at 00:05) and upserts into `electricity_prices`.

#### Acceptance Criteria
- [ ] Cron trigger 1: daily at 13:00 CET → fetch **tomorrow's** prices for all 4 zones
- [ ] Cron trigger 2: daily at 00:05 CET → fetch **today's** prices (safety net)
- [ ] For each zone (SE1, SE2, SE3, SE4): `GET https://www.elpriset-just-nu.se/api/v1/prices/{YYYY}/{MM-DD}_{zone}.json`
- [ ] Code node converts `SEK_per_kWh` → öre (× 100), parses `time_start` as UTC timestamptz
- [ ] Supabase upsert to `electricity_prices` (unique on `price_zone, hour_at`)
- [ ] Error node on failure
- [ ] **Prerequisite:** `electricity_prices` Supabase table must be created first (SQL in roadmap §6)

#### Technical Notes
- **API:** elpriset-just-nu.se — free, no key, community-maintained
- **Date format in URL:** `YYYY/MM-DD` e.g. `2026/03-24`
- **Zone suffix in URL:** `SE1`, `SE2`, `SE3`, `SE4`
- Each request returns an array of 24 objects `{ time_start, time_end, SEK_per_kWh, EUR_per_kWh }`

---

### DASH-35 — n8n Workflow: Sports (Allsvenskan)

**Type:** Task
**Priority:** High
**Labels:** `n8n`, `workflow`, `sports`, `allsvenskan`
**Epic Link:** DASH-27

#### Summary
Build the n8n workflow that syncs Allsvenskan fixtures (with live scores on matchdays) and standings from API-Football into Supabase.

#### Acceptance Criteria
- [ ] **Fixtures workflow:** Cron — every 60 s on matchdays (IF node checks whether a game is currently live); otherwise daily at 07:00
- [ ] **Standings workflow:** Cron — daily at 07:00; runs after matches complete
- [ ] Fixtures: `GET /fixtures?league=113&season=2026` → upsert `sports_fixtures` (upsert on `id`)
- [ ] Live: `GET /fixtures?live=all&league=113` → upsert same table
- [ ] Standings: `GET /standings?league=113&season=2026` → upsert `sports_standings` (unique on `league_id, season, team_name`)
- [ ] Error node on failure
- [ ] **Prerequisite:** `sports_fixtures` and `sports_standings` Supabase tables must be created first (SQL in roadmap §6)

#### Technical Notes
- **API:** API-Football — `https://api-football-v1.p.rapidapi.com/v3/`
- **Free tier:** 100 req/day — live polling must be gated by the IF-node matchday check to stay within quota
- **Matchday detection:** IF node — check if any `sports_fixtures` row has `kickoff_at` within `now() ± 120 min` and `status != 'FT'`
- **Credentials needed:** API-Football key (via RapidAPI or direct)

---

### DASH-36 — n8n Workflow: Error Logging

**Type:** Task
**Priority:** Medium
**Labels:** `n8n`, `workflow`, `logging`, `observability`
**Epic Link:** DASH-27

#### Summary
Add a shared error-handler pattern to every workflow so failures are automatically surfaced in the Angular dashboard's existing activity feed via Supabase Realtime.

#### Acceptance Criteria
- [ ] Every workflow (DASH-29 through DASH-35) has an Error Trigger node connected to a Supabase HTTP Request node
- [ ] Error payload: `{ level: 'error', message: '<WorkflowName> failed: <error.message>' }`
- [ ] Inserts into `activity_log` table via Supabase REST API
- [ ] The Angular `RealtimeActivityService` (already built) surfaces the error in the activity widget automatically
- [ ] Error entries are visible within 5 s of workflow failure (Supabase Realtime latency)

#### Technical Notes
- **Supabase table:** `activity_log` (already exists — used by the existing activity widget)
- **n8n node:** `Error Trigger` → `HTTP Request` (POST to `/rest/v1/activity_log`)
- **Pattern:** Build this once as a sub-workflow and call it via `Execute Workflow` node from each parent workflow
