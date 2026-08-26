import details from "../package.json";
import { foundCompany } from "./companies/found.ts";
import { getCompanyInfo } from "./companies/get.ts";
import { getAllCompaniesInfo } from "./companies/list.ts";
import { getCompanyShareholders } from "./companies/shareholders.ts";
import parseAuthHeader from "./header_parse.ts";
import handleOptions from "./options.ts";
import { getUserPortfolio } from "./shares/portfolio.ts";
import { createUser } from "./users/create.ts";
import { getAllUsersPublicInfo } from "./users/list.ts";
import { login } from "./users/login.ts";

/**
 * Attaches standard CORS headers to any outgoing HTTP response.
 *
 * @param response - The HTTP Response object.
 * @returns The HTTP Response object with CORS headers attached.
 */
function withCors(response: Response): Response {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Auth, Authorization",
	);
	return response;
}

/**
 * Internal route handler for processing request business logic.
 *
 * @param request - The incoming HTTP Request object.
 * @returns A promise that resolves to the HTTP Response object.
 */
async function handleRequest(request: Request): Promise<Response> {
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

		case "/list/companies":
			return Response.json(await getAllCompaniesInfo(params, auth_token));

		case "/company":
			return Response.json(await getCompanyInfo(params, auth_token));

		case "/company/shareholders":
			return Response.json(await getCompanyShareholders(params));

		case "/portfolio":
			return Response.json(await getUserPortfolio(auth_token));

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
			return Response.json(await foundCompany(postParams, auth_token));

		default:
			return new Response("You are utterless and hopelessly lost. Get a GPS.", {
				status: 404,
			});
	}
}

/**
 * Handles incoming requests, routes OPTIONS preflights, and wraps responses with CORS headers.
 *
 * @param request - The incoming HTTP Request object.
 * @returns A promise that resolves to the HTTP Response object with CORS headers.
 */
export default async function route(request: Request): Promise<Response> {
	if (request.method === "OPTIONS") {
		return await handleOptions(request);
	}

	const response = await handleRequest(request);
	return withCors(response);
}
