import { query } from "../db/init.ts";
import { insertSession } from "../db/inserts.ts";

export async function getNextSessionId(): Promise<number> {
  const result = await query<{ max_id: number }>(`
		?[max_id] := max(id), *session{id}
	`);

  if (result.length > 0 && result[0] && typeof result[0].max_id === "number") {
    return result[0].max_id + 1;
  }
  return 1;
}
