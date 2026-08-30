import { getCompanyById, getUserById } from "../db/gets.ts";
import { updateCompanyById, updateUserById } from "../db/updates.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface InjectCashPayload {
	amount?: number;
	user_id?: number;
	company_id?: number;
}

/**
 * Handles cash injection/minting. Restricted to User ID 0 (root/admin).
 * Can inject cash to UID 0's balance, another user's balance, or a company's treasury.
 *
 * @param payload - Request body containing amount and optional target user_id or company_id.
 * @param authToken - Session token of the caller (must be user ID 0).
 * @returns Result object with status, injected amount, and updated balance.
 */
export async function handleCashInject(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const caller = await getUserBySessionToken(authToken);
	if (!caller) {
		return { status: "Invalid session token" };
	}

	if (caller.id !== 0) {
		return { status: "Forbidden: only user ID 0 can create cash" };
	}

	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = payload as InjectCashPayload;
	const amount = Number(p.amount);
	if (!Number.isFinite(amount) || amount <= 0) {
		return { status: "Amount must be a positive number" };
	}

	// 1. Target company treasury if company_id provided
	if (p.company_id !== undefined && p.company_id !== null) {
		const compId = Number(p.company_id);
		const company = await getCompanyById(compId);
		if (!company) {
			return { status: "Company not found" };
		}
		company.cash += amount;
		await updateCompanyById(company.id, { cash: company.cash });
		return {
			status: "Success",
			injected: amount,
			company_id: company.id,
			company_cash: company.cash,
		};
	}

	// 2. Target specified user or default to caller (UID 0)
	const targetUserId =
		p.user_id !== undefined && p.user_id !== null ? Number(p.user_id) : 0;
	const targetUser =
		targetUserId === 0 ? caller : await getUserById(targetUserId);

	if (!targetUser) {
		return { status: "User not found" };
	}

	targetUser.cash += amount;
	await updateUserById(targetUser.id, { cash: targetUser.cash });

	return {
		status: "Success",
		injected: amount,
		user_id: targetUser.id,
		user_cash: targetUser.cash,
	};
}
