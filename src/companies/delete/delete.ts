import { deleteCompanyById } from "../../db/deletes.ts";
import { getCompanyById } from "../../db/gets.ts";
import { query } from "../../db/init.ts";
import { isCompanyCeo } from "../../market/auth.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";

export interface DeleteCompanyPayload {
	company_id?: number;
}

/**
 * Handles company deletion / dissolution.
 * Can be performed by the company CEO or User ID 0 (root/admin).
 * Cascades deletion of all shares, resting buy orders, resting sell offers, and subsidiary shareholdings.
 */
export async function handleCompanyDelete(
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

	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = payload as DeleteCompanyPayload;
	const companyId = Number(p.company_id);
	if (!Number.isFinite(companyId) || companyId <= 0) {
		return { status: "Missing or invalid company_id" };
	}

	const company = await getCompanyById(companyId);
	if (!company) {
		return { status: "Company not found" };
	}

	const isCeo = await isCompanyCeo(authToken, companyId);
	if (caller.id !== 0 && !isCeo) {
		return { status: "Only the company CEO or admin can delete this company" };
	}

	try {
		// 1. Delete all resting market orders for this company
		await query(
			`
			?[id] := *order{id, company_id}, company_id == $companyId
			:rm order { id }
			`,
			{ companyId },
		);

		// 2. Delete all resting market offers for this company
		await query(
			`
			?[id] := *offer{id, company_id}, company_id == $companyId
			:rm offer { id }
			`,
			{ companyId },
		);

		// 3. Delete all shares issued by this company
		await query(
			`
			?[id] := *shares{id, owned_id}, owned_id == $companyId
			:rm shares { id }
			`,
			{ companyId },
		);

		// 4. Delete all shares owned by this company in other companies
		await query(
			`
			?[id] := *shares{id, owner_id, owner_user}, owner_id == $companyId, owner_user == false
			:rm shares { id }
			`,
			{ companyId },
		);

		// 5. Delete company record
		await deleteCompanyById(companyId);

		return {
			status: "Success",
			deleted_company_id: companyId,
		};
	} catch (error: unknown) {
		console.error(`Failed to delete company ID ${companyId}:`, error);
		return { status: "Failed to delete company" };
	}
}
