import details from "../package.json";
import parseCookies from "./cookie_parse.ts";
import { createUser } from "./users/create.ts";

/**
 * Handles incoming requests and routes them to the appropriate handler.
 *
 * @param request - The incoming HTTP Request object.
 * @returns A promise that resolves to the HTTP Response object.
 */
export default async function route(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const method = request.method;
	const path = url.pathname;
	const params = Object.fromEntries(url.searchParams.entries());
	const cookies = parseCookies(request.headers.get("cookie") || "");
	const text = await request.text();
	const postParams = text ? JSON.parse(text) : null;

	console.log("Request Received at URL: ", url);

	switch (path) {
		case "/version":
			return Response.json({ version: details.version });

		case "/openapi.json":
			return new Response(Bun.file("./openapi.json"));

		case "/users":
			return Response.json({ users: ["test1", "test2"] });

		case "/create/user":
			if (method !== "POST")
				return Response.json({ status: "INVALID REQUEST", id: 0 });
			return Response.json(await createUser(postParams));

		default:
			return new Response("Not Found", { status: 404 });
	}
}
