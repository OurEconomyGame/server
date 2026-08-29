/**
 * Handles incoming HTTP OPTIONS requests with CORS preflight headers.
 *
 * @param request - The incoming HTTP Request object.
 * @returns A promise resolving to a Response object with appropriate CORS headers.
 */
export default async function handleOptions(
	request: Request,
): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname;

	const headers = new Headers({
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type, Auth, Authorization",
		"Access-Control-Max-Age": "86400",
	});

	switch (path) {
		case "/version":
		case "/docs":
		case "/openapi.json":
		case "/list/users":
		case "/list/companies":
		case "/company":
		case "/company/shareholders":
		case "/portfolio":
		case "/market/depth":
			headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
			return new Response(null, { status: 204, headers });

		case "/signup":
		case "/login":
		case "/found":
		case "/facility/buy":
		case "/market/buy":
		case "/market/sell":
		case "/market/cancel":
			headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
			return new Response(null, { status: 204, headers });

		default:
			headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			return new Response(null, { status: 204, headers });
	}
}
