import { setCompanyWage } from "./wage.ts";
import { performWork } from "./work.ts";

export interface WorkHttpPayload {
	company_id?: number;
	company?: number;
	id?: number;
}

export interface SetWageHttpPayload {
	company_id?: number;
	company?: number;
	id?: number;
	wage?: number;
}

/**
 * Handles POST /company/work requests.
 */
export async function handleCompanyWork(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}
	const p = payload as WorkHttpPayload;
	const companyId = Number(p.company_id ?? p.company ?? p.id);
	return await performWork(companyId, authToken);
}

/**
 * Handles POST /company/wage requests.
 */
export async function handleCompanySetWage(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}
	const p = payload as SetWageHttpPayload;
	const companyId = Number(p.company_id ?? p.company ?? p.id);
	const wage = Number(p.wage);
	return await setCompanyWage(companyId, wage, authToken);
}
