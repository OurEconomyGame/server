/**
 * Checks if a given origin, host, or URL belongs to *.napp9.com or napp9.com.
 *
 * @param originOrHost - Origin URL, hostname, or Host header string.
 * @returns True if domain is napp9.com or a subdomain of napp9.com.
 */
export function isNapp9Domain(
	originOrHost: string | null | undefined,
): boolean {
	if (!originOrHost || typeof originOrHost !== "string") {
		return false;
	}

	const trimmed = originOrHost.trim().toLowerCase();
	if (!trimmed) return false;

	try {
		let hostname = trimmed;
		if (trimmed.includes("://")) {
			hostname = new URL(trimmed).hostname.toLowerCase();
		} else {
			hostname = trimmed.split(":")[0]?.trim().toLowerCase() ?? "";
		}

		return hostname === "napp9.com" || hostname.endsWith(".napp9.com");
	} catch {
		return false;
	}
}

/**
 * Validates whether an incoming Request originates from a *.napp9.com domain.
 *
 * @param request - The incoming HTTP Request object.
 * @returns True if request origin, host header, referer, or URL matches *.napp9.com.
 */
export function isNapp9Request(request: Request): boolean {
	const origin = request.headers.get("origin");
	if (origin && isNapp9Domain(origin)) {
		return true;
	}

	const host = request.headers.get("host");
	if (host && isNapp9Domain(host)) {
		return true;
	}

	const referer = request.headers.get("referer");
	if (referer && isNapp9Domain(referer)) {
		return true;
	}

	try {
		const url = new URL(request.url);
		if (isNapp9Domain(url.hostname)) {
			return true;
		}
	} catch {}

	return false;
}
