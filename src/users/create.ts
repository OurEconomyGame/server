import { query } from "../db/init.ts";

/**
 * Creates a new user with the given parameters.
 *
 * @param params - The user parameters.
 * @returns An object indicating the response status and user ID.
 */
export async function createUser(
	params: unknown,
): Promise<Record<string, unknown>> {
	if (!params || typeof params !== "object") {
		return { status: "INVALID INPUT", id: 0 };
	}

	const paramsObj = params as Record<string, unknown>;

	if (
		typeof paramsObj.hi !== "string" ||
		typeof paramsObj.secret !== "string"
	) {
		return { status: "INVALID INPUT", id: 0 };
	}

	const username = paramsObj.hi;
	const password = paramsObj.secret;
	const pass_hash = await Bun.password.hash(password);
	const date = Math.floor(Date.now() / 1000);

	return { status: "UNIMPLEMENTED", id: 0 };
}
