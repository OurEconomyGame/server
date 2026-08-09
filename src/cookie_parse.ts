export default function parseCookies(
  cookieHeader: string,
): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [key, ...value] = cookie.split("=");
      return [key.trim(), value.join("=").trim()];
    }),
  );
}
