import { serve } from "bun";
import details from "./package.json";
import { initDb } from "./src/db/init.ts";
import route from "./src/routing.ts";
import { startServerTick } from "./src/ticker.ts";

await initDb();
startServerTick();

const server = serve({
	port: 3001,
	async fetch(request) {
		return await route(request);
	},
});
console.log("Bun Server up for Our Economy Version: ", details.version);
