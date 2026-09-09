//#region node_modules/.nitro/vite/services/ssr/assets/snapshot-W7Ccjznp.js
var NFL_TEAMS = {
	ARI: {
		abbr: "ARI",
		city: "Arizona",
		name: "Cardinals"
	},
	ATL: {
		abbr: "ATL",
		city: "Atlanta",
		name: "Falcons"
	},
	BAL: {
		abbr: "BAL",
		city: "Baltimore",
		name: "Ravens"
	},
	BUF: {
		abbr: "BUF",
		city: "Buffalo",
		name: "Bills"
	},
	CAR: {
		abbr: "CAR",
		city: "Carolina",
		name: "Panthers"
	},
	CHI: {
		abbr: "CHI",
		city: "Chicago",
		name: "Bears"
	},
	CIN: {
		abbr: "CIN",
		city: "Cincinnati",
		name: "Bengals"
	},
	CLE: {
		abbr: "CLE",
		city: "Cleveland",
		name: "Browns"
	},
	DAL: {
		abbr: "DAL",
		city: "Dallas",
		name: "Cowboys"
	},
	DEN: {
		abbr: "DEN",
		city: "Denver",
		name: "Broncos"
	},
	DET: {
		abbr: "DET",
		city: "Detroit",
		name: "Lions"
	},
	GB: {
		abbr: "GB",
		city: "Green Bay",
		name: "Packers"
	},
	HOU: {
		abbr: "HOU",
		city: "Houston",
		name: "Texans"
	},
	IND: {
		abbr: "IND",
		city: "Indianapolis",
		name: "Colts"
	},
	JAX: {
		abbr: "JAX",
		city: "Jacksonville",
		name: "Jaguars"
	},
	KC: {
		abbr: "KC",
		city: "Kansas City",
		name: "Chiefs"
	},
	LAC: {
		abbr: "LAC",
		city: "Los Angeles",
		name: "Chargers"
	},
	LAR: {
		abbr: "LAR",
		city: "Los Angeles",
		name: "Rams"
	},
	LV: {
		abbr: "LV",
		city: "Las Vegas",
		name: "Raiders"
	},
	MIA: {
		abbr: "MIA",
		city: "Miami",
		name: "Dolphins"
	},
	MIN: {
		abbr: "MIN",
		city: "Minnesota",
		name: "Vikings"
	},
	NE: {
		abbr: "NE",
		city: "New England",
		name: "Patriots"
	},
	NO: {
		abbr: "NO",
		city: "New Orleans",
		name: "Saints"
	},
	NYG: {
		abbr: "NYG",
		city: "New York",
		name: "Giants"
	},
	NYJ: {
		abbr: "NYJ",
		city: "New York",
		name: "Jets"
	},
	PHI: {
		abbr: "PHI",
		city: "Philadelphia",
		name: "Eagles"
	},
	PIT: {
		abbr: "PIT",
		city: "Pittsburgh",
		name: "Steelers"
	},
	SEA: {
		abbr: "SEA",
		city: "Seattle",
		name: "Seahawks"
	},
	SF: {
		abbr: "SF",
		city: "San Francisco",
		name: "49ers"
	},
	TB: {
		abbr: "TB",
		city: "Tampa Bay",
		name: "Buccaneers"
	},
	TEN: {
		abbr: "TEN",
		city: "Tennessee",
		name: "Titans"
	},
	WAS: {
		abbr: "WAS",
		city: "Washington",
		name: "Commanders"
	}
};
function isTeamAbbr(value) {
	return Object.prototype.hasOwnProperty.call(NFL_TEAMS, value);
}
var SNAPSHOT_SOURCE_LABEL = "USA Today, odds courtesy of BetMGM as of Tuesday Sep 8, 2026, 10:45 a.m. ET";
var BLANK_ML = {
	home: null,
	away: null,
	draw: null
};
var BLANK_TOTAL = {
	line: null,
	overJuice: null,
	underJuice: null
};
function spreadGame(input) {
	const mag = Math.abs(input.spread);
	const favHome = input.favorite === input.home;
	return {
		id: input.id,
		startTime: input.startTime,
		kickoffLabel: input.kickoffLabel,
		week: 1,
		home: input.home,
		away: input.away,
		book: "BetMGM",
		venue: input.venue ?? null,
		neutralSite: Boolean(input.neutralSite),
		opener: Boolean(input.opener),
		moneyline: BLANK_ML,
		spread: {
			homeLine: favHome ? -mag : mag,
			awayLine: favHome ? mag : -mag,
			homeJuice: null,
			awayJuice: null
		},
		total: BLANK_TOTAL
	};
}
var SNAPSHOT_BOARD = {
	status: "ready",
	reason: null,
	asOf: "2026-09-08T10:45:00-04:00",
	sourceLabel: SNAPSHOT_SOURCE_LABEL,
	week: 1,
	sourceBooks: ["BetMGM"],
	games: [
		spreadGame({
			id: "wk1-ne-sea",
			kickoffLabel: "Wed Sep 9, 8:20 PM ET",
			startTime: "2026-09-09T20:20:00-04:00",
			away: "NE",
			home: "SEA",
			favorite: "SEA",
			spread: 3,
			opener: true
		}),
		spreadGame({
			id: "wk1-sf-lar",
			kickoffLabel: "Thu Sep 10, 8:35 PM ET",
			startTime: "2026-09-10T20:35:00-04:00",
			away: "SF",
			home: "LAR",
			favorite: "LAR",
			spread: 3.5,
			venue: "Melbourne",
			neutralSite: true
		}),
		spreadGame({
			id: "wk1-buf-hou",
			kickoffLabel: "Sun Sep 13, 1:00 PM ET",
			startTime: "2026-09-13T13:00:00-04:00",
			away: "BUF",
			home: "HOU",
			favorite: "BUF",
			spread: 1
		}),
		spreadGame({
			id: "wk1-chi-car",
			kickoffLabel: "Sun Sep 13, 1:00 PM ET",
			startTime: "2026-09-13T13:00:00-04:00",
			away: "CHI",
			home: "CAR",
			favorite: "CHI",
			spread: 3
		}),
		spreadGame({
			id: "wk1-tb-cin",
			kickoffLabel: "Sun Sep 13, 1:00 PM ET",
			startTime: "2026-09-13T13:00:00-04:00",
			away: "TB",
			home: "CIN",
			favorite: "CIN",
			spread: 3.5
		}),
		spreadGame({
			id: "wk1-no-det",
			kickoffLabel: "Sun Sep 13, 1:00 PM ET",
			startTime: "2026-09-13T13:00:00-04:00",
			away: "NO",
			home: "DET",
			favorite: "DET",
			spread: 7
		}),
		spreadGame({
			id: "wk1-nyj-ten",
			kickoffLabel: "Sun Sep 13, 1:00 PM ET",
			startTime: "2026-09-13T13:00:00-04:00",
			away: "NYJ",
			home: "TEN",
			favorite: "TEN",
			spread: 1.5
		}),
		spreadGame({
			id: "wk1-bal-ind",
			kickoffLabel: "Sun Sep 13, 1:00 PM ET",
			startTime: "2026-09-13T13:00:00-04:00",
			away: "BAL",
			home: "IND",
			favorite: "BAL",
			spread: 3.5
		}),
		spreadGame({
			id: "wk1-atl-pit",
			kickoffLabel: "Sun Sep 13, 1:00 PM ET",
			startTime: "2026-09-13T13:00:00-04:00",
			away: "ATL",
			home: "PIT",
			favorite: "PIT",
			spread: 3.5
		}),
		spreadGame({
			id: "wk1-cle-jax",
			kickoffLabel: "Sun Sep 13, 1:00 PM ET",
			startTime: "2026-09-13T13:00:00-04:00",
			away: "CLE",
			home: "JAX",
			favorite: "JAX",
			spread: 8.5
		}),
		spreadGame({
			id: "wk1-gb-min",
			kickoffLabel: "Sun Sep 13, 4:25 PM ET",
			startTime: "2026-09-13T16:25:00-04:00",
			away: "GB",
			home: "MIN",
			favorite: "MIN",
			spread: 1.5
		}),
		spreadGame({
			id: "wk1-was-phi",
			kickoffLabel: "Sun Sep 13, 4:25 PM ET",
			startTime: "2026-09-13T16:25:00-04:00",
			away: "WAS",
			home: "PHI",
			favorite: "PHI",
			spread: 4.5
		}),
		spreadGame({
			id: "wk1-mia-lv",
			kickoffLabel: "Sun Sep 13, 4:25 PM ET",
			startTime: "2026-09-13T16:25:00-04:00",
			away: "MIA",
			home: "LV",
			favorite: "LV",
			spread: 3.5
		}),
		spreadGame({
			id: "wk1-ari-lac",
			kickoffLabel: "Sun Sep 13, 4:25 PM ET",
			startTime: "2026-09-13T16:25:00-04:00",
			away: "ARI",
			home: "LAC",
			favorite: "LAC",
			spread: 9
		}),
		spreadGame({
			id: "wk1-dal-nyg",
			kickoffLabel: "Sun Sep 13, 8:20 PM ET",
			startTime: "2026-09-13T20:20:00-04:00",
			away: "DAL",
			home: "NYG",
			favorite: "DAL",
			spread: 3
		}),
		spreadGame({
			id: "wk1-den-kc",
			kickoffLabel: "Mon Sep 14, 8:15 PM ET",
			startTime: "2026-09-14T20:15:00-04:00",
			away: "DEN",
			home: "KC",
			favorite: "KC",
			spread: 2.5
		})
	]
};
//#endregion
export { SNAPSHOT_BOARD as n, isTeamAbbr as r, NFL_TEAMS as t };
