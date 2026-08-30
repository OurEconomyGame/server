import { fireWorker } from "./fire.ts";
import { quitCompany } from "./quit.ts";
import { setCompanyWage } from "./wage.ts";
import { performWork } from "./work.ts";

export interface CompanyWorkerPayload {
	company_id?: number;
	company?: number;
	worker_id?: number;
	user_id?: number;
	wage?: number;
}

export async function handleCompanyWork(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}
	const p = payload as CompanyWorkerPayload;
	return await performWork(Number(p.company_id ?? p.company), authToken);
}

export async function handleCompanySetWage(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}
	const p = payload as CompanyWorkerPayload;
	return await setCompanyWage(
		Number(p.company_id ?? p.company),
		Number(p.wage),
		authToken,
	);
}

export async function handleCompanyFire(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}
	const p = payload as CompanyWorkerPayload;
	return await fireWorker(
		Number(p.company_id ?? p.company),
		Number(p.worker_id ?? p.user_id),
		authToken,
	);
}

export async function handleCompanyQuit(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}
	const p = payload as CompanyWorkerPayload;
	return await quitCompany(Number(p.company_id ?? p.company), authToken);
}
