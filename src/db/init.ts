import { existsSync, mkdirSync, rmSync } from "node:fs";
import { CozoDb } from "cozo-node";
import dotenv from "dotenv";

dotenv.config();

// 1. Ensure directory exists for RocksDB storage
const DB_DIR = process.env.DB_DIR ?? "./main.db";

if (!existsSync(DB_DIR)) {
	mkdirSync(DB_DIR, { recursive: true });
}

// 2. Initialize CozoDb with RocksDB
// Format: new CozoDb("rocksdb", path_to_directory)
export const db = new CozoDb("rocksdb", DB_DIR);

/**
 * Clean up database directory on process close if DEBUG=true.
 */
export function cleanupDbOnExit(): void {
	if (process.env.DEBUG === "true" && existsSync(DB_DIR)) {
		try {
			db.close();
		} catch {}
		try {
			rmSync(DB_DIR, { recursive: true, force: true });
			console.log("[DB] DEBUG=true: Database file deleted on process exit.");
		} catch (err: unknown) {
			console.error("[DB] Failed to delete database file on exit:", err);
		}
	}
}

process.on("exit", cleanupDbOnExit);
process.on("SIGINT", () => {
	cleanupDbOnExit();
	process.exit(0);
});
process.on("SIGTERM", () => {
	cleanupDbOnExit();
	process.exit(0);
});

export interface CozoQueryResult<_T = Record<string, unknown>> {
	ok: boolean;
	headers: string[];
	rows: Array<Array<unknown>>;
}

/**
 * Helper to run Datalog queries and return clean JS objects.
 *
 * @param datalog - The Datalog query string.
 * @param params - Optional parameter mapping for the query.
 * @returns A promise that resolves to an array of parsed results.
 */
export async function query<T = Record<string, unknown>>(
	datalog: string,
	params: Record<string, unknown> = {},
): Promise<T[]> {
	const result = (await db.run(datalog, params)) as CozoQueryResult<T>;

	if (result.ok === false) {
		throw new Error(`Cozo Query Error: ${JSON.stringify(result)}`);
	}

	const { headers, rows } = result;

	return rows.map((row) => {
		const obj: Record<string, unknown> = {};
		headers.forEach((header, index) => {
			obj[header] = row[index];
		});
		return obj as T;
	});
}

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

/**
 * Initialize relations with schema and hard-fail if existing schema is mismatched.
 */
export async function initDb(): Promise<void> {
	console.log(`[DB] Initializing CozoDB with RocksDB engine at: ${DB_DIR}`);

	try {
		await db.run(`
			:create user {
				id: Int
				=>
				name: String,
				pass_hash: String,
				email: String,
				last_accessed: Int,
				cash: Float,
				data: Json,
				created_at: Int
			}
		`);
		await db.run(`
			:create session {
				id: Int
				=>
				user_id: Int,
				created_at: Int,
				token: String
			}
		`);
		await db.run(`
			:create company {
				id: Int
				=>
				name: String,
				founder_id: Int,
				type: Int,
				last_accessed: Int,
				cash: Float,
				created_at: Int,
				ceo: Int,
				data: Json,
				shares_outstanding: Int
			}
		`);
		await db.run(`
			:create shares {
				id: Int
				=>
				owner_id: Int,
				owner_user: Bool,
				quantity: Int,
				owned_id: Int
			}
		`);
		await db.run(`
			:create order {
				id: Int
				=>
				company_id: Int,
				resource: Int,
				quantity: Float,
				unitPrice: Float
			}
		`);
		await db.run(`
			:create offer {
				id: Int
				=>
				company_id: Int,
				resource: Int,
				quantity: Float,
				unitPrice: Float
			}
		`);
		console.log("[DB] Schema initialized successfully.");
	} catch (err: unknown) {
		const errStr = JSON.stringify(err) + String(err);
		if (errStr.includes("already exists") || errStr.includes("conflicts")) {
			console.log("[DB] RocksDB schema loaded from disk.");
		} else {
			console.error("[DB] Failed to initialize schema:", err);
			throw err;
		}
	}

	// Verify schema integrity on loaded or initialized relations; hard fail on discrepancy
	await verifySchema();
}
