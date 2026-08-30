import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById } from "../../db/updates.ts";
import { isCompanyCeo } from "../auth.ts";
import type { CompanyWorkData } from "./types.ts";

/**
 * Sets the company worker wage (CEO only).
 */
export async function setCompanyWage(
	companyId: number,
	wage: number,
	authToken: string | null,
): Promise<{ status: string; wage?: number }> {
	if (!Number.isFinite(companyId) || companyId <= 0) {
		return { status: "Missing or invalid company_id" };
	}
	if (!Number.isFinite(wage) || wage < 0) {
		return { status: "Wage must be a non-negative number" };
	}

	const isCeo = await isCompanyCeo(authToken, companyId);
	if (!isCeo) {
		return { status: "Only the CEO can set wages for this company" };
	}

	const company = await getCompanyById(companyId);
	if (!company) {
		return { status: "Company not found" };
	}

	const data = (company.data ?? {}) as CompanyWorkData;
	data.wage = wage;

	const updated = await updateCompanyById(companyId, { data });
	if (!updated) {
		return { status: "Failed to update company wage" };
	}

	return { status: "Success", wage };
}
