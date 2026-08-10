import { getUserByName } from "../db/gets.ts";
import { query } from "../db/init.ts";
import { insertUser } from "../db/inserts.ts";
import { createSession } from "../sessions/create.ts";

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

	const existingUser = await getUserByName(username);
	if (existingUser !== null)
		return { status: `${username} is convicted of identity theft`, id: 0 };

	const password = paramsObj.secret;
	const pass_hash = await Bun.password.hash(password);
	const date = Math.floor(Date.now() / 1000);
	const id = await getNextUserId();
	const success = await insertUser(
		id,
		username,
		pass_hash,
		"none",
		date,
		{},
		date,
	);
	let token = "";
	if (success) {
		token = await createSession(id);
	}
	return {
		status: success
			? `${username} spontaniously materialised`
			: `${username} was regejected from reality by a mousepad`,
		id: id,
		random: token,
	};
}

/**
 * Retrieves the largest user ID currently in the database and returns it plus one.
 *
 * @returns A promise that resolves to the next sequential user ID (defaults to 1 if no users exist).
 */
export async function getNextUserId(): Promise<number> {
	const result = await query<{ max_id: number }>(`
		?[max_id] := max(id), *user{id}
	`);

	if (result.length > 0 && result[0] && typeof result[0].max_id === "number") {
		return result[0].max_id + 1;
	}
	return 1;
}
