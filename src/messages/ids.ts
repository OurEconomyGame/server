import { getAllMessages } from "../db/gets.ts";

/**
 * Computes the next unique message ID.
 *
 * @returns A promise resolving to the next available message ID.
 */
export async function getNextMessageId(): Promise<number> {
	const all = await getAllMessages();
	if (all.length === 0) return 1;
	const maxId = Math.max(...all.map((m) => m.id));
	return maxId + 1;
}
