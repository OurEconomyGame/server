import { db } from "./init.ts";

/**
 * Expected schema definitions for all database relations.
 */
export const EXPECTED_SCHEMA: Record<string, string[]> = {
	user: [
		"id",
		"name",
		"pass_hash",
		"email",
		"last_accessed",
		"cash",
		"data",
		"created_at",
	],
	session: ["id", "user_id", "created_at", "token"],
	company: [
		"id",
		"name",
		"founder_id",
		"type",
		"last_accessed",
		"cash",
		"created_at",
		"ceo",
		"data",
		"shares_outstanding",
	],
	shares: ["id", "owner_id", "owner_user", "quantity", "owned_id"],
	order: ["id", "company_id", "resource", "quantity", "unitPrice"],
	offer: ["id", "company_id", "resource", "quantity", "unitPrice"],
};

/**
 * Verifies that all expected database relations exist and match required column schemas.
 * Hard fails with an Error if any relation is missing or contains missing columns.
 */
export async function verifySchema(): Promise<void> {
	for (const [relName, expectedCols] of Object.entries(EXPECTED_SCHEMA)) {
		try {
			const res = (await db.run(`::columns ${relName}`)) as {
				rows: Array<[string, boolean, number, string, boolean]>;
			};
			if (!res || !Array.isArray(res.rows) || res.rows.length === 0) {
				throw new Error(
					`[DB] Schema validation hard failure: relation '${relName}' is missing or empty. Please run 'bun run migrate' to repair.`,
				);
			}
			const colNames = res.rows.map((r) => r[0]);
			const missingCols = expectedCols.filter((col) => !colNames.includes(col));
			if (missingCols.length > 0) {
				throw new Error(
					`[DB] Schema validation hard failure: relation '${relName}' is missing required column(s): ${missingCols.join(", ")}. Please run 'bun run migrate' to migrate the database schema.`,
				);
			}
		} catch (err: unknown) {
			const errMsg = String(err);
			if (errMsg.includes("Schema validation hard failure")) {
				throw err;
			}
			throw new Error(
				`[DB] Schema validation hard failure for relation '${relName}': ${errMsg}. Please run 'bun run migrate' to repair.`,
			);
		}
	}
}
