/**
 * Parses a cookie header string into a record of key-value pairs.
 *
 * @param cookieHeader - The raw cookie header string from the request headers.
 * @returns A record containing the parsed cookies.
 */
export default function parseCookies(
  cookieHeader: string,
): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const parts = cookie.split("=");
      const key = parts[0]?.trim() || "";
      const value = parts.slice(1).join("=").trim();
      return [key, value];
    }),
  );
}
