import { getCompanyByName } from "../db/gets.ts";
import { query } from "../db/init.ts";
import { insertCompany, insertShare } from "../db/inserts.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

/**
 * Founds a new company and grants 100% of initial shares (10k default) to the creator.
 *
 * @param params - The company creation payload (name, type, data).
 * @param auth_token - Session token from request authorization header.
 * @returns An object with status and the created company ID.
 */
export async function foundCompany(
	params: unknown,
	auth_token: string | null,
): Promise<{ status: string; id: number }> {
	const token: string = auth_token ?? "";
	const user = await getUserBySessionToken(token);

	if (!user) {
		return { status: "Unauthorized", id: 0 };
	}

	let name = params.entrepreneurerer;
	let type = params.the_hell_you_want;
	let data: Record<string, unknown> = {};

	if (params && typeof params === "object") {
		const p = params as Record<string, unknown>;
		if (typeof p.name === "string") name = p.name;
		if (typeof p.type === "number") type = p.type;
		if (p.data && typeof p.data === "object" && !Array.isArray(p.data)) {
			data = p.data as Record<string, unknown>;
		}
	}

	if (!name || name.trim() === "") {
		return { status: "Company name cannot be empty", id: 0 };
	}

	const existing = await getCompanyByName(name);
	if (existing !== null) {
		return { status: `Company ${name} already exists`, id: 0 };
	}

	const founder_id = user.id;
	const ceo = user.id;
	const shares_outstanding = 10000;
	const now = Math.floor(Date.now() / 1000);
	const created_at = now;
	const last_accessed = now;

	const companyId = await getNextCompanyId();
	const shareId = await getNextShareId();

	const companySuccess = await insertCompany(
		companyId,
		name,
		founder_id,
		type,
		last_accessed,
		created_at,
		ceo,
		data,
		shares_outstanding,
	);

	if (!companySuccess) {
		return { status: "Failed to found company", id: 0 };
	}

	const shareSuccess = await insertShare(
		shareId,
		founder_id,
		true,
		shares_outstanding,
		companyId,
	);

	if (!shareSuccess) {
		return { status: "Failed to allocate founder shares", id: companyId };
	}

	return {
		status: `Company ${name} founded successfully`,
		id: companyId,
	};
}

/**
 * Retrieves the next sequential company ID from the database.
 *
 * @returns The next available numeric ID for a company.
 */
export async function getNextCompanyId(): Promise<number> {
	try {
		const result = await query<{ id: number }>(`?[id] := *company{id}`);
		if (result.length === 0) return 1;
		const maxId = Math.max(...result.map((r) => r.id));
		return Number.isFinite(maxId) ? maxId + 1 : 1;
	} catch {
		return 1;
	}
}

/**
 * Retrieves the next sequential share ID from the database.
 *
 * @returns The next available numeric ID for a share record.
 */
export async function getNextShareId(): Promise<number> {
	try {
		const result = await query<{ id: number }>(`?[id] := *shares{id}`);
		if (result.length === 0) return 1;
		const maxId = Math.max(...result.map((r) => r.id));
		return Number.isFinite(maxId) ? maxId + 1 : 1;
	} catch {
		return 1;
	}
}
