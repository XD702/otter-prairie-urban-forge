# HOWTO — Go Birds Yahoo dump → Eastside Prototype

One-pager for dropping the league JSON so Roster shows proj/actual when present.

## 1. Write the file

**Box (authoritative):**

`/workspace/eastside/yahoo/league-288732-latest.json`

**Laptop Vite public asset (copy for the app):**

`public/fantasy/league-288732-latest.json`

Overwrite in place. App fetches `/fantasy/league-288732-latest.json` by default.

## 2. Required top-level fields

- `leagueId`: `"288732"`
- `leagueKey`: `"f1.l.288732"`
- `pulledAt`: ISO-8601 (or null only on empty stub)
- `source`: `"yahoo"`
- `settings`: `{}` until Rob confirms scoring — **do not guess PPR**
- `teams`: array (may be empty)
- `matchups`: array (may be empty)
- `standings`: array (may be empty)

## 3. Team ids (match seed when possible)

```
apache-dogs
cheesehead-hooligans
cheese-me
gibb-it-to-me-baby
go-birds
goodwrench
juice-booze
such-a-burden
taylor-gang
tds-in-yo-face
wstd-mngmnt
zenahc-cool-arrows
```

Default left-rail team: **go-birds** / Roberto.

## 4. Roster rows

Each `teams[].roster[]` item:

| Field | Notes |
|---|---|
| `name` | Yahoo display name |
| `pos` | QB/RB/WR/TE/K/DEF etc. |
| `nflTeam` | NFL abbr as Yahoo shows it |
| `slot` | `"start"` or `"bench"` |
| `status` | injury string or `""` |

Optional later (only if emitted — never invent): `projectedPts`, `actualPts` as number or null.

## 5. Matchups / scores

```json
{ "week": 1, "leftTeamId": "go-birds", "rightTeamId": "…", "scores": {} }
```

Until `scores` has real numbers, UI shows **—**. Optional keys when ready: `leftProjected`, `leftActual`, `rightProjected`, `rightActual` (number | null).

## 6. Do not

- Invent player points or fill scores with guesses
- Replace screenshot seed names with “corrected” data
- Ship a sample file as the live public JSON
- Touch Wellness / Loco

## 7. Verify

1. Drop JSON → hard refresh Prototype  
2. Roster footer: `Scrape: {pulledAt} · ok` (or empty/error)  
3. Proj/actual show numbers only when present; otherwise —
