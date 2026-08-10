import { query } from "../db/init.ts";
import { insertSession } from "../db/inserts.ts";

export async function createSession(user_id: number): Promise<string> {
  return "hello";
}
export async function doesTokenExist(token: string): Promise<boolean> {
  const result = await query<{ id: number }>(
    `
    ?[id] := *session{id, token}, token == $token
  `,
    { token }
  );
  return result.length > 0;
}

export async function doesUserIdExist(user_id: number): Promise<string> {
  const result = await query<{ token: string }>(
    `
    ?[token] := *session{user_id, token}, user_id == $user_id
  `,
    { user_id }
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
