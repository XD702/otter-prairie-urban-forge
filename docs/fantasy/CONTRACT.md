# Go Birds Yahoo dump — Eastside ingest contract

**Schema owner:** Go Birds (proposed).  
**League:** League of Eastside Legends · Yahoo `f1.l.288732` / `288732` · Week 1.  
**Baseline UI data:** screenshot-seeded 12 rosters + Week 1 matchups in `league-data` (labels only).  
**This contract:** thin overlay for projected/actual when present — **never invent points**.

## Paths

| Environment | Path |
|---|---|
| Box (authoritative once built) | `/workspace/eastside/yahoo/league-288732-latest.json` |
| Vite / laptop (public asset) | `public/fantasy/league-288732-latest.json` |
| Fetch default (app) | `/fantasy/league-288732-latest.json` |

Refresh: UI button or remount re-fetches. Fail-soft: missing/invalid → blank/`—` for proj/actual; keep last-good if a prior fetch succeeded; never invent.

## Authoritative JSON shape

```json
{
  "leagueId": "288732",
  "leagueKey": "f1.l.288732",
  "pulledAt": "2026-09-10T02:00:00.000Z",
  "source": "yahoo",
  "settings": {},
  "teams": [
    {
      "teamId": "go-birds",
      "name": "Go birds D**k head",
      "manager": "Roberto",
      "roster": [
        {
          "name": "Dak Prescott",
          "pos": "QB",
          "nflTeam": "DAL",
          "slot": "start",
          "status": ""
        }
      ]
    }
  ],
  "matchups": [
    {
      "week": 1,
      "leftTeamId": "go-birds",
      "rightTeamId": "gibb-it-to-me-baby",
      "scores": {}
    }
  ],
  "standings": []
}
```

## Field notes

- `settings`: `{}` stub until Rob encodes Yahoo scoring. **Do not guess PPR.**
- `teams[].teamId`: prefer seed ids when possible (`go-birds`, `apache-dogs`, …). Yahoo numeric ids OK if name/manager can still match.
- `roster[].slot`: `"start"` | `"bench"` (IR may appear as status or future slot value — do not invent).
- `roster[]` has **no** required point fields today. Optional future keys (only when Go Birds emits them): `projectedPts`, `actualPts` as `number | null`. Missing → treat as `null`.
- `matchups[].scores`: `{}` or omit keys until available. Optional future keys (number | null only — never invent):
  - `leftProjected`, `leftActual`, `rightProjected`, `rightActual`
  - and/or per-player maps later — UI ignores unknown keys.
- `pulledAt`: ISO-8601 string, or `null` on stub.
- `standings`: array; may be empty.

## Status / fail-soft

| Situation | Behavior |
|---|---|
| File 404 / network error | `{ ok: false, reason }`; UI shows — ; keep last-good data if any |
| Valid JSON, empty `teams` | ok parse, no overlays; — for points |
| Partial scores | use numbers only when present; else null / — |
| Unknown player in dump | do not invent into seed; append only if full identity present (name + pos + nflTeam) and merge rules allow |

## Out of scope

- Do not replace screenshot seed with invented parallel league data.
- Do not ship sample dumps as live.
- Do not encode PPR / half-PPR without Rob.
