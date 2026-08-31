import {
	getCompanyById,
	getSharesByOwner,
	getUserById,
	getUserByName,
	type UserRecord,
} from "../db/gets.ts";
import { insertUser } from "../db/inserts.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface UserShareholding {
	share_id: number;
	company_id: number;
	company_name: string;
	company_type: number;
	quantity: number;
	shares_outstanding: number;
	ownership_percentage: number;
}

export interface UserPublicProfile {
	id: number;
	username: string;
	joined: number;
	active: number;
	shareholdings: UserShareholding[];
	cash?: number;
	email?: string;
	data?: Record<string, unknown>;
	inventory?: Record<number, number>;
}

export interface GetUserResponse {
	status: string;
	user: UserPublicProfile | null;
}

/**
 * Retrieves public information for a single user by ID or Username, including their shareholdings.
 * If authenticated by the user or admin (UID 0), includes private fields (cash, email, data, inventory).
 *
 * @param params - Search parameters containing `id` or `name`.
 * @param auth_token - Optional session token for private field visibility.
 * @returns An object with status and user profile or null.
 */
export async function getUserPublicInfo(
	params?: Record<string, string> | null,
	auth_token?: string | null,
): Promise<GetUserResponse> {
	if (
		!params ||
		(params.id === undefined &&
			params.name === undefined &&
			params.username === undefined)
	) {
		return { status: "Missing search parameters", user: null };
	}

	let user: UserRecord | null = null;

	if (params.id !== undefined) {
		const idNum = Number(params.id);
		if (!Number.isNaN(idNum)) {
			user = await getUserById(idNum);
			if (!user && idNum === 0) {
				const now = Math.floor(Date.now() / 1000);
				await insertUser(
					0,
					"admin",
					"admin",
					"admin@oureconomy.internal",
					now,
					1000000000,
					{ inventory: {} },
					now,
				);
				user = await getUserById(0);
			}
		}
	} else {
		const rawName = params.name ?? params.username;
		if (typeof rawName === "string" && rawName.trim() !== "") {
			user = await getUserByName(rawName.trim());
			if (!user && rawName.trim() === "admin") {
				const now = Math.floor(Date.now() / 1000);
				await insertUser(
					0,
					"admin",
					"admin",
					"admin@oureconomy.internal",
					now,
					1000000000,
					{ inventory: {} },
					now,
				);
				user = await getUserByName("admin");
			}
		}
	}

	if (!user) {
		return { status: "User not found", user: null };
	}

	const userShares = await getSharesByOwner(user.id, true);
	const shareholdings: UserShareholding[] = [];

	for (const share of userShares) {
		const company = await getCompanyById(share.owned_id);
		const percentage =
			company && company.shares_outstanding > 0
				? Number(
						((share.quantity / company.shares_outstanding) * 100).toFixed(4),
					)
				: 0;

		shareholdings.push({
			share_id: share.id,
			company_id: share.owned_id,
			company_name: company ? company.name : "Unknown",
			company_type: company ? company.type : 0,
			quantity: share.quantity,
			shares_outstanding: company ? company.shares_outstanding : 0,
			ownership_percentage: percentage,
		});
	}

	// Sort shareholdings by quantity descending
	shareholdings.sort((a, b) => b.quantity - a.quantity);

	const authUser = auth_token ? await getUserBySessionToken(auth_token) : null;
	const isOwnerOrAdmin = authUser && (authUser.id === user.id || authUser.id === 0);

	const profile: UserPublicProfile = {
		id: user.id,
		username: user.name,
		joined: user.created_at,
		active: user.last_accessed,
		shareholdings,
	};

	if (isOwnerOrAdmin) {
		profile.cash = user.cash;
		profile.email = user.email;
		profile.data = user.data;
		profile.inventory = (user.data?.inventory ?? {}) as Record<number, number>;
	}

	return {
		status: "Success",
		user: profile,
	};
}
