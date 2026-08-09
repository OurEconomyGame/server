import details from "../package.json" assert { type: "json" };
import parseCookies from "./cookie_parse.ts";

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

  console.log("Request Received at URL: ", url);

  switch (path) {
    case "/version":
      return Response.json({ version: details.version });

    case "/users":
      return Response.json({ users: ["test1", "test2"] });

    default:
      return new Response("Not Found", { status: 404 });
  }
}
