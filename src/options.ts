import {
	isLocalhostDomain,
	isNapp9Domain,
	isNapp9Request,
} from "./users/domain.ts";

const GET_ROUTES = new Set([
	"/version",
	"/docs",
	"/openapi.json",
	"/list/users",
	"/list/companies",
	"/company",
	"/company/shareholders",
	"/portfolio",
	"/market/depth",
]);

/**
 * Handles incoming HTTP OPTIONS requests with CORS preflight headers.
 */
export default async function handleOptions(
	request: Request,
): Promise<Response> {
	const path = new URL(request.url).pathname;
	const headers = new Headers({
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type, Auth, Authorization",
		"Access-Control-Max-Age": "86400",
	});

	if (path === "/signup") {
		if (!isNapp9Request(request)) {
			const body = JSON.stringify({
				code: 666,
				error: 666,
				status:
					"Forbidden: /signup is only available to *.napp9.com domains (Error Code 666)",
			});
			return new Response(body, {
				status: 403,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "https://napp9.com",
					"X-Error-Code": "666",
				},
			});
		}
		const origin = request.headers.get("origin");
		const isAllowedOrigin =
			origin &&
			(isNapp9Domain(origin) ||
				(process.env.DEBUG === "true" && isLocalhostDomain(origin)));
		headers.set(
			"Access-Control-Allow-Origin",
			isAllowedOrigin && origin ? origin : "https://napp9.com",
		);
		headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
		return new Response(null, { status: 204, headers });
	}

	headers.set(
		"Access-Control-Allow-Methods",
		GET_ROUTES.has(path) ? "GET, OPTIONS" : "POST, OPTIONS",
	);
	return new Response(null, { status: 204, headers });
}
