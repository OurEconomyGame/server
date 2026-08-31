import { getUserById, getUserByName } from "../db/gets.ts";
import { insertMessage } from "../db/inserts.ts";
import { getUserBySessionToken } from "../sessions/check.ts";
import { getNextMessageId } from "./ids.ts";

export interface SendMessageParams {
	receiver_id?: number;
	to?: number | string;
	receiver?: number | string;
	recipient?: number | string;
	subject?: string;
	content?: string;
	body?: string;
	message?: string;
}

export interface SendMessageResponse {
	status: string;
	id?: number;
	sender_id?: number;
	receiver_id?: number;
	subject?: string;
	content?: string;
}

/**
 * Handles sending a message from the authenticated user to a recipient.
 *
 * @param params - Payload containing recipient and message body.
 * @param authToken - Session authentication token from request headers.
 * @returns Result object with sent message details.
 */
export async function handleSendMessage(
	params: unknown,
	authToken: string | null,
): Promise<SendMessageResponse> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const sender = await getUserBySessionToken(authToken);
	if (!sender) {
		return { status: "Invalid or expired session token" };
	}

	if (!params || typeof params !== "object" || Array.isArray(params)) {
		return { status: "Invalid message payload" };
	}

	const p = params as SendMessageParams;

	// Resolve recipient
	let targetReceiverId: number | null = null;

	if (typeof p.receiver_id === "number") {
		targetReceiverId = p.receiver_id;
	} else if (typeof p.to === "number") {
		targetReceiverId = p.to;
	} else if (typeof p.receiver === "number") {
		targetReceiverId = p.receiver;
	} else if (typeof p.recipient === "number") {
		targetReceiverId = p.recipient;
	} else if (typeof p.to === "string" && p.to.trim() !== "") {
		const targetUser = await getUserByName(p.to.trim());
		if (targetUser) targetReceiverId = targetUser.id;
	} else if (typeof p.receiver === "string" && p.receiver.trim() !== "") {
		const targetUser = await getUserByName(p.receiver.trim());
		if (targetUser) targetReceiverId = targetUser.id;
	} else if (typeof p.recipient === "string" && p.recipient.trim() !== "") {
		const targetUser = await getUserByName(p.recipient.trim());
		if (targetUser) targetReceiverId = targetUser.id;
	}

	if (targetReceiverId === null) {
		return { status: "Missing recipient (receiver_id or recipient name)" };
	}

	const receiver = await getUserById(targetReceiverId);
	if (!receiver) {
		return { status: `Recipient user not found: ${targetReceiverId}` };
	}

	const subjectRaw = typeof p.subject === "string" ? p.subject.trim() : "";
	const subject = subjectRaw === "" ? "(No Subject)" : subjectRaw;

	const contentRaw =
		typeof p.content === "string"
			? p.content
			: typeof p.body === "string"
				? p.body
				: typeof p.message === "string"
					? p.message
					: "";
	const content = contentRaw.trim();

	if (content === "") {
		return { status: "Message content cannot be empty" };
	}

	const messageId = await getNextMessageId();
	const inserted = await insertMessage(
		messageId,
		sender.id,
		receiver.id,
		content,
		subject,
	);

	if (!inserted) {
		return { status: "Failed to store message in database" };
	}

	return {
		status: "Success",
		id: messageId,
		sender_id: sender.id,
		receiver_id: receiver.id,
		subject,
		content,
	};
}
