import { getMessageById, type MessageRecord } from "../db/gets.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface ReadMessageResponse {
	status: string;
	message?: MessageRecord;
}

/**
 * Handles reading a specific message by its message ID.
 * Access is granted to the message recipient, sender, or Admin (UID 0).
 *
 * @param params - Optional request body parameters.
 * @param queryParams - Optional URL query parameters.
 * @param authToken - Session authentication token from request headers.
 * @returns Result object containing the full message.
 */
export async function handleReadMessage(
	params: unknown,
	queryParams: Record<string, string> | null,
	authToken: string | null,
): Promise<ReadMessageResponse> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const caller = await getUserBySessionToken(authToken);
	if (!caller) {
		return { status: "Invalid or expired session token" };
	}

	let messageId: number | null = null;

	if (queryParams?.id !== undefined) {
		const parsed = Number(queryParams.id);
		if (Number.isFinite(parsed)) messageId = parsed;
	} else if (queryParams?.message_id !== undefined) {
		const parsed = Number(queryParams.message_id);
		if (Number.isFinite(parsed)) messageId = parsed;
	}

	if (messageId === null && params && typeof params === "object") {
		const p = params as Record<string, unknown>;
		if (typeof p.id === "number") {
			messageId = p.id;
		} else if (typeof p.message_id === "number") {
			messageId = p.message_id;
		} else if (typeof p.id === "string") {
			const parsed = Number(p.id);
			if (Number.isFinite(parsed)) messageId = parsed;
		}
	}

	if (messageId === null) {
		return { status: "Missing message ID (id or message_id)" };
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
		return { status: "Unauthorized to read this message" };
	}

	return {
		status: "Success",
		message,
	};
}
