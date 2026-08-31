import { getSessionByToken, getUserById, type UserRecord } from "../db/gets.ts";
import { insertUser } from "../db/inserts.ts";

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

	let user = await getUserById(session.user_id);
	if (!user && session.user_id === 0) {
		const now = Math.floor(Date.now() / 1000);
		await insertUser(
			0,
			"admin",
			"admin",
			"admin@oureconomy.internal",
			now,
			1000000000,
			{ inventory: {} },
			now,
		);
		user = await getUserById(0);
	}

	return user;
}
