//#region node_modules/.nitro/vite/services/ssr/assets/types-Be1OvKfo.js
var SCORES_UNAVAILABLE = "Scores unavailable";
function unavailableScoreBoard() {
	return {
		status: "error",
		reason: SCORES_UNAVAILABLE,
		asOf: null,
		games: []
	};
}
function boardHasInProgress(board) {
	return board.games.some((game) => game.inProgress);
}
//#endregion
export { boardHasInProgress as n, unavailableScoreBoard as r, SCORES_UNAVAILABLE as t };
