# DASH-1 — Epic: Finance & Market Intelligence Widgets

**Type:** Epic
**Priority:** High
**Status:** To Do
**Labels:** `finance`, `widget`, `frontend`

## Summary
Build a suite of finance widgets covering Nasdaq Stockholm (OMXS30), SEK exchange rates, crypto sentiment, on-chain whale activity, stock technical signals, and Ethereum gas prices.

## Goal
Give the dashboard a live financial overview with a Swedish-market-first perspective, layering in global intelligence as secondary context.

---

## Stories

---

### DASH-2 — OMXS30 Index Widget

**Type:** Story
**Priority:** High
**Labels:** `finance`, `widget`, `stocks`, `swedish`
**Epic Link:** DASH-1

#### Summary
Display the OMXS30 index level, daily change %, and a mini sparkline for the session alongside major Swedish stock tickers.

#### Description
Users should see the OMXS30 index level at a glance, know whether it's up or down today, and follow 3–4 key Swedish blue-chips without leaving the dashboard.

#### Acceptance Criteria
- [ ] Shows current OMXS30 index value and daily Δ / Δ%
- [ ] Mini sparkline chart renders the intraday session (at least 20 data points)
- [ ] Tracks Investor AB (`INVE-B.ST`), Volvo B (`VOLV-B.ST`), Evolution (`EVO.ST`)
- [ ] Values auto-refresh during Stockholm exchange hours (09:00–17:30 CET)
- [ ] Positive change rendered in green, negative in red
- [ ] Widget follows the existing lazy-load pattern via `NgComponentOutlet`

#### Technical Notes
- **API:** Yahoo Finance via RapidAPI — ticker `^OMX` for index; `.ST` suffix for Stockholm tickers
- **n8n:** Workflow DASH-29 feeds the `stocks` Supabase table; widget subscribes via Realtime
- **Supabase table:** `stocks` (already exists)
- **Credentials needed:** RapidAPI key for Yahoo Finance

---

### DASH-3 — SEK Exchange Rate Widget

**Type:** Story
**Priority:** High
**Labels:** `finance`, `widget`, `forex`, `swedish`
**Epic Link:** DASH-1

#### Summary
Display live SEK/USD and SEK/EUR rates with daily change, with a highlight when volatility exceeds 1%.

#### Description
SEK can be volatile. A clear rate widget helps users understand cost of living, travel budgets, and cross-border transactions at a glance.

#### Acceptance Criteria
- [ ] Shows SEK/USD and SEK/EUR with current rate and daily Δ%
- [ ] Rate cell flashes / turns amber when daily Δ% exceeds ±1%
- [ ] Optionally show SEK/GBP, SEK/NOK, SEK/DKK (configurable)
- [ ] Refreshes every 15 min
- [ ] Graceful "offline" state when Supabase is unavailable

#### Technical Notes
- **API:** Frankfurter API (`https://api.frankfurter.app/`) — free, no key
- **n8n:** Workflow DASH-30 upserts into `currencies` table
- **Supabase table:** `currencies` (already exists)

---

### DASH-4 — Fear & Greed Index Widget

**Type:** Story
**Priority:** Medium
**Labels:** `finance`, `widget`, `crypto`, `sentiment`
**Epic Link:** DASH-1

#### Summary
Show the current crypto market Fear & Greed Index as a visual gauge with a text label and historical context.

#### Acceptance Criteria
- [ ] Gauge or arc visualization showing 0–100 score
- [ ] Text label: Extreme Fear / Fear / Neutral / Greed / Extreme Greed
- [ ] Show yesterday's and last-week's score for context
- [ ] Refreshes daily (index updates once per day)
- [ ] Color-codes: red (fear) → yellow (neutral) → green (greed)

#### Technical Notes
- **API:** Alternative.me — `GET https://api.alternative.me/fng/?limit=7` (free, no key)
- **n8n:** Small daily workflow or direct HTTP from Angular (low rate limit risk)
- Can bypass Supabase and call API directly from Angular if preferred (1 req/day is trivial)

---

### DASH-5 — Whale Alert Feed Widget

**Type:** Story
**Priority:** Low
**Labels:** `finance`, `widget`, `crypto`, `on-chain`
**Epic Link:** DASH-1

#### Summary
Display a real-time scrolling feed of large on-chain cryptocurrency transactions, highlighting direction (exchange in/out, wallet-to-wallet).

#### Acceptance Criteria
- [ ] Shows latest 10 whale transactions with: asset, amount (USD value), from/to type, timestamp
- [ ] Direction badge: "→ Exchange" (red), "← Exchange" (green), "Wallet → Wallet" (grey)
- [ ] Auto-scrolls new entries to the top
- [ ] Configurable minimum USD threshold (default: $1 M)
- [ ] Falls back to "No recent whale activity" when feed is empty

#### Technical Notes
- **API:** Whale Alert API (`https://api.whale-alert.io/v1/transactions`) — paid tier required for real-time; free tier limited to 1-hour delay
- **Alternative:** Store webhook events from Whale Alert into Supabase `activity_log` and surface them
- **Credentials needed:** Whale Alert API key

---

### DASH-6 — Stock Technical Signals Widget

**Type:** Story
**Priority:** Medium
**Labels:** `finance`, `widget`, `stocks`, `signals`
**Epic Link:** DASH-1

#### Summary
Show Buy / Hold / Sell technical signals for configured tickers, derived from RSI and SMA 50 / SMA 200 crossovers.

#### Acceptance Criteria
- [ ] Displays signal label (Buy / Hold / Sell) and the RSI value (0–100)
- [ ] Shows SMA 50 vs SMA 200 relationship ("Golden Cross" / "Death Cross" / "Neutral")
- [ ] Configurable list of tickers (defaults: `^OMX`, `BTC`, `AAPL`)
- [ ] Signal updates daily (end-of-day data is sufficient)
- [ ] Tooltip explains the signal logic on hover

#### Technical Notes
- **API:** Alpha Vantage — `TECHNICAL_INDICATORS` endpoint (RSI, SMA)
- **Free tier limit:** 25 req/day — compute signals server-side in n8n and store results in a new `technical_signals` Supabase table
- **Credentials needed:** Alpha Vantage API key

---

### DASH-7 — Gas Tracker Widget

**Type:** Story
**Priority:** Low
**Labels:** `finance`, `widget`, `crypto`, `ethereum`
**Epic Link:** DASH-1

#### Summary
Display real-time Ethereum gas prices (Gwei) for Slow, Standard, and Fast transaction speeds. Stretch: Bitcoin mempool fee rate.

#### Acceptance Criteria
- [ ] Shows three tiers: Slow / Standard / Fast with Gwei values
- [ ] Estimated wait time label per tier (e.g. "< 30 s")
- [ ] Color-codes: green (low gas) → red (high gas) relative to 30-day average
- [ ] Refreshes every 30–60 s
- [ ] Stretch: BTC mempool sat/vByte rates via `mempool.space/api/v1/fees/recommended`

#### Technical Notes
- **API (ETH):** Etherscan Gas Oracle — `https://api.etherscan.io/api?module=gastracker&action=gasoracle` (free, basic usage no key)
- **API (BTC):** mempool.space — `https://mempool.space/api/v1/fees/recommended` (free, no key)
- Both APIs can be called directly from Angular (low frequency, no sensitive data)
