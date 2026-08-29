import { getCompanyById } from "../db/gets.ts";
import { updateCompanyById } from "../db/updates.ts";

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
