import { deleteMessageById } from "../db/deletes.ts";
import { getMessageById } from "../db/gets.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface DeleteMessageResponse {
	status: string;
	message_id?: number;
	deleted?: boolean;
}

/**
 * Handles deleting a message by its message ID.
 * Access is granted to the recipient, sender, or Admin (UID 0).
 *
 * @param params - Optional request body parameters.
 * @param queryParams - Optional URL query parameters (?message_id=X or ?id=X).
 * @param authToken - Session authentication token from request headers.
 * @returns Result object confirming deletion.
 */
export async function handleDeleteMessage(
	params: unknown,
	queryParams: Record<string, string> | null,
	authToken: string | null,
): Promise<DeleteMessageResponse> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const caller = await getUserBySessionToken(authToken);
	if (!caller) {
		return { status: "Invalid or expired session token" };
	}

	let messageId: number | null = null;

	if (queryParams?.message_id !== undefined) {
		const parsed = Number(queryParams.message_id);
		if (Number.isFinite(parsed)) messageId = parsed;
	} else if (queryParams?.id !== undefined) {
		const parsed = Number(queryParams.id);
		if (Number.isFinite(parsed)) messageId = parsed;
	}

	if (messageId === null && params && typeof params === "object") {
		const p = params as Record<string, unknown>;
		if (typeof p.message_id === "number") {
			messageId = p.message_id;
		} else if (typeof p.id === "number") {
			messageId = p.id;
		} else if (typeof p.message_id === "string") {
			const parsed = Number(p.message_id);
			if (Number.isFinite(parsed)) messageId = parsed;
		} else if (typeof p.id === "string") {
			const parsed = Number(p.id);
			if (Number.isFinite(parsed)) messageId = parsed;
		}
	}

	if (messageId === null) {
		return { status: "Missing message ID (message_id or id)" };
	}

	const message = await getMessageById(messageId);
	if (!message) {
		return { status: `Message not found: ${messageId}` };
	}

	// Verify authorization: sender, recipient, or Admin (UID 0)
	if (
		caller.id !== message.receiver_id &&
		caller.id !== message.sender_id &&
		caller.id !== 0
	) {
		return { status: "Unauthorized to delete this message" };
	}

	const deleted = await deleteMessageById(messageId);
	if (!deleted) {
		return { status: "Failed to delete message from database" };
	}

	return {
		status: "Success",
		message_id: messageId,
		deleted: true,
	};
}
