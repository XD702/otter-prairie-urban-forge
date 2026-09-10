/**
 * Go Birds DraftKings Week-1 odds dump — types + fail-soft parse.
 *
 * Source of truth: public/odds/week1-latest.json (synced from
 * /workspace/eastside/odds/week1-latest.json). Never invent lines or juice.
 *
 * PROTOTYPE · simulation only · no real money.
 */

export interface GoBirdsDumpGame {
  away: string;
  home: string;
  slug?: string | null;
  eventId?: string | null;
  spread_away: number | null;
  spread_away_juice: number | null;
  spread_home: number | null;
  spread_home_juice: number | null;
  total: number | null;
  over_juice: number | null;
  under_juice: number | null;
  ml_away: number | null;
  ml_home: number | null;
  live: boolean;
}

export interface GoBirdsOddsDump {
  pulledAt: string | null;
  timezoneNote?: string | null;
  source: string | null;
  book: string | null;
  sourceUrl?: string | null;
  scrapedVia?: string | null;
  rawPath?: string | null;
  note?: string | null;
  games: GoBirdsDumpGame[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Accept finite numbers only. Missing / non-numeric → null (never invent). */
export function numOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseGame(raw: unknown): GoBirdsDumpGame | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const away = str(rec.away);
  const home = str(rec.home);
  if (!away || !home) return null;
  return {
    away,
    home,
    slug: str(rec.slug),
    eventId: str(rec.eventId),
    spread_away: numOrNull(rec.spread_away),
    spread_away_juice: numOrNull(rec.spread_away_juice),
    spread_home: numOrNull(rec.spread_home),
    spread_home_juice: numOrNull(rec.spread_home_juice),
    total: numOrNull(rec.total),
    over_juice: numOrNull(rec.over_juice),
    under_juice: numOrNull(rec.under_juice),
    ml_away: numOrNull(rec.ml_away),
    ml_home: numOrNull(rec.ml_home),
    live: rec.live === true,
  };
}

/**
 * Parse unknown JSON into a dump. Returns null if the payload is not a
 * recognizable dump (missing games array). Individual bad games are skipped.
 */
export function parseGoBirdsOddsDump(raw: unknown): GoBirdsOddsDump | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  if (!Array.isArray(rec.games)) return null;
  const games = asArray(rec.games)
    .map(parseGame)
    .filter((g): g is GoBirdsDumpGame => g !== null);
  return {
    pulledAt: str(rec.pulledAt),
    timezoneNote: str(rec.timezoneNote),
    source: str(rec.source),
    book: str(rec.book),
    sourceUrl: str(rec.sourceUrl),
    scrapedVia: str(rec.scrapedVia),
    rawPath: str(rec.rawPath),
    note: str(rec.note),
    games,
  };
}
