import { n as SNAPSHOT_BOARD, r as isTeamAbbr } from "./snapshot-W7Ccjznp.mjs";
import { r as unavailableScoreBoard } from "./types-Be1OvKfo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/espn.server-iNG1eCHb.js
/**
* Map ESPN public scoreboard JSON onto ScoreBoard.
* Do not invent scores. Pregame 0–0 is treated as not posted.
*
* PROTOTYPE. Swap this mapper if the ESPN payload shape changes.
*/
var ESPN_ABBR = {
	WSH: "WAS",
	WAS: "WAS",
	GNB: "GB",
	GB: "GB",
	JAC: "JAX",
	JAX: "JAX",
	ARZ: "ARI",
	ARI: "ARI",
	NWE: "NE",
	NE: "NE",
	NOR: "NO",
	NO: "NO",
	SFO: "SF",
	SF: "SF",
	TAM: "TB",
	TB: "TB",
	KAN: "KC",
	KC: "KC",
	LVR: "LV",
	LV: "LV",
	LAR: "LAR",
	LAC: "LAC"
};
function asRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function asArray(value) {
	return Array.isArray(value) ? value : [];
}
function str(value) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}
function num(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
function mapEspnAbbr(raw) {
	if (!raw) return null;
	const key = raw.toUpperCase();
	if (ESPN_ABBR[key]) return ESPN_ABBR[key];
	return isTeamAbbr(key) ? key : null;
}
function slateGameId(home, away) {
	const hit = SNAPSHOT_BOARD.games.find((game) => game.home === home && game.away === away);
	if (hit) return hit.id;
	const flip = SNAPSHOT_BOARD.games.find((game) => game.neutralSite && game.home === away && game.away === home);
	if (flip) return flip.id;
	return `espn-${away}-${home}`;
}
function extractEvents(root) {
	try {
		const rec = asRecord(root);
		const preferred = [
			asArray(asRecord(asRecord(rec?.content)?.sbData)?.events),
			asArray(asRecord(rec?.sbData)?.events),
			asArray(rec?.events),
			asArray(asRecord(asArray(asRecord(asArray(rec?.sports)[0])?.leagues)[0])?.events)
		];
		for (const list of preferred) if (list.length > 0) return list;
		const seen = /* @__PURE__ */ new Set();
		const found = [];
		const walk = (node, depth) => {
			if (depth > 8 || node === null || typeof node !== "object") return;
			if (seen.has(node)) return;
			seen.add(node);
			if (Array.isArray(node)) {
				if (node.length > 0 && node.every((item) => {
					const row = asRecord(item);
					return row !== null && "competitions" in row;
				})) {
					found.push(...node);
					return;
				}
				for (const item of node) walk(item, depth + 1);
				return;
			}
			for (const value of Object.values(node)) walk(value, depth + 1);
		};
		walk(root, 0);
		return found;
	} catch {
		return [];
	}
}
function mapEvent(raw) {
	const event = asRecord(raw);
	if (!event) return null;
	const competition = asRecord(asArray(event.competitions)[0]) ?? event;
	const competitors = asArray(competition.competitors);
	let homeAbbr = null;
	let awayAbbr = null;
	let homeRaw = null;
	let awayRaw = null;
	for (const item of competitors) {
		const rec = asRecord(item);
		if (!rec) continue;
		const abbr = mapEspnAbbr(str(asRecord(rec.team)?.abbreviation));
		if (!abbr) continue;
		const side = str(rec.homeAway);
		if (side === "home") {
			homeAbbr = abbr;
			homeRaw = num(rec.score);
		} else if (side === "away") {
			awayAbbr = abbr;
			awayRaw = num(rec.score);
		}
	}
	if (!homeAbbr || !awayAbbr) return null;
	const status = asRecord(competition.status) ?? asRecord(event.status);
	const type = asRecord(status?.type);
	const state = (str(type?.state) ?? "").toLowerCase();
	const completed = type?.completed === true || state === "post";
	const inProgress = state === "in";
	let phase = "pending";
	if (completed) phase = "final";
	const homeScore = inProgress || completed ? homeRaw : null;
	const awayScore = inProgress || completed ? awayRaw : null;
	const period = num(status?.period);
	let quarter = null;
	if (inProgress || completed) {
		if (period !== null && period > 4) quarter = period === 5 ? "OT" : `OT${period - 4}`;
		else if (period !== null && period > 0) quarter = `Q${period}`;
		else if (completed) quarter = "Final";
	}
	const clock = inProgress ? str(status?.displayClock) : null;
	return {
		gameId: slateGameId(homeAbbr, awayAbbr),
		home: homeAbbr,
		away: awayAbbr,
		homeScore,
		awayScore,
		phase,
		inProgress,
		clock,
		quarter
	};
}
function mapEspnScoreboard(payload) {
	try {
		const events = extractEvents(payload);
		const games = [];
		const seen = /* @__PURE__ */ new Set();
		for (const event of events) try {
			const mapped = mapEvent(event);
			if (!mapped || seen.has(mapped.gameId)) continue;
			seen.add(mapped.gameId);
			games.push(mapped);
		} catch {}
		if (games.length === 0) return {
			status: "unavailable",
			reason: "Scores unavailable",
			asOf: (/* @__PURE__ */ new Date()).toISOString(),
			games: []
		};
		return {
			status: "ready",
			reason: null,
			asOf: (/* @__PURE__ */ new Date()).toISOString(),
			games
		};
	} catch {
		return {
			status: "error",
			reason: "Scores unavailable",
			asOf: null,
			games: []
		};
	}
}
/**
* Server-only ESPN public scoreboard fetch.
*
* Unofficial feed. Can break or change without notice.
* Every call is try/caught — never throw to the UI.
*
* Contracted source (no API key):
*   https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
*
* PROTOTYPE. Production: paid live feed + Supabase.
*/
var ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
var ESPN_URLS = [
	ESPN_SCOREBOARD_URL,
	`${ESPN_SCOREBOARD_URL}?limit=50&seasontype=2`,
	"https://cdn.espn.com/core/nfl/scoreboard?xhr=1"
];
var HEADERS = {
	Accept: "application/json,text/plain,*/*",
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
	Referer: "https://www.espn.com/nfl/scoreboard",
	Origin: "https://www.espn.com"
};
var TIMEOUT_MS = 1e4;
async function getJson(url) {
	const res = await fetch(url, {
		headers: HEADERS,
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});
	if (!res.ok) throw new Error(`ESPN HTTP ${res.status}`);
	try {
		return await res.json();
	} catch {
		throw new Error("ESPN payload was not JSON");
	}
}
async function fetchEspnBoard() {
	try {
		for (const url of ESPN_URLS) try {
			const payload = await getJson(url);
			let board;
			try {
				board = mapEspnScoreboard(payload);
			} catch {
				continue;
			}
			if (board.status === "ready" && board.games.length > 0) return board;
		} catch {}
		return unavailableScoreBoard();
	} catch {
		return unavailableScoreBoard();
	}
}
//#endregion
export { fetchEspnBoard };
