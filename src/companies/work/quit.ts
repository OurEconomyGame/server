import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById } from "../../db/updates.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import type { CompanyWorkData } from "./types.ts";

/**
 * Quits an employment position at a company (Worker only).
 */
export async function quitCompany(
	companyId: number,
	authToken: string | null,
): Promise<{ status: string; quit_company_id?: number }> {
	if (!authToken) return { status: "Authentication token required" };
	if (!Number.isFinite(companyId) || companyId <= 0)
		return { status: "Invalid company_id" };

	const user = await getUserBySessionToken(authToken);
	if (!user) return { status: "Invalid session token" };

	const company = await getCompanyById(companyId);
	if (!company) return { status: "Company not found" };

	const cData = (company.data ?? {}) as CompanyWorkData;
	if (Array.isArray(cData.workers)) {
		const idx = cData.workers.indexOf(user.id);
		if (idx !== -1) {
			cData.workers.splice(idx, 1);
			if (Array.isArray(cData.worked)) {
				cData.worked.splice(idx, 1);
			}
			await updateCompanyById(companyId, { data: cData });
		}
	}

	return { status: "Success", quit_company_id: companyId };
}
