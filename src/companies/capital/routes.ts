import { depositCompanyCash } from "./deposit.ts";
import { distributeCompanyDividend } from "./dividend.ts";

export interface CapitalPayload {
	company_id?: number;
	company?: number;
	amount?: number;
}

/**
 * Handles POST /company/deposit.
 */
export async function handleCompanyDeposit(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}
	const p = payload as CapitalPayload;
	const companyId = Number(p.company_id ?? p.company);
	const amount = Number(p.amount);
	return await depositCompanyCash(companyId, amount, authToken);
}

/**
 * Handles POST /company/dividend.
 */
export async function handleCompanyDividend(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}
	const p = payload as CapitalPayload;
	const companyId = Number(p.company_id ?? p.company);
	const amount = Number(p.amount);
	return await distributeCompanyDividend(companyId, amount, authToken);
}
