import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById } from "../../db/updates.ts";
import { isCompanyCeo } from "../auth.ts";
import type { CompanyWorkData } from "./types.ts";

/**
 * Fires a worker from the company roster (CEO only).
 */
export async function fireWorker(
	companyId: number,
	workerId: number,
	authToken: string | null,
): Promise<{ status: string; fired_worker_id?: number }> {
	if (!Number.isFinite(companyId) || companyId <= 0)
		return { status: "Invalid company_id" };
	if (!Number.isFinite(workerId) || workerId <= 0)
		return { status: "Invalid worker_id" };

	const isCeo = await isCompanyCeo(authToken, companyId);
	if (!isCeo) {
		return { status: "Only the CEO can fire workers from this company" };
	}

	const company = await getCompanyById(companyId);
	if (!company) return { status: "Company not found" };

	const cData = (company.data ?? {}) as CompanyWorkData;
	if (Array.isArray(cData.workers)) {
		const idx = cData.workers.indexOf(workerId);
		if (idx !== -1) {
			cData.workers.splice(idx, 1);
			if (Array.isArray(cData.worked)) {
				cData.worked.splice(idx, 1);
			}
			await updateCompanyById(companyId, { data: cData });
		}
	}

	return { status: "Success", fired_worker_id: workerId };
}
