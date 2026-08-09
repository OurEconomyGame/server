import parseCookies from "./cookie_parse.ts";

export default async function route(request) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  const params = Object.fromEntries(url.searchParams.entries());
  const cookies = parseCookies(request.headers.get("cookie") || "");

  console.log("Request Received at URL: ", url);

  switch (path) {
    case "/version":
      return Response.json({ version: details.version });

    default:
      return new Response("Not Found", { status: 404 });
  }
}
