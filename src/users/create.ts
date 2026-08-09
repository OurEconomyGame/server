import { query } from "../db/init.ts";

/**
 * Creates a new user with the given parameters.
 *
 * @param params - The user parameters.
 * @returns A Response object indicating status.
 */
export function createUser(params: unknown): Response {
	return Response.json({ status: "UNIMPLEMENTED", id: 0 });
}
