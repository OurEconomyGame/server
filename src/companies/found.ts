import { getUserBySessionToken } from "../sessions/check";

export async function foundCompany(params: unknown, auth_token: string | null) {
  const token: string = (auth_token !== null) ? auth_token | "";
  const user = getUserBySessionToken(token);
  return { status: "Unimplemented" };
}
