# DASH-17 — Epic: Sports Widgets — Allsvenskan, SHL & Beyond

**Type:** Epic
**Priority:** High
**Status:** To Do
**Labels:** `sports`, `widget`, `frontend`, `swedish`

## Summary
Build a set of sports widgets covering Swedish football (Allsvenskan / Superettan), Swedish Hockey League (SHL), general live scores, and a next-match countdown for a configurable favourite team.

## Goal
Football and ice hockey are king in Sweden. Make it trivial to follow your team and the league table without leaving the dashboard.

---

## Stories

---

### DASH-18 — Next Match Countdown Widget

**Type:** Story
**Priority:** High
**Labels:** `sports`, `widget`, `countdown`, `swedish`
**Epic Link:** DASH-17

#### Summary
Show a live countdown to the next fixture for a user-configured favourite team, with opponent, venue, and competition details.

#### Acceptance Criteria
- [ ] Configurable favourite team (stored in localStorage); default: AIK
- [ ] Shows opponent name, home/away indicator, venue, and competition name
- [ ] Live countdown: `X days HH:MM:SS` updating every second
- [ ] On matchday (countdown < 0): switches to live score display with match minute
- [ ] Covers both Allsvenskan (football) and SHL (hockey) — competition type configurable
- [ ] Graceful "Season not started / No upcoming fixtures" state

#### Technical Notes
- **API (football):** API-Football — `GET /fixtures?team={teamId}&next=1`
- **API (hockey):** Elite Prospects API or Sportradar Ice Hockey API
- **n8n:** Workflow DASH-35 populates `sports_fixtures` table; widget reads from Supabase
- **Supabase table:** `sports_fixtures` (new — SQL in roadmap §6 Workflow 7)
- **Credentials needed:** API-Football key

---

### DASH-19 — Allsvenskan Fixtures & Table Widget

**Type:** Story
**Priority:** High
**Labels:** `sports`, `widget`, `football`, `allsvenskan`, `swedish`
**Epic Link:** DASH-17

#### Summary
Display the current Allsvenskan league standings table and this week's fixtures, with live score updates during matchdays.

#### Acceptance Criteria
- [ ] Full league standings table: rank, team, played, W/D/L, GF/GA, GD, points
- [ ] This week's fixtures shown below the table (date, home team vs away team, score/time)
- [ ] Live scores during matchdays: poll every 60 s when a game is in progress, back off to 5 min when idle
- [ ] Fixtures highlight the user's favourite team row/cell
- [ ] Standings update automatically when a match finishes via Supabase Realtime
- [ ] Toggle between Allsvenskan and Superettan (stretch goal)

#### Technical Notes
- **API:** API-Football
  - Standings: `GET /standings?league=113&season=2026` (Allsvenskan = league 113)
  - Fixtures: `GET /fixtures?league=113&season=2026&from={date}&to={date}`
  - Live: `GET /fixtures?live=all&league=113`
- **n8n:** DASH-35 handles both fixtures and standings upserts
- **Supabase tables:** `sports_fixtures`, `sports_standings` (new)
- **Credentials needed:** API-Football key

---

### DASH-20 — SHL (Swedish Hockey League) Widget

**Type:** Story
**Priority:** High
**Labels:** `sports`, `widget`, `hockey`, `shl`, `swedish`
**Epic Link:** DASH-17

#### Summary
Show SHL upcoming games, live scores, and current season standings, with a goal flash animation when a score changes.

#### Acceptance Criteria
- [ ] Current SHL standings: rank, team, GP, W, OTW, OTL, L, points
- [ ] Upcoming games for the next 7 days
- [ ] Live score display during games; score cells flash on goal (reuse existing flash animation pattern)
- [ ] Configurable favourite SHL team (same config as DASH-18)
- [ ] Graceful "Off-season" state (SHL season runs Oct–Apr typically)

#### Technical Notes
- **API:** Elite Prospects API (`https://api.eliteprospects.com/v1/`) or Sportradar Ice Hockey API
- **Elite Prospects free tier:** Limited — consider scraping public SHL schedule as a free alternative
- **Alternative free source:** SHL.se unofficial API or `https://api.shl.se` (community-maintained)
- **n8n:** Separate sub-workflow or extend DASH-35 to cover SHL fixtures in `sports_fixtures` (different `league_id`)

---

### DASH-21 — Live Score Widget (General)

**Type:** Story
**Priority:** Medium
**Labels:** `sports`, `widget`, `live-score`
**Epic Link:** DASH-17

#### Summary
A compact multi-sport live score feed showing in-progress matches with scorers, match minute, and competition name.

#### Acceptance Criteria
- [ ] Lists currently live matches across configured leagues (default: Allsvenskan + top 5 European leagues)
- [ ] Shows: home score, away score, match minute, goal scorer names (if available)
- [ ] Automatically appears when ≥1 match is live; shows "No live matches" otherwise
- [ ] Refreshes every 60 s; uses exponential backoff when no live matches detected
- [ ] Configurable league filter (stored in localStorage)

#### Technical Notes
- **API:** API-Football live endpoint — `GET /fixtures?live=all` (filters by league optional)
- **Alternative (free):** TheSportsDB — `https://www.thesportsdb.com/api/v1/json/3/eventslastseason.php?id={league}` (basic, no key)
- **n8n:** Does not need n8n — live polling directly from Angular service using RxJS `interval` + `switchMap`

---

### DASH-22 — Results / Recent Form Widget

**Type:** Story
**Priority:** Medium
**Labels:** `sports`, `widget`, `results`, `football`
**Epic Link:** DASH-17

#### Summary
Show the last 5 results for the user's configured team with W/D/L badges, scorelines, and a visual form bar.

#### Acceptance Criteria
- [ ] Last 5 results list: date, opponent, home/away, score, W/D/L badge
- [ ] Form bar rendered as 5 coloured pills: W (green) / D (grey) / L (red)
- [ ] Shows competition name per match (league, cup, etc.)
- [ ] Refreshes daily (results don't change intra-day)
- [ ] Falls back gracefully when fewer than 5 results are available

#### Technical Notes
- **API:** API-Football — `GET /fixtures?team={teamId}&last=5`
- **n8n:** DASH-35 can upsert last-N fixtures; widget queries `sports_fixtures` filtered by team and ordered by `kickoff_at desc`
- **Supabase table:** `sports_fixtures`

---

### DASH-23 — Multi-Sport Stretch Goals

**Type:** Story
**Priority:** Low
**Labels:** `sports`, `widget`, `f1`, `basketball`, `stretch`
**Epic Link:** DASH-17

#### Summary
Stretch-goal widgets for Formula 1 race results / standings and NBA/EuroLeague basketball scores.

#### Acceptance Criteria
- [ ] **F1 widget:** Current Drivers' Championship standings + next race countdown + last race result
- [ ] **Basketball widget:** Configured team's next game and recent form (NBA or EuroLeague)
- [ ] Both follow lazy-load widget pattern

#### Technical Notes
- **F1 API:** Jolpica F1 API — `https://api.jolpi.ca/ergast/f1/` (free, no key — community replacement for deprecated Ergast)
- **Basketball API:** balldontlie (NBA, free, no key) or EuroLeague unofficial API
