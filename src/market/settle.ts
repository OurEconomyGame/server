import { getCompanyById, getUserById } from "../db/gets.ts";
import { updateCompanyById, updateUserById } from "../db/updates.ts";

/**
 * Adds resource quantity to a company inventory.
 */
export async function addCompanyResource(
	company_id: number,
	resource: number,
	quantity: number,
): Promise<boolean> {
	const company = await getCompanyById(company_id);
	if (!company) return false;
	const data = { ...company.data } as { inventory?: Record<number, number> };
	const inv = { ...(data.inventory ?? {}) };
	inv[resource] = (inv[resource] ?? 0) + quantity;
	data.inventory = inv;
	const updated = await updateCompanyById(company_id, { data });
	return updated !== null;
}

/**
 * Deducts resource quantity from a company inventory.
 */
export async function deductCompanyResource(
	company_id: number,
	resource: number,
	quantity: number,
): Promise<boolean> {
	const company = await getCompanyById(company_id);
	if (!company) return false;
	const data = { ...company.data } as { inventory?: Record<number, number> };
	const inv = { ...(data.inventory ?? {}) };
	const current = inv[resource] ?? 0;
	if (current < quantity) return false;
	inv[resource] = current - quantity;
	data.inventory = inv;
	const updated = await updateCompanyById(company_id, { data });
	return updated !== null;
}

/**
 * Adds (or deducts if negative) cash to a company treasury.
 */
export async function addCompanyCash(
	company_id: number,
	amount: number,
): Promise<boolean> {
	const company = await getCompanyById(company_id);
	if (!company) return false;
	const updated = await updateCompanyById(company_id, {
		cash: company.cash + amount,
	});
	return updated !== null;
}

/**
 * Adds resource quantity to a user's inventory.
 */
export async function addUserResource(
	user_id: number,
	resource: number,
	quantity: number,
): Promise<boolean> {
	const user = await getUserById(user_id);
	if (!user) return false;
	const data = { ...((user.data as Record<string, unknown>) ?? {}) } as {
		inventory?: Record<number, number>;
	};
	const inv = { ...(data.inventory ?? {}) };
	inv[resource] = (inv[resource] ?? 0) + quantity;
	data.inventory = inv;
	const updated = await updateUserById(user_id, { data });
	return updated !== null;
}

/**
 * Adds (or deducts if negative) cash to a user's personal balance.
 */
export async function addUserCash(
	user_id: number,
	amount: number,
): Promise<boolean> {
	const user = await getUserById(user_id);
	if (!user) return false;
	const updated = await updateUserById(user_id, {
		cash: user.cash + amount,
	});
	return updated !== null;
}

/**
 * Delivers purchased resource to either a company (positive ID) or user (0 or negative ID).
 */
export async function deliverResource(
	entityId: number,
	resource: number,
	quantity: number,
): Promise<boolean> {
	if (entityId > 0) {
		return await addCompanyResource(entityId, resource, quantity);
	}
	const userId = Math.abs(entityId);
	return await addUserResource(userId, resource, quantity);
}
