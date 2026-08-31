import { getAllUsers } from "../db/gets.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface PublicUser {
	id: number;
	username: string;
	joined: number;
	active: number;
	cash?: number;
	email?: string;
	data?: Record<string, unknown>;
	inventory?: Record<number, number>;
}

export async function getAllUsersPublicInfo(
	params?: Record<string, unknown> | null,
	auth_token?: string | null,
) {
	const caller = auth_token ? await getUserBySessionToken(auth_token) : null;
	const isAdmin = caller?.id === 0;
	const sortBy = params?.sortBy;
	const users = await getAllUsers();

	const publicInfo: PublicUser[] = [];

	for (const user of users) {
		if (user.id === 0 && !isAdmin) continue;
		const info: PublicUser = {
			id: user.id,
			username: user.name,
			joined: user.created_at,
			active: user.last_accessed,
		};
		if (isAdmin) {
			info.cash = user.cash;
			info.email = user.email;
			info.data = user.data;
			info.inventory = (user.data?.inventory ?? {}) as Record<number, number>;
		}
		publicInfo.push(info);
	}
	switch (sortBy) {
		case "name":
			publicInfo.sort((a, b) => a.username.localeCompare(b.username));
			break;
		default:
			publicInfo.sort((a, b) => a.id - b.id);
			break;
	}
	return publicInfo;
}
