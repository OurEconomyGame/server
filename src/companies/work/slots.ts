import type { CompanyWorkData } from "./types.ts";

/**
 * Validates and assigns a worker slot for a user at a company.
 * Returns the worker index, or an error message.
 */
export function assignWorkerSlot(
	cData: CompanyWorkData,
	userId: number,
	today: string,
): { idx?: number; error?: string } {
	cData.workers = Array.isArray(cData.workers) ? cData.workers : [];
	cData.worked = Array.isArray(cData.worked) ? cData.worked : [];

	if (cData.last_work_day !== today) {
		cData.worked = cData.workers.map(() => false);
		cData.last_work_day = today;
	}

	const existing = cData.workers.indexOf(userId);
	if (existing !== -1) {
		if (cData.worked[existing]) {
			return { error: "You have already worked at this company today" };
		}
		return { idx: existing };
	}

	if (cData.workers.length >= 10) {
		return { error: "Company has no open worker positions (10/10 filled)" };
	}

	cData.workers.push(userId);
	cData.worked.push(false);
	return { idx: cData.workers.length - 1 };
}
