import { getUserBySessionToken } from "../sessions/check.ts";

export async function foundCompany(
	params: unknown,
	auth_token: string | null,
) {
	const token: string = auth_token ?? "";
	const user = await getUserBySessionToken(token);
	return { status: "Unimplemented" };
}

