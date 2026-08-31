import { getAllCompanies } from "../../db/gets.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import type { CompanyPublicInfo } from "./list.ts";

/**
 * Retrieves all companies where a specific user is CEO.
 * Defaults to the authenticated user from auth_token, or accepts ?user_id / ?id / ?ceo query param.
 * Includes full internal company data if the requesting user is the CEO.
 *
 * @param params - Optional query parameters containing target user ID.
 * @param auth_token - Session token for authentication.
 * @returns Object with status, user_id, and list of CEO companies.
 */
export async function getCompaniesByCeo(
	params?: Record<string, string> | null,
	auth_token?: string | null,
): Promise<{
	status: string;
	user_id: number;
	companies: CompanyPublicInfo[];
}> {
	const authUser = auth_token ? await getUserBySessionToken(auth_token) : null;

	let targetUserId: number | null = null;

	if (params?.user_id !== undefined) {
		const parsed = Number(params.user_id);
		if (!Number.isNaN(parsed)) targetUserId = parsed;
	} else if (params?.id !== undefined) {
		const parsed = Number(params.id);
		if (!Number.isNaN(parsed)) targetUserId = parsed;
	} else if (params?.ceo !== undefined) {
		const parsed = Number(params.ceo);
		if (!Number.isNaN(parsed)) targetUserId = parsed;
	} else if (authUser) {
		targetUserId = authUser.id;
	}

	if (targetUserId === null) {
		return {
			status: "Unauthorized or missing user ID",
			user_id: 0,
			companies: [],
		};
	}

	const allCompanies = await getAllCompanies();
	const ceoCompanies = allCompanies.filter((c) => c.ceo === targetUserId);

	const result: CompanyPublicInfo[] = ceoCompanies.map((c) => {
		const wage =
			typeof c.data?.wage === "number" && Number.isFinite(c.data.wage)
				? (c.data.wage as number)
				: 10;

		const info: CompanyPublicInfo = {
			id: c.id,
			name: c.name,
			founder_id: c.founder_id,
			type: c.type,
			last_accessed: c.last_accessed,
			cash: c.cash,
			created_at: c.created_at,
			ceo: c.ceo,
			shares_outstanding: c.shares_outstanding,
			wage,
		};

		// WebStore companies expose public inventory and pricing
		if (c.type === 2) {
			const price =
				typeof c.data?.price === "number" && Number.isFinite(c.data.price)
					? (c.data.price as number)
					: typeof c.data?.food_price === "number" &&
							Number.isFinite(c.data.food_price)
						? (c.data.food_price as number)
						: 10;
			info.price = price;
			info.food_price = price;
			info.inventory = (c.data?.inventory ?? {}) as Record<number, number>;
		}

		// Include private `data` if authenticated user is the CEO
		if (authUser && authUser.id === c.ceo) {
			info.data = c.data;
		}

		return info;
	});

	// Sort by company ID ascending
	result.sort((a, b) => a.id - b.id);

	return {
		status: "Success",
		user_id: targetUserId,
		companies: result,
	};
}
