import { i as __toESM } from "../_runtime.mjs";
import { n as SNAPSHOT_BOARD, t as NFL_TEAMS } from "./snapshot-W7Ccjznp.mjs";
import { n as boardHasInProgress, r as unavailableScoreBoard, t as SCORES_UNAVAILABLE } from "./types-Be1OvKfo.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as LayoutGrid, i as ScrollText, n as Users, o as ClipboardList, t as X } from "../_libs/lucide-react.mjs";
import { i as peekScoreBoard, n as Route, r as loadScoreBoard } from "./router-EOJRsrVb.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CU6rVCXN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function scorePair(game) {
	if (game.awayScore === null || game.homeScore === null) return null;
	return `${game.awayScore}–${game.homeScore}`;
}
/** Quarter · clock · score for ticker, cards, and open tickets. */
function liveLine(game) {
	const pair = scorePair(game);
	if (game.inProgress) {
		const bits = [pair ?? "Unavailable"];
		if (game.quarter) bits.push(game.quarter);
		if (game.clock) bits.push(game.clock);
		return bits.join(" · ");
	}
	if (game.phase === "final") return pair ? `${pair} · Final` : "Final unavailable";
	if (game.phase === "pending") return "Pending";
	return "Unavailable";
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function round2(n) {
	return Math.round(n * 100) / 100;
}
function formatMoney(n) {
	const sign = n < 0 ? "-" : "";
	const abs = Math.abs(n);
	return `${sign}$${abs.toLocaleString("en-US", {
		minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
		maximumFractionDigits: 2
	})}`;
}
function uid(prefix) {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
var tones = {
	gold: "border-gold/40 text-gold bg-gold/10",
	muted: "border-cream/15 text-muted bg-ink/30",
	pending: "border-gold/25 text-gold-bright bg-ink/40",
	final: "border-win/40 text-win bg-ink/40",
	snapshot: "border-cream/20 text-cream/80 bg-ink/40",
	unavailable: "border-cream/12 text-muted bg-ink/50"
};
function Badge({ className, tone = "gold", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em]", tones[tone], className),
		...props
	});
}
function americanToDecimal(american) {
	if (!Number.isFinite(american) || american === 0) return 1;
	if (american > 0) return american / 100 + 1;
	return 100 / Math.abs(american) + 1;
}
function decimalToAmerican(decimal) {
	if (!Number.isFinite(decimal) || decimal <= 1) return 0;
	if (decimal >= 2) return Math.round((decimal - 1) * 100);
	return Math.round(-100 / (decimal - 1));
}
function combineAmerican(odds) {
	if (odds.length === 0) return 0;
	return decimalToAmerican(odds.reduce((acc, n) => acc * americanToDecimal(n), 1));
}
function toWin(stake, american) {
	if (stake <= 0 || !Number.isFinite(american) || american === 0) return 0;
	return round2(stake * (americanToDecimal(american) - 1));
}
function formatAmerican(n) {
	if (n === null || n === void 0 || !Number.isFinite(n)) return "Unavailable";
	const rounded = Math.round(n);
	return rounded > 0 ? `+${rounded}` : `${rounded}`;
}
function formatSpreadLine(n) {
	if (n === null || n === void 0 || !Number.isFinite(n)) return "Unavailable";
	if (n === 0) return "PK";
	return n > 0 ? `+${n}` : `${n}`;
}
/**
* Simulated sportsbook state — bankroll, slip, tickets.
* Client-only localStorage. No real money.
*
* PROTOTYPE. Production: persist tickets and bankroll in Supabase; odds and
* scores stay on their swappable provider modules.
*/
var STARTING_BANKROLL = 1e4;
var STAKE_PRESETS = [
	25,
	50,
	100,
	250,
	500,
	1e3
];
function isPricedOdds(odds) {
	return odds !== null && odds !== void 0 && Number.isFinite(odds) && odds !== 0;
}
var useBook = create()(persist((set, get) => ({
	bankroll: STARTING_BANKROLL,
	slip: [],
	stake: 100,
	tickets: [],
	tab: "board",
	slipOpen: false,
	notice: null,
	addLeg: (leg) => {
		const spreadPosted = leg.market === "spread" && leg.line !== null;
		if (!isPricedOdds(leg.odds) && !spreadPosted) {
			set({ notice: "That market is unavailable — no line posted." });
			return;
		}
		const existing = get().slip.find((item) => item.gameId === leg.gameId && item.market === leg.market);
		const next = {
			...leg,
			id: uid("leg")
		};
		set({
			slip: existing ? get().slip.map((item) => item.id === existing.id ? {
				...next,
				id: existing.id
			} : item) : [...get().slip, next],
			notice: null,
			slipOpen: true
		});
	},
	removeLeg: (id) => set({ slip: get().slip.filter((leg) => leg.id !== id) }),
	clearSlip: () => set({ slip: [] }),
	setStake: (n) => {
		set({ stake: Math.max(0, round2(n)) });
	},
	placeBet: () => {
		const { slip, stake, bankroll } = get();
		if (slip.length === 0) {
			set({ notice: "Add a posted line to the slip first." });
			return;
		}
		if (stake <= 0) {
			set({ notice: "Enter a stake greater than zero." });
			return;
		}
		if (stake > bankroll) {
			set({ notice: "Stake is larger than the simulated bankroll." });
			return;
		}
		const priced = slip.every((leg) => isPricedOdds(leg.odds));
		const americanOdds = priced ? combineAmerican(slip.map((leg) => leg.odds)) : null;
		const win = priced && americanOdds !== null ? toWin(stake, americanOdds) : null;
		const ticket = {
			id: uid("tkt"),
			placedAt: (/* @__PURE__ */ new Date()).toISOString(),
			legs: slip,
			stake,
			americanOdds,
			toWin: win,
			priced,
			status: "open"
		};
		set({
			bankroll: round2(bankroll - stake),
			tickets: [ticket, ...get().tickets],
			slip: [],
			notice: priced ? null : "Ticket booked unpriced — juice was not on this BetMGM snapshot. Simulation only.",
			tab: "tickets",
			slipOpen: false
		});
	},
	setTab: (tab) => set({
		tab,
		slipOpen: false
	}),
	setSlipOpen: (slipOpen) => set({ slipOpen }),
	clearNotice: () => set({ notice: null }),
	resetBook: () => set({
		bankroll: STARTING_BANKROLL,
		slip: [],
		stake: 100,
		tickets: [],
		notice: null
	})
}), {
	name: "eastside-legends-sim",
	partialize: (state) => ({
		bankroll: state.bankroll,
		slip: state.slip,
		stake: state.stake,
		tickets: state.tickets
	})
}));
function OddsCell({ label, value, posted, onPick, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		disabled: !posted,
		onClick: onPick,
		className: cn("flex min-h-11 flex-col items-center justify-center rounded-[var(--radius-sm)] border px-2 py-1.5 text-center transition-colors duration-[var(--motion-quick)]", posted ? active ? "border-gold bg-gold/15 text-gold" : "border-gold/25 bg-ink/40 text-cream hover:border-gold/55 hover:bg-gold/10" : "cursor-not-allowed border-cream/10 bg-ink/30 text-muted"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[10px] uppercase tracking-[0.16em] text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm font-semibold tabular-nums",
			children: value
		})]
	});
}
function GameCard({ game, score }) {
	const addLeg = useBook((s) => s.addLeg);
	const slip = useBook((s) => s.slip);
	const away = NFL_TEAMS[game.away];
	const home = NFL_TEAMS[game.home];
	const isActive = (market, side) => slip.some((leg) => leg.gameId === game.id && leg.market === market && leg.side === side);
	const pickSpread = (side, line, label) => {
		if (line === null) return;
		addLeg({
			gameId: game.id,
			label,
			market: "spread",
			side,
			line,
			odds: null,
			book: game.book
		});
	};
	const kickoff = game.kickoffLabel ?? "Kickoff unavailable";
	const matchupMark = game.neutralSite ? "vs" : "@";
	const live = score?.inProgress;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-[var(--radius-lg)] border border-gold/25 bg-felt-raise p-3 shadow-[inset_0_1px_0_rgba(227,197,106,0.12)] sm:p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-3 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-lg leading-tight text-cream",
						children: [
							away.abbr,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: matchupMark
							}),
							" ",
							home.abbr
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-0.5 text-xs text-muted",
						children: [
							away.city,
							" ",
							away.name,
							" ",
							game.neutralSite ? "vs" : "at",
							" ",
							home.city,
							" ",
							home.name
						]
					}),
					score ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm font-semibold tabular-nums text-gold-bright",
						children: liveLine(score)
					}) : null
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-1",
					children: [
						game.opener ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "gold",
							children: "Opener"
						}) : null,
						game.book ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "gold",
							children: game.book
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "unavailable",
							children: "Book unavailable"
						}),
						game.venue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "snapshot",
							children: game.venue
						}) : null,
						live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "pending",
							children: "Live"
						}) : null,
						score?.phase === "final" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "final",
							children: "Final"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] text-muted tabular-nums",
							children: kickoff
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[0.14em] text-gold/80",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "px-1",
						children: "Spread"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "px-1",
						children: "Moneyline"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "px-1",
						children: "Total"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1.5 grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
							label: away.abbr,
							value: formatSpreadLine(game.spread.awayLine),
							posted: game.spread.awayLine !== null,
							active: isActive("spread", "away"),
							onPick: () => pickSpread("away", game.spread.awayLine, `${away.abbr} ${formatSpreadLine(game.spread.awayLine)}`)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
							label: home.abbr,
							value: formatSpreadLine(game.spread.homeLine),
							posted: game.spread.homeLine !== null,
							active: isActive("spread", "home"),
							onPick: () => pickSpread("home", game.spread.homeLine, `${home.abbr} ${formatSpreadLine(game.spread.homeLine)}`)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
							label: away.abbr,
							value: "Unavailable",
							posted: false,
							active: false,
							onPick: () => void 0
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
							label: home.abbr,
							value: "Unavailable",
							posted: false,
							active: false,
							onPick: () => void 0
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
							label: "Over",
							value: "Unavailable",
							posted: false,
							active: false,
							onPick: () => void 0
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
							label: "Under",
							value: "Unavailable",
							posted: false,
							active: false,
							onPick: () => void 0
						})]
					})
				]
			})
		]
	});
}
function UnavailablePlaque({ kicker, title, detail, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative overflow-hidden rounded-[var(--radius-xl)] border border-gold/30 bg-felt-deep/80 p-6 sm:p-8", "shadow-[inset_0_1px_0_rgba(227,197,106,0.18),0_20px_50px_rgba(0,0,0,0.35)]", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "pointer-events-none absolute inset-3 rounded-[calc(var(--radius-xl)-12px)] border border-gold/15"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: "unavailable",
				children: "Unavailable"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-xs uppercase tracking-[0.28em] text-gold",
				children: kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-2 font-display text-2xl font-semibold tracking-tight text-cream text-balance",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-prose text-sm leading-relaxed text-muted text-pretty",
				children: detail
			})
		]
	});
}
function Board({ odds, scores }) {
	const weekLabel = odds.week ? `Week ${odds.week}` : "Week unavailable";
	const byId = new Map(scores.games.map((game) => [game.gameId, game]));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xs uppercase tracking-[0.28em] text-gold",
				children: "The card"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-3xl font-semibold tracking-tight text-cream",
				children: "NFL board"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: odds.week ? "gold" : "unavailable",
						children: weekLabel
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "gold",
						children: "Spreads only"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "snapshot",
						children: "Simulation"
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-sm leading-relaxed text-cream text-pretty",
			children: odds.sourceLabel ?? "Source unavailable"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-5 text-sm text-muted",
			children: "Dated snapshot, not a live scrape. One book: BetMGM. Moneyline, total, and juice are unavailable — not invented. No real money."
		}),
		odds.status !== "ready" || odds.games.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnavailablePlaque, {
			kicker: "BetMGM snapshot",
			title: "Lines unavailable",
			detail: odds.reason ?? "The slate has not been inserted for this build. Markets stay empty until a real snapshot is baked in. No numbers are invented."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 xl:grid-cols-2",
			children: odds.games.map((game) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameCard, {
				game,
				score: byId.get(game.id)
			}, game.id))
		})
	] });
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium transition-colors transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-[0.98]", {
	variants: {
		variant: {
			gold: "bg-gold text-ink shadow-[0_1px_0_rgba(255,255,255,0.25)_inset] hover:bg-gold-bright",
			ghost: "bg-transparent text-cream border border-gold/30 hover:border-gold/60 hover:bg-felt-raise",
			felt: "bg-felt-raise text-cream border border-gold/20 hover:border-gold/45",
			danger: "bg-transparent text-loss border border-loss/40 hover:bg-loss/10"
		},
		size: {
			sm: "h-9 px-3 text-sm rounded-[var(--radius-sm)]",
			md: "h-11 px-4 text-sm rounded-[var(--radius-md)]",
			lg: "h-12 px-5 text-base rounded-[var(--radius-md)]",
			icon: "size-11 rounded-[var(--radius-md)]"
		}
	},
	defaultVariants: {
		variant: "gold",
		size: "md"
	}
});
var Button = (0, import_react.forwardRef)(function Button({ className, variant, size, type = "button", ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref,
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
});
var Input = (0, import_react.forwardRef)(function Input({ className, ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref,
		suppressHydrationWarning: true,
		className: cn("h-11 w-full rounded-[var(--radius-sm)] border border-gold/25 bg-ink/50 px-3 text-sm text-cream tabular-nums placeholder:text-muted/70", "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold", className),
		...props
	});
});
function BetSlip({ scores }) {
	const slip = useBook((s) => s.slip);
	const stake = useBook((s) => s.stake);
	const bankroll = useBook((s) => s.bankroll);
	const notice = useBook((s) => s.notice);
	const removeLeg = useBook((s) => s.removeLeg);
	const clearSlip = useBook((s) => s.clearSlip);
	const setStake = useBook((s) => s.setStake);
	const placeBet = useBook((s) => s.placeBet);
	const clearNotice = useBook((s) => s.clearNotice);
	const byId = new Map(scores.games.map((game) => [game.gameId, game]));
	const priced = slip.length > 0 && slip.every((leg) => leg.odds !== null);
	const american = priced ? combineAmerican(slip.map((leg) => leg.odds)) : null;
	const win = priced && american !== null ? toWin(stake, american) : null;
	const payout = win !== null ? win + stake : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "rounded-[var(--radius-xl)] border border-gold/30 bg-felt-deep p-4 shadow-[inset_0_1px_0_rgba(227,197,106,0.12)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xs uppercase tracking-[0.28em] text-gold",
					children: "Window"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-semibold text-cream",
					children: "Bet slip"
				})] }), slip.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: clearSlip,
					className: "text-xs uppercase tracking-[0.16em] text-muted hover:text-cream",
					children: "Clear"
				}) : null]
			}),
			slip.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-sm leading-relaxed text-muted text-pretty",
				children: "Tap a posted spread to add a sim lean. This snapshot has no juice, so tickets are unpriced. Simulation only."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: slip.map((leg) => {
					const live = byId.get(leg.gameId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start justify-between gap-2 rounded-[var(--radius-md)] border border-gold/20 bg-ink/40 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-cream",
									children: leg.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs uppercase tracking-[0.14em] text-muted",
									children: [
										leg.market,
										" ",
										leg.book ? `· ${leg.book}` : ""
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs tabular-nums text-gold-bright",
									children: live ? liveLine(live) : "Score unavailable"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold text-gold tabular-nums",
								children: leg.odds === null ? "Unpriced" : formatAmerican(leg.odds)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": `Remove ${leg.label}`,
								onClick: () => removeLeg(leg.id),
								className: "flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-cream",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})]
						})]
					}, leg.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] uppercase tracking-[0.2em] text-gold",
						children: "Stake"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: STAKE_PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setStake(preset),
							className: `h-9 min-w-11 rounded-full border px-3 text-xs tabular-nums ${stake === preset ? "border-gold bg-gold text-ink" : "border-gold/25 text-cream hover:border-gold/60"}`,
							children: preset
						}, preset))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						min: 0,
						step: 1,
						value: Number.isFinite(stake) ? stake : 0,
						onChange: (e) => setStake(Number(e.target.value)),
						"aria-label": "Custom stake"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-5 space-y-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Odds" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-cream tabular-nums",
							children: american !== null ? formatAmerican(american) : "Unavailable"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "To win" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-gold tabular-nums",
							children: win !== null ? formatMoney(win) : "Unavailable"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Payout" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-cream tabular-nums",
							children: payout !== null ? formatMoney(payout) : "Unavailable"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "On the rail" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-cream tabular-nums",
							children: formatMoney(bankroll)
						})]
					})
				]
			}),
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-loss",
				role: "status",
				children: [
					notice,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "underline",
						onClick: clearNotice,
						children: "Dismiss"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5 w-full",
				size: "lg",
				onClick: placeBet,
				disabled: slip.length === 0,
				children: "Place sim bet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-[11px] leading-relaxed text-muted",
				children: "Simulated chips only. No real money. Juice is not on this snapshot, so tickets stay unpriced."
			})
		]
	});
}
var CHIP_VALUES = [
	1e3,
	500,
	100,
	25,
	5,
	1
];
var CHIP_FACE = {
	1e3: "bg-gold text-ink",
	500: "bg-[#5c2424] text-cream",
	100: "bg-chip-black text-gold",
	25: "bg-[#1f5a43] text-cream",
	5: "bg-chip-red text-cream",
	1: "bg-cream text-ink"
};
function breakdown(amount) {
	let remaining = Math.max(0, Math.floor(amount));
	return CHIP_VALUES.map((value) => {
		const count = Math.min(8, Math.floor(remaining / value));
		remaining -= count * value;
		return {
			value,
			count
		};
	}).filter((row) => row.count > 0);
}
function ChipStack({ amount }) {
	const stacks = breakdown(amount);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-end gap-2",
		"aria-hidden": "true",
		children: [stacks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-9 rounded-full border border-dashed border-gold/25" }) : stacks.map((stack) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative h-12 w-9",
			children: Array.from({ length: stack.count }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `absolute left-0 right-0 mx-auto size-8 rounded-full border border-black/30 shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] ${CHIP_FACE[stack.value]}`,
				style: { bottom: i * 4 }
			}, i))
		}, stack.value)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "sr-only",
			children: ["Simulated chips totaling ", formatMoney(amount)]
		})]
	});
}
function ChipCounter({ bankroll }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-[var(--radius-lg)] border border-gold/25 bg-ink/40 px-3 py-2 sm:px-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipStack, { amount: bankroll }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] uppercase tracking-[0.22em] text-gold",
				children: "Sim bankroll"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xl leading-none tracking-tight text-cream tabular-nums sm:text-2xl",
				children: formatMoney(bankroll)
			})]
		})]
	});
}
function SlotRow({ slot, compact }) {
	const player = slot.player;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: cn("flex items-center gap-2 rounded-[var(--radius-sm)] border border-gold/15 bg-ink/30 px-3", compact ? "min-h-11 py-1.5" : "min-h-12 py-2"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-11 shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-gold",
				children: slot.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("text-cream", compact ? "truncate text-sm" : "text-base"),
					children: player?.name ?? "Unavailable"
				}), player ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[11px] text-muted",
					children: [
						player.team ?? "—",
						player.position !== slot.position && slot.position === "FLEX" ? ` · ${player.position}` : "",
						slot.note ? ` · ${slot.note}` : ""
					]
				}) : null]
			}),
			player?.status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]", player.status.startsWith("Out") ? "border-loss/40 text-loss" : "border-gold/40 text-gold-bright"),
				children: player.status
			}) : null
		]
	});
}
function SlotList({ title, slots, compact }) {
	if (slots.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-1.5 text-[10px] uppercase tracking-[0.22em] text-gold/80",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-1.5",
		children: slots.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotRow, {
			slot: item,
			compact
		}, item.id))
	})] });
}
function FantasyBoard({ roster, compact = false }) {
	const ready = roster.status === "ready";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xs uppercase tracking-[0.28em] text-gold",
					children: "Lineup"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl font-semibold tracking-tight text-cream",
					children: "Roster"
				}),
				roster.ownerLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: roster.ownerLabel
				}) : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[var(--radius-xl)] border border-gold/25 bg-felt-deep p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-sm uppercase tracking-[0.14em] text-gold",
							children: roster.league
						}), roster.yahooId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted tabular-nums",
							children: ["Yahoo ", roster.yahooId]
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: ready ? "final" : "unavailable",
						children: ready ? "Posted" : "Unavailable"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotList, {
						title: "Start",
						slots: roster.slots,
						compact
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotList, {
						title: "Bench",
						slots: roster.bench,
						compact
					})]
				}),
				ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs leading-relaxed text-muted text-pretty",
					children: "Rob's board only. No opponent column. Simulation only."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs leading-relaxed text-muted text-pretty",
					children: [roster.reason ?? "Fantasy roster was not provided at build time.", " No player names invented. No opponent column."]
				})
			]
		}),
		compact || ready ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnavailablePlaque, {
				kicker: "Fantasy",
				title: "Roster unavailable",
				detail: "Slots are listed with positions only. Names stay empty until a real roster is inserted."
			})
		})
	] });
}
function HouseRules() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-xs uppercase tracking-[0.28em] text-gold",
			children: "The house"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-3xl font-semibold tracking-tight text-cream",
			children: "House rules"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 space-y-4 text-sm leading-relaxed text-cream/90",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Eastside Legends Sim is a prototype. Simulated bankroll only. No real money. No live paid data feeds." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-3 text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cream",
						children: "Lines."
					}), " Week 1 spreads from a dated BetMGM snapshot. Source: USA Today, odds courtesy of BetMGM as of Tuesday Sep 8, 2026, 10:45 a.m. ET. Not a live scrape. One casino: BetMGM."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cream",
						children: "Markets."
					}), " Spreads only. Moneyline, total, and juice are unavailable on this board and are not invented. The opener is SEA −3 from this USA Today card."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cream",
						children: "Scores."
					}), " ESPN public scoreboard, swappable layer. Snapshot / pending / final. Polls every 30 seconds while a game is in progress. Unofficial feed — if it fails the ticker shows “Scores unavailable” and the rest of the book stays up. Nothing is invented."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cream",
						children: "Roster."
					}), " League of Eastside Legends (Yahoo 288732). Starters and bench are the inserted lineup only. No opponent column. No extra players invented."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cream",
						children: "Tickets."
					}), " Spreads can be booked as unpriced sim leans. Payout stays unavailable until juice exists. Open tickets wait on a final score."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cream",
						children: "Production."
					}), " Odds module swaps to The Odds API. Scores module swaps the same way — ESPN unofficial now, paid feed later — without touching ticker, cards, or tickets. Persistence moves to Supabase. UI stays on the same board contract."] })
				]
			})]
		})
	] });
}
var STATUS_TONE = {
	open: "pending",
	won: "final",
	lost: "unavailable",
	push: "snapshot",
	void: "unavailable"
};
function MyBets({ scores }) {
	const tickets = useBook((s) => s.tickets);
	const resetBook = useBook((s) => s.resetBook);
	const byId = new Map(scores.games.map((game) => [game.gameId, game]));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xs uppercase tracking-[0.28em] text-gold",
				children: "Tickets"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-3xl font-semibold tracking-tight text-cream",
				children: "My bets"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "sm",
				onClick: resetBook,
				children: "Reset sim bankroll"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-5 text-sm text-muted",
			children: [
				"Settlement waits on a final score. Live layer: ESPN public scoreboard, 30s while games are in progress. Current feed: ",
				scores.status === "ready" ? "posted" : "unavailable",
				". Simulation only. No real money."
			]
		}),
		tickets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnavailablePlaque, {
			kicker: "Window",
			title: "No tickets yet",
			detail: "Tap a posted spread on the board, then book a sim ticket. Juice is unavailable on this snapshot, so tickets are unpriced until a priced feed is swapped in."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-3",
			children: tickets.map((ticket) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-[var(--radius-lg)] border border-gold/25 bg-felt-raise p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-lg text-cream",
							children: ticket.legs.length > 1 ? `${ticket.legs.length}-leg parlay` : "Straight"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted tabular-nums",
							children: new Date(ticket.placedAt).toLocaleString()
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-end gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: STATUS_TONE[ticket.status],
								children: ticket.status
							}), ticket.priced ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "unavailable",
								children: "Unpriced"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-1 text-sm text-cream",
						children: ticket.legs.map((leg) => {
							const live = byId.get(leg.gameId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block",
										children: leg.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-xs tabular-nums text-gold-bright",
										children: live ? liveLine(live) : "Score unavailable"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-gold tabular-nums",
									children: leg.odds === null ? "Unavailable" : formatAmerican(leg.odds)
								})]
							}, leg.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-3 grid grid-cols-3 gap-2 text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Stake" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-cream tabular-nums",
								children: formatMoney(ticket.stake)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "To win" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-gold tabular-nums",
								children: ticket.toWin === null ? "Unavailable" : formatMoney(ticket.toWin)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Price" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-cream tabular-nums",
								children: ticket.americanOdds === null ? "Unavailable" : formatAmerican(ticket.americanOdds)
							})] })
						]
					})
				]
			}, ticket.id))
		})
	] });
}
function phaseTone(game) {
	if (game.inProgress) return "pending";
	if (game.phase === "final") return "final";
	if (game.phase === "pending") return "pending";
	return "snapshot";
}
function phaseLabel(game) {
	if (game.inProgress) return "Live";
	if (game.phase === "final") return "Final";
	if (game.phase === "pending") return "Pending";
	return "Snapshot";
}
function lineText(game) {
	const away = NFL_TEAMS[game.away];
	const home = NFL_TEAMS[game.home];
	return `${away.abbr} @ ${home.abbr}  ${liveLine(game)}`;
}
function Ticker({ scores }) {
	const live = scores.status === "ready" && scores.games.length > 0;
	const items = live ? scores.games.map((game) => ({
		id: game.gameId,
		text: lineText(game),
		phase: game.phase,
		inProgress: game.inProgress
	})) : [{
		id: "unavailable",
		text: SCORES_UNAVAILABLE,
		phase: "snapshot",
		inProgress: false
	}];
	const loop = [
		...items,
		...items,
		...items
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative overflow-hidden border-y border-gold/20 bg-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-ink to-transparent" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-ink to-transparent" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "gold",
					className: "shrink-0",
					children: "Ticker"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative min-w-0 flex-1 overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "ticker-track flex w-max items-center gap-10 motion-safe:animate-[ticker_36s_linear_infinite]",
						children: loop.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3 text-sm text-cream",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: phaseTone(item),
								children: live ? phaseLabel(item) : "Unavailable"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "whitespace-nowrap font-medium tracking-wide tabular-nums",
								children: item.text
							})]
						}, `${item.id}-${i}`))
					})
				})]
			})
		]
	});
}
/**
* Odds module — the only import path the UI should use.
*
* Swap ACTIVE_ODDS_PROVIDER to `theOddsApiProvider` when going live.
* Board / slip / tickets consume OddsBoard and never the snapshot file.
*
* PROTOTYPE. Production: The Odds API + Supabase.
*/
/** Active feed. Change this one binding to replace snapshot with live odds. */
var ACTIVE_ODDS_PROVIDER = {
	id: "snapshot",
	label: "BetMGM snapshot",
	peekBoard() {
		return SNAPSHOT_BOARD;
	},
	async getBoard() {
		return SNAPSHOT_BOARD;
	}
};
function peekOddsBoard() {
	return ACTIVE_ODDS_PROVIDER.peekBoard();
}
function player(id, name, team, position, status = null) {
	return {
		id,
		name,
		team,
		position,
		status
	};
}
function slot(id, position, p, note = null) {
	return {
		id,
		position,
		label: position,
		note,
		player: p
	};
}
var ROSTER = {
	status: "ready",
	reason: null,
	league: "League of Eastside Legends",
	yahooId: "288732",
	ownerLabel: "Rob's board",
	slots: [
		slot("qb", "QB", player("dak-prescott", "Dak Prescott", "DAL", "QB")),
		slot("rb1", "RB", player("bucky-irving", "Bucky Irving", "TB", "RB")),
		slot("rb2", "RB", player("jk-dobbins", "J.K. Dobbins", "DEN", "RB")),
		slot("wr1", "WR", player("amon-ra-st-brown", "Amon-Ra St. Brown", "DET", "WR")),
		slot("wr2", "WR", player("jamarr-chase", "Ja'Marr Chase", "CIN", "WR", "Q")),
		slot("te", "TE", player("colston-loveland", "Colston Loveland", "CHI", "TE")),
		slot("flex", "FLEX", player("dallas-goedert", "Dallas Goedert", "PHI", "TE"), "WRT flex"),
		slot("k", "K", player("jake-elliott", "Jake Elliott", "PHI", "K")),
		slot("def", "DEF", player("packers-def", "Packers DEF", "GB", "DEF"))
	],
	bench: [
		slot("bn1", "BN", player("treveyon-henderson", "TreVeyon Henderson", "NE", "RB", "Out, ankle")),
		slot("bn2", "BN", player("calvin-ridley", "Calvin Ridley", "TEN", "WR")),
		slot("bn3", "BN", player("kenneth-gainwell", "Kenneth Gainwell", "TB", "RB")),
		slot("bn4", "BN", player("alec-pierce", "Alec Pierce", "IND", "WR"))
	]
};
/**
* Fantasy module — UI imports roster from here only.
*
* PROTOTYPE. Production: live roster + Supabase.
*/
function loadRoster() {
	return ROSTER;
}
/**
* Book feeds. Odds and scores are swappable providers — this hook only
* reads peek/load from those modules. Do not import ESPN or snapshot files here.
*/
var LIVE_MS = 3e4;
var PREGAME_MS = 3e4;
var IDLE_MS = 18e4;
var ERROR_MS = 3e4;
function nextInterval(board) {
	if (board.status === "error" || board.status === "unavailable") return ERROR_MS;
	if (boardHasInProgress(board)) return LIVE_MS;
	if (board.games.some((game) => game.phase === "pending")) return PREGAME_MS;
	return IDLE_MS;
}
function failedBoard(prev) {
	return {
		...unavailableScoreBoard(),
		games: prev.games,
		reason: SCORES_UNAVAILABLE
	};
}
function useBookFeeds(initialScores) {
	const [scores, setScores] = (0, import_react.useState)(() => initialScores ?? peekScoreBoard());
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		let timer;
		let inflight = false;
		const run = async () => {
			if (cancelled || inflight) return;
			inflight = true;
			try {
				const next = await loadScoreBoard();
				if (cancelled) return;
				if (next.status === "ready" && next.games.length > 0) {
					setScores(next);
					timer = setTimeout(run, nextInterval(next));
				} else {
					setScores((prev) => failedBoard(prev));
					timer = setTimeout(run, ERROR_MS);
				}
			} catch {
				if (!cancelled) {
					setScores((prev) => failedBoard(prev));
					timer = setTimeout(run, ERROR_MS);
				}
			} finally {
				inflight = false;
			}
		};
		run().catch(() => {
			if (!cancelled) setScores((prev) => failedBoard(prev));
		});
		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, []);
	return {
		odds: peekOddsBoard(),
		scores,
		roster: loadRoster()
	};
}
var TABS = [
	{
		id: "board",
		label: "Board",
		icon: LayoutGrid
	},
	{
		id: "tickets",
		label: "Tickets",
		icon: ClipboardList
	},
	{
		id: "fantasy",
		label: "Roster",
		icon: Users
	},
	{
		id: "house",
		label: "House",
		icon: ScrollText
	}
];
function SportsbookApp({ initialScores }) {
	const feeds = useBookFeeds(initialScores);
	const tab = useBook((s) => s.tab);
	const setTab = useBook((s) => s.setTab);
	const slip = useBook((s) => s.slip);
	const slipOpen = useBook((s) => s.slipOpen);
	const setSlipOpen = useBook((s) => s.setSlipOpen);
	const storedBankroll = useBook((s) => s.bankroll);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setHydrated(true);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "felt-bg min-h-dvh text-cream",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-gold/20 bg-felt-deep/90",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-[11px] uppercase tracking-[0.32em] text-gold",
							children: "Las Vegas · Sim book"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-3xl font-semibold tracking-tight text-cream sm:text-4xl",
							children: "Eastside Legends Sim"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Prototype NFL betting and fantasy tracker. Simulation only. No real money."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipCounter, { bankroll: hydrated ? storedBankroll : STARTING_BANKROLL }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "felt",
							className: "lg:hidden",
							onClick: () => setSlipOpen(true),
							children: ["Slip", slip.length ? ` (${slip.length})` : ""]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 pb-3 sm:px-6",
					children: TABS.map((item) => {
						const Icon = item.icon;
						const active = tab === item.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setTab(item.id),
							className: `inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm ${active ? "border-gold bg-gold text-ink" : "border-gold/20 text-cream hover:border-gold/50"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
						}, item.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ticker, { scores: feeds.scores }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden lg:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sticky top-4 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FantasyBoard, {
								roster: feeds.roster,
								compact: true
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "min-w-0 pb-24 lg:pb-8",
						children: [
							tab === "board" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Board, {
								odds: feeds.odds,
								scores: feeds.scores
							}) : null,
							tab === "tickets" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MyBets, { scores: feeds.scores }) : null,
							tab === "fantasy" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FantasyBoard, { roster: feeds.roster }) : null,
							tab === "house" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseRules, {}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden xl:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sticky top-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BetSlip, { scores: feeds.scores })
						})
					})
				]
			}),
			slipOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 xl:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close slip",
					className: "absolute inset-0 bg-ink/70",
					onClick: () => setSlipOpen(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[var(--radius-xl)] p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 flex justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "felt",
							size: "icon",
							onClick: () => setSlipOpen(false),
							"aria-label": "Close",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BetSlip, { scores: feeds.scores })]
				})]
			}) : null
		]
	});
}
function Home() {
	const { scores } = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsbookApp, { initialScores: scores });
}
//#endregion
export { Home as component };
