import { deleteUserById } from "../db/deletes.ts";
import { getUserById } from "../db/gets.ts";
import { query } from "../db/init.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface DeleteUserPayload {
	user_id?: number;
}

/**
 * Handles user account deletion.
 * A user can delete their own account, or UID 0 can delete any non-root user.
 * Performs cascading deletion of sessions, owned shares, user orders, and orphaned companies.
 */
export async function handleUserDelete(
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

	const p = (payload && typeof payload === "object" ? payload : {}) as DeleteUserPayload;
	const targetUserId =
		p.user_id !== undefined && p.user_id !== null ? Number(p.user_id) : caller.id;

	if (!Number.isFinite(targetUserId) || targetUserId < 0) {
		return { status: "Invalid user_id" };
	}

	if (targetUserId === 0) {
		return { status: "Root user (ID 0) cannot be deleted" };
	}

	if (caller.id !== 0 && caller.id !== targetUserId) {
		return { status: "Forbidden: You can only delete your own account" };
	}

	const targetUser = await getUserById(targetUserId);
	if (!targetUser) {
		return { status: "User not found" };
	}

	try {
		// 1. Delete all sessions for target user
		await query(
			`
			?[id] := *session{id, user_id}, user_id == $targetUserId
			:rm session { id }
			`,
			{ targetUserId },
		);

		// 2. Delete all shares owned by target user
		await query(
			`
			?[id] := *shares{id, owner_id, owner_user}, owner_id == $targetUserId, owner_user == true
			:rm shares { id }
			`,
			{ targetUserId },
		);

		// 3. Delete all resting orders for target user (stored with company_id == -targetUserId)
		const userOrderEntityId = -targetUserId;
		await query(
			`
			?[id] := *order{id, company_id}, company_id == $userOrderEntityId
			:rm order { id }
			`,
			{ userOrderEntityId },
		);

		// 4. Update or dissolve companies founded / governed by target user
		const userCompanies = await query<{ id: number; founder_id: number; ceo: number }>(
			`
			?[id, founder_id, ceo] := *company{id, founder_id, ceo}, (founder_id == $targetUserId or ceo == $targetUserId)
			`,
			{ targetUserId },
		);

		for (const comp of userCompanies) {
			if (comp.founder_id === targetUserId && comp.ceo === targetUserId) {
				// Cascading delete of orphaned company
				await query(`?[id] <- [[$id]] :rm company { id }`, { id: comp.id });
				await query(`?[id] := *shares{id, owned_id}, owned_id == $id :rm shares { id }`, { id: comp.id });
				await query(`?[id] := *order{id, company_id}, company_id == $id :rm order { id }`, { id: comp.id });
				await query(`?[id] := *offer{id, company_id}, company_id == $id :rm offer { id }`, { id: comp.id });
			} else {
				// Reassign CEO to 0
				await query(
					`
					?[id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding}, id == $id
					:put company { id => name, founder_id, type, last_accessed, cash, created_at, ceo: 0, data, shares_outstanding }
					`,
					{ id: comp.id },
				);
			}
		}

		// 5. Delete the user record
		await deleteUserById(targetUserId);

		return {
			status: "Success",
			deleted_user_id: targetUserId,
		};
	} catch (error: unknown) {
		console.error(`Failed to delete user ID ${targetUserId}:`, error);
		return { status: "Failed to delete user account" };
	}
}
