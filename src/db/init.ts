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

/**
 * Migrates existing relations if columns are missing from older database schemas.
 */
async function migrateSchema(): Promise<void> {
	// 1. Company migration (ensure 'cash' column exists)
	try {
		const res = (await db.run("::columns company")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		const colNames = res.rows.map((r) => r[0]);
		if (!colNames.includes("cash")) {
			console.log("[DB] Migrating 'company' relation to add 'cash' column...");
			const oldRows = (await db.run(`
				?[id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding}
			`)) as { rows: Array<unknown[]> };

			await db.run("::remove company");
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

			for (const row of oldRows.rows) {
				const [
					id,
					name,
					founder_id,
					type,
					last_accessed,
					created_at,
					ceo,
					data,
					shares_outstanding,
				] = row;
				await db.run(
					`
					?[id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding] <- [
						[$id, $name, $founder_id, $type, $last_accessed, 0.0, $created_at, $ceo, $data, $shares_outstanding]
					]
					:put company { id => name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding }
					`,
					{
						id,
						name,
						founder_id,
						type,
						last_accessed,
						created_at,
						ceo,
						data,
						shares_outstanding,
					},
				);
			}
			console.log("[DB] 'company' migration complete.");
		}
	} catch {}

	// 2. User migration (ensure 'cash' column exists)
	try {
		const res = (await db.run("::columns user")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		const colNames = res.rows.map((r) => r[0]);
		if (!colNames.includes("cash")) {
			console.log("[DB] Migrating 'user' relation to add 'cash' column...");
			const oldRows = (await db.run(`
				?[id, name, pass_hash, email, last_accessed, data, created_at] := *user{id, name, pass_hash, email, last_accessed, data, created_at}
			`)) as { rows: Array<unknown[]> };

			await db.run("::remove user");
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

			for (const row of oldRows.rows) {
				const [id, name, pass_hash, email, last_accessed, data, created_at] =
					row;
				await db.run(
					`
					?[id, name, pass_hash, email, last_accessed, cash, data, created_at] <- [
						[$id, $name, $pass_hash, $email, $last_accessed, 0.0, $data, $created_at]
					]
					:put user { id => name, pass_hash, email, last_accessed, cash, data, created_at }
					`,
					{ id, name, pass_hash, email, last_accessed, data, created_at },
				);
			}
			console.log("[DB] 'user' migration complete.");
		}
	} catch {}

	// 3. Order migration (ensure 'resource' column exists)
	try {
		const res = (await db.run("::columns order")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		const colNames = res.rows.map((r) => r[0]);
		if (!colNames.includes("resource")) {
			console.log("[DB] Migrating 'order' relation to add 'resource' column...");
			const oldRows = (await db.run(`
				?[id, company_id, quantity, unitPrice] := *order{id, company_id, quantity, unitPrice}
			`)) as { rows: Array<unknown[]> };

			await db.run("::remove order");
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

			for (const row of oldRows.rows) {
				const [id, company_id, quantity, unitPrice] = row;
				await db.run(
					`
					?[id, company_id, resource, quantity, unitPrice] <- [
						[$id, $company_id, 0, $quantity, $unitPrice]
					]
					:put order { id => company_id, resource, quantity, unitPrice }
					`,
					{ id, company_id, quantity, unitPrice },
				);
			}
			console.log("[DB] 'order' migration complete.");
		}
	} catch {}

	// 4. Offer migration (ensure 'resource' column exists)
	try {
		const res = (await db.run("::columns offer")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		const colNames = res.rows.map((r) => r[0]);
		if (!colNames.includes("resource")) {
			console.log("[DB] Migrating 'offer' relation to add 'resource' column...");
			const oldRows = (await db.run(`
				?[id, company_id, quantity, unitPrice] := *offer{id, company_id, quantity, unitPrice}
			`)) as { rows: Array<unknown[]> };

			await db.run("::remove offer");
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

			for (const row of oldRows.rows) {
				const [id, company_id, quantity, unitPrice] = row;
				await db.run(
					`
					?[id, company_id, resource, quantity, unitPrice] <- [
						[$id, $company_id, 0, $quantity, $unitPrice]
					]
					:put offer { id => company_id, resource, quantity, unitPrice }
					`,
					{ id, company_id, quantity, unitPrice },
				);
			}
			console.log("[DB] 'offer' migration complete.");
		}
	} catch {}

	// 5. User ID 1 to 0 migration (if user ID 1 is the only user and no ID 0 exists)
	try {
		const userRes = (await db.run(
			`?[id, name, pass_hash, email, last_accessed, cash, data, created_at] := *user{id, name, pass_hash, email, last_accessed, cash, data, created_at}`,
		)) as { rows: Array<unknown[]> };
		const ids = userRes.rows.map((r) => r[0] as number);
		if (userRes.rows.length === 1 && ids.includes(1) && !ids.includes(0)) {
			const [id, name, pass_hash, email, last_accessed, cash, data, created_at] =
				userRes.rows[0]!;
			console.log("[DB] Migrating single user ID 1 to ID 0...");

			// Remove user 1 and insert as user 0
			await db.run(`?[id] <- [[1]] :rm user { id }`);
			await db.run(
				`
				?[id, name, pass_hash, email, last_accessed, cash, data, created_at] <- [
					[0, $name, $pass_hash, $email, $last_accessed, $cash, $data, $created_at]
				]
				:put user { id => name, pass_hash, email, last_accessed, cash, data, created_at }
				`,
				{
					name,
					pass_hash,
					email,
					last_accessed,
					cash,
					data,
					created_at,
				},
			);

			// Update sessions where user_id == 1
			const sessionRes = (await db.run(
				`?[id, user_id, created_at, token] := *session{id, user_id, created_at, token}, user_id == 1`,
			)) as { rows: Array<unknown[]> };
			for (const s of sessionRes.rows) {
				const [sId, , sCreated, sToken] = s;
				await db.run(
					`
					?[id, user_id, created_at, token] <- [
						[$sId, 0, $sCreated, $sToken]
					]
					:put session { id => user_id, created_at, token }
					`,
					{ sId, sCreated, sToken },
				);
			}

			// Update shares where owner_id == 1 and owner_user == true
			const shareRes = (await db.run(
				`?[id, owner_id, owner_user, quantity, owned_id] := *shares{id, owner_id, owner_user, quantity, owned_id}, owner_id == 1, owner_user == true`,
			)) as { rows: Array<unknown[]> };
			for (const sh of shareRes.rows) {
				const [shId, , , shQty, shOwnedId] = sh;
				await db.run(
					`
					?[id, owner_id, owner_user, quantity, owned_id] <- [
						[$shId, 0, true, $shQty, $shOwnedId]
					]
					:put shares { id => owner_id, owner_user, quantity, owned_id }
					`,
					{ shId, shQty, shOwnedId },
				);
			}

			// Update companies where founder_id == 1 or ceo == 1
			const compRes = (await db.run(
				`?[id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding}`,
			)) as { rows: Array<unknown[]> };
			for (const c of compRes.rows) {
				const [
					cId,
					cName,
					cFounderId,
					cType,
					cLastAcc,
					cCash,
					cCreated,
					cCeo,
					cData,
					cSharesOut,
				] = c;
				if (cFounderId === 1 || cCeo === 1) {
					await db.run(
						`
						?[id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding] <- [
							[$cId, $cName, $cFounderId, $cType, $cLastAcc, $cCash, $cCreated, $cCeo, $cData, $cSharesOut]
						]
						:put company { id => name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding }
						`,
						{
							cId,
							cName,
							cFounderId: cFounderId === 1 ? 0 : cFounderId,
							cType,
							cLastAcc,
							cCash,
							cCreated,
							cCeo: cCeo === 1 ? 0 : cCeo,
							cData,
							cSharesOut,
						},
					);
				}
			}
			console.log("[DB] Migrated single user ID 1 to ID 0 successfully.");
		}
	} catch {}
}

/**
 * Initialize relations with schema and run automated migrations if needed.
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

	await migrateSchema();
}
