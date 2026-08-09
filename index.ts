import { serve } from "bun";
import details from "./package.json";
import route from "./src/routing.ts";

const server = serve({
  port: 3001,
  async fetch(request) {
    return await route(request);
  },
});
console.log("Bun Server up for Our Economy Version: ", details.version);
