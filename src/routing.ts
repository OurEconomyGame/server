import details from "../package.json";
import parseAuthHeader from "./header_parse.ts";
import { createUser } from "./users/create.ts";
import { getAllUsersPublicInfo } from "./users/list.ts";
import { login } from "./users/login.ts";

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
	const auth_token: string | null = parseAuthHeader(request.headers);
	const text = await request.text();
	const postParams = text ? JSON.parse(text) : null;

	console.log("Request Received at URL: ", url);

	switch (path) {
		case "/version":
			return Response.json({ version: details.version });

		case "/openapi.json":
			return new Response(Bun.file("./openapi.json"));

		case "/list/users":
			return Response.json(await getAllUsersPublicInfo(params));

		case "/signup":
			if (method !== "POST")
				return Response.json({
					status: "How can I make an acount without postage?",
					id: 0,
				});
			return Response.json(await createUser(postParams));

		case "/login":
			if (method !== "POST")
				return Response.json({ status: "Your killing me.", token: "none" });
			return Response.json(await login(postParams));

		case "/found":
			if (method !== "POST")
				return Response.json({ status: "I am not a mind reader.", id: 0 });
			return Response.json({});
		default:
			return new Response("You are utterless and hopelessly lost. Get a GPS.", {
				status: 404,
			});
	}
}
