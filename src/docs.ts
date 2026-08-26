/**
 * HTML payload rendering Scalar API Reference pointing to /openapi.json.
 */
const SCALAR_HTML = `<!doctype html>
<html>
  <head>
    <title>OurEconomy API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

/**
 * Validates whether an incoming HTTP request originated from localhost.
 *
 * @param request - The incoming HTTP Request object.
 * @returns True if request is from localhost, false if remote or proxied.
 */
export function isLocalhost(request: Request): boolean {
	const url = new URL(request.url);
	const host = request.headers.get("host")?.split(":")[0] ?? "";
	const forwardedFor = request.headers.get("x-forwarded-for");
	const cfConnectingIp = request.headers.get("cf-connecting-ip");

	// Block if routed through Cloudflare or external proxy headers
	if (cfConnectingIp) {
		return false;
	}

	if (
		forwardedFor &&
		!forwardedFor.includes("127.0.0.1") &&
		!forwardedFor.includes("::1")
	) {
		return false;
	}

	const validHosts = ["localhost", "127.0.0.1", "::1", "[::1]"];
	return (
		validHosts.includes(url.hostname.toLowerCase()) ||
		validHosts.includes(host.toLowerCase())
	);
}

/**
 * Handles GET /docs requests, serving the Scalar interactive UI only to localhost callers.
 *
 * @param request - The incoming HTTP Request object.
 * @returns 200 HTML response on localhost, 403 Forbidden for remote callers.
 */
export function handleDocs(request: Request): Response {
	if (!isLocalhost(request)) {
		return new Response("Forbidden: /docs is only accessible from localhost.", {
			status: 403,
			headers: { "Content-Type": "text/plain" },
		});
	}

	return new Response(SCALAR_HTML, {
		status: 200,
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}
