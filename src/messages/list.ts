import { getMessagesByReceiver, type MessageRecord } from "../db/gets.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface MessageSummary {
	id: number;
	sender_id: number;
	receiver_id: number;
	subject: string;
}

export interface ListMessagesResponse {
	status: string;
	user_id?: number;
	messages?: MessageSummary[];
}

/**
 * Lists subjects and senders for messages directed to a user.
 * Supports ?id= / ?user_id= querying for Admin (UID 0) or the user themselves.
 *
 * @param params - Query parameters (?id=X or ?user_id=X).
 * @param authToken - Session authentication token from request headers.
 * @returns Result object with array of message summaries.
 */
export async function handleListMessages(
	params: Record<string, string> | null,
	authToken: string | null,
): Promise<ListMessagesResponse> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const caller = await getUserBySessionToken(authToken);
	if (!caller) {
		return { status: "Invalid or expired session token" };
	}

	let targetUserId = caller.id;
	if (params?.id !== undefined || params?.user_id !== undefined) {
		const parsed = Number(params.id ?? params.user_id);
		if (Number.isFinite(parsed)) {
			if (caller.id !== parsed && caller.id !== 0) {
				return { status: "Unauthorized to view messages for another user" };
			}
			targetUserId = parsed;
		}
	}

	const messages: MessageRecord[] = await getMessagesByReceiver(targetUserId);

	const summaries: MessageSummary[] = messages.map((m) => ({
		id: m.id,
		sender_id: m.sender_id,
		receiver_id: m.receiver_id,
		subject: m.subject,
	}));

	return {
		status: "Success",
		user_id: targetUserId,
		messages: summaries,
	};
}
