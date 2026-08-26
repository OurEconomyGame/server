import { getSessionByToken, getUserById, type UserRecord } from "../db/gets.ts";

/**
 * Retrieves the full user record associated with a given session token.
 *
 * @param token - The session token string.
 * @returns A promise that resolves to the UserRecord if found and valid, or null otherwise.
 */
export async function getUserBySessionToken(
	token: string,
): Promise<UserRecord | null> {
	if (!token || typeof token !== "string") {
		return null;
	}

	const session = await getSessionByToken(token);
	if (!session) {
		return null;
	}

	return await getUserById(session.user_id);
}
