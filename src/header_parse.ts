/**
 * Parses request headers to extract the Auth field.
 *
 * @param headers - The incoming Request Headers object.
 * @returns The authentication token if present, or null.
 */
export function parseAuthHeader(headers: Headers): string | null {
	const auth = headers.get("Auth") || headers.get("Authorization");
	return auth ? auth.trim() : null;
}

export default parseAuthHeader;
