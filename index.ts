import { serve } from "bun";
import details from "./package.json";
import { initDb } from "./src/db/init.ts";
import route from "./src/routing.ts";

await initDb();

const server = serve({
	port: 3001,
	async fetch(request) {
		return await route(request);
	},
});
console.log("Bun Server up for Our Economy Version: ", details.version);
