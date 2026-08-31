import {
	getMessageById,
	getMessagesByReceiver,
	type MessageRecord,
} from "../db/gets.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface ReceiveMessagesResponse {
	status: string;
	user_id?: number;
	message?: MessageRecord;
	messages?: MessageRecord[];
}

/**
 * Handles receiving messages for the authenticated user (or target user if Admin).
 *
 * @param params - Optional request body parameters.
 * @param queryParams - Optional URL query parameters.
 * @param authToken - Session authentication token from request headers.
 * @returns Result object containing received message(s).
 */
export async function handleReceiveMessages(
	params: unknown,
	queryParams: Record<string, string> | null,
	authToken: string | null,
): Promise<ReceiveMessagesResponse> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const caller = await getUserBySessionToken(authToken);
	if (!caller) {
		return { status: "Invalid or expired session token" };
	}

	// Check if a specific message ID was requested
	let messageId: number | null = null;

	if (queryParams?.message_id !== undefined) {
		const parsed = Number(queryParams.message_id);
		if (Number.isFinite(parsed)) messageId = parsed;
	} else if (params && typeof params === "object") {
		const p = params as Record<string, unknown>;
		if (typeof p.message_id === "number") {
			messageId = p.message_id;
		}
	}

	if (messageId !== null) {
		const msg = await getMessageById(messageId);
		if (!msg) {
			return { status: `Message not found: ${messageId}` };
		}
		if (caller.id !== msg.receiver_id && caller.id !== 0) {
			return { status: "Unauthorized to receive this message" };
		}
		return {
			status: "Success",
			user_id: caller.id,
			message: msg,
		};
	}

	let targetUserId = caller.id;
	if (queryParams?.id !== undefined || queryParams?.user_id !== undefined) {
		const parsed = Number(queryParams.id ?? queryParams.user_id);
		if (Number.isFinite(parsed)) {
			if (caller.id !== parsed && caller.id !== 0) {
				return { status: "Unauthorized to receive messages for another user" };
			}
			targetUserId = parsed;
		}
	}

	const messages = await getMessagesByReceiver(targetUserId);

	return {
		status: "Success",
		user_id: targetUserId,
		messages,
	};
}
