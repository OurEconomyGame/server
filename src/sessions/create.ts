import { query } from "../db/init.ts";
import { insertSession } from "../db/inserts.ts";

export async function createSession(user_id: number): Promise<string> {
  const existing_token = await doesUserIdExist(user_id);
  if (existing_token !== "") return existing_token;
  let token = Bun.randomUUIDv7();
  while (await doesTokenExist(token)) {
    token = Bun.randomUUIDv7();
  }
  await insertSession(
    await getNextSessionId(),
    Math.floor(Date.now() / 1000),
    token,
    user_id,
  );
  return token;
}
export async function doesTokenExist(token: string): Promise<boolean> {
  const result = await query<{ id: number }>(
    `
    ?[id] := *session{id, token}, token == $token
  `,
    { token },
  );
  return result.length > 0;
}

export async function doesUserIdExist(user_id: number): Promise<string> {
  const result = await query<{ token: string }>(
    `
    ?[token] := *session{user_id, token}, user_id == $user_id
  `,
    { user_id },
  );
  if (result.length > 0 && typeof result[0]?.token === "string") {
    return result[0].token;
  }
  return "";
}

export async function getNextSessionId(): Promise<number> {
  const result = await query<{ max_id: number }>(`
		?[max_id] := max(id), *session{id}
	`);

  if (result.length > 0 && result[0] && typeof result[0].max_id === "number") {
    return result[0].max_id + 1;
  }
  return 1;
}
