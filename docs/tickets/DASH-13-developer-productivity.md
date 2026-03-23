# DASH-13 — Epic: Developer & Productivity Widgets

**Type:** Epic
**Priority:** Medium
**Status:** To Do
**Labels:** `developer`, `productivity`, `widget`, `frontend`

## Summary
Build widgets that surface developer-relevant information: GitHub activity, local system health, and website uptime monitoring.

## Goal
Keep a builder's workflow front and centre — commit streaks, system resource usage, and uptime status visible without switching tabs.

---

## Stories

---

### DASH-14 — GitHub Activity Widget

**Type:** Story
**Priority:** Medium
**Labels:** `developer`, `widget`, `github`
**Epic Link:** DASH-13

#### Summary
Show the authenticated user's GitHub contribution streak, a contribution heatmap (or streak counter), and the latest open issues / PRs across configured repositories.

#### Acceptance Criteria
- [ ] Displays current contribution streak (consecutive days with ≥1 contribution)
- [ ] Heatmap or sparkline showing contributions over the last 30 days
- [ ] Lists the 5 most recently updated open issues across configured repos
- [ ] Lists the 5 most recently updated open PRs across configured repos
- [ ] Configurable list of repos (stored in localStorage or app config)
- [ ] Uses GitHub token for auth (avoids 60 req/hour unauthenticated limit)
- [ ] Refreshes every 15 min

#### Technical Notes
- **API:** GitHub REST API (`https://api.github.com`) — 5 000 req/hour with a personal access token
  - Contributions: `GET /users/{user}/events` (public) or GraphQL `contributionsCollection`
  - Issues/PRs: `GET /repos/{owner}/{repo}/issues?state=open&sort=updated`
- **Auth:** GitHub Personal Access Token with `repo` and `read:user` scopes — store as an Angular injection token (never commit)
- **Implementation:** Direct Angular service, no n8n needed (GitHub rate limits are generous)

---

### DASH-15 — System Health Widget

**Type:** Story
**Priority:** Low
**Labels:** `developer`, `widget`, `system`, `self-hosted`
**Epic Link:** DASH-13

#### Summary
Display real-time CPU usage, temperature, memory usage, and disk free space sourced from a lightweight local Node.js bridge running on a home server or Raspberry Pi.

#### Acceptance Criteria
- [ ] Shows: CPU % usage, CPU temperature (°C), RAM used/total (GB), disk free/total (GB)
- [ ] Color-code thresholds: green (normal) / amber (>80%) / red (>90%)
- [ ] Falls back gracefully to "Server offline" when the bridge is unreachable (HTTP timeout < 3 s)
- [ ] Refreshes every 30 s
- [ ] Configurable bridge URL (stored in app config / localStorage)

#### Technical Notes
- **Backend:** Small Express.js server using the `systeminformation` npm package
  - Exposes `GET /api/health` returning `{ cpu, temp, memory, disk }`
  - Run via `pm2` on Raspberry Pi or home server
- **CORS:** Must allow the dashboard origin
- **Security:** Should only be accessible over local network or a Tailscale/VPN tunnel — never expose to public internet
- **Implementation:** Direct poll from Angular `HttpClient` — no Supabase or n8n layer needed

---

### DASH-16 — Website Uptime Widget

**Type:** Story
**Priority:** Low
**Labels:** `developer`, `widget`, `uptime`, `monitoring`
**Epic Link:** DASH-13

#### Summary
List configured personal project URLs with their current uptime status (Up / Down / Paused) and overall uptime percentage over the last 30 days.

#### Acceptance Criteria
- [ ] Shows each monitored URL with: status badge, uptime %, last checked timestamp
- [ ] Status badge: 🟢 Up / 🔴 Down / ⏸ Paused
- [ ] Uptime % displayed as a progress bar (colour-coded: >99% green, >95% yellow, <95% red)
- [ ] Configurable list of monitors (matched by UptimeRobot monitor IDs stored in app config)
- [ ] Refreshes every 5 min
- [ ] "Down" monitors sorted to the top of the list

#### Technical Notes
- **API:** UptimeRobot API v2 — `POST https://api.uptimerobot.com/v2/getMonitors` with `api_key`
  - Payload: `{ api_key, monitors: "id1-id2-id3", response_times: 1, logs: 0 }`
  - Free tier: up to 50 monitors, 5-min check interval
- **Credentials needed:** UptimeRobot API key (read-only key is sufficient)
- **Implementation:** Direct Angular service call every 5 min; no n8n or Supabase layer needed
