import { r as unavailableScoreBoard } from "./types-Be1OvKfo.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fetch-espn-BOyrkkp1.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/**
* Server function for the ESPN scores layer.
* Unofficial feed. Every call is fail-soft — never throw.
*/
var fetchEspnScoreBoard_createServerFn_handler = createServerRpc({
	id: "47c718c39956d0bb68790277e3cb4e146f159400fd3a1213f9476335e50e0e09",
	name: "fetchEspnScoreBoard",
	filename: "src/lib/scores/fetch-espn.ts"
}, (opts) => fetchEspnScoreBoard.__executeServer(opts));
var fetchEspnScoreBoard = createServerFn({ method: "GET" }).handler(fetchEspnScoreBoard_createServerFn_handler, async () => {
	try {
		const { fetchEspnBoard } = await import("./espn.server-iNG1eCHb.mjs");
		return await fetchEspnBoard();
	} catch {
		return unavailableScoreBoard();
	}
});
//#endregion
export { fetchEspnScoreBoard_createServerFn_handler };
