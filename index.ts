import { serve } from "bun";
import details from "./package.json";
import { initDb } from "./src/db/init.ts";
import route from "./src/routing.ts";
import { startServerTick } from "./src/ticker.ts";

await initDb();

const TICK_INTERVAL_MS = 30_000;
const tickTimer = startServerTick(TICK_INTERVAL_MS);

const server = serve({
	port: 3001,
	async fetch(request) {
		return await route(request);
	},
});
console.log("Bun Server up for Our Economy Version: ", details.version);
console.log(`Server available at: ${server.url}`);
