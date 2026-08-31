const GET_ROUTES = new Set([
	"/version",
	"/docs",
	"/openapi.json",
	"/list/users",
	"/user",
	"/list/companies",
	"/company",
	"/company/ceo",
	"/companies/ceo",
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

	headers.set(
		"Access-Control-Allow-Methods",
		GET_ROUTES.has(path) ? "GET, OPTIONS" : "POST, OPTIONS",
	);
	return new Response(null, { status: 204, headers });
}
