import { db } from "./init.ts";

/**
 * Migrates existing relations if columns are missing from older database schemas.
 * This is a standalone tool that can be invoked via CLI (`bun run migrate` or `bun src/db/migrate.ts`).
 */
export async function migrateSchema(): Promise<void> {
	console.log("[DB Migration] Starting database schema migration...");

	// 1. Company migration (ensure 'cash' column exists)
	try {
		const res = (await db.run("::columns company")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		const colNames = res.rows.map((r) => r[0]);
		if (!colNames.includes("cash")) {
			console.log(
				"[DB Migration] Migrating 'company' relation to add 'cash' column...",
			);
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
			console.log("[DB Migration] 'company' migration complete.");
		}
	} catch (err) {
		console.warn(
			"[DB Migration] Skipping company migration (table may not exist yet):",
			err,
		);
	}

	// 2. User migration (ensure 'cash' column exists)
	try {
		const res = (await db.run("::columns user")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		const colNames = res.rows.map((r) => r[0]);
		if (!colNames.includes("cash")) {
			console.log(
				"[DB Migration] Migrating 'user' relation to add 'cash' column...",
			);
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
			console.log("[DB Migration] 'user' migration complete.");
		}
	} catch (err) {
		console.warn(
			"[DB Migration] Skipping user migration (table may not exist yet):",
			err,
		);
	}

	// 3. Order migration (ensure 'resource' column exists)
	try {
		const res = (await db.run("::columns order")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		const colNames = res.rows.map((r) => r[0]);
		if (!colNames.includes("resource")) {
			console.log(
				"[DB Migration] Migrating 'order' relation to add 'resource' column...",
			);
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
			console.log("[DB Migration] 'order' migration complete.");
		}
	} catch (err) {
		console.warn("[DB Migration] Skipping order migration:", err);
	}

	// 4. Offer migration (ensure 'resource' column exists)
	try {
		const res = (await db.run("::columns offer")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		const colNames = res.rows.map((r) => r[0]);
		if (!colNames.includes("resource")) {
			console.log(
				"[DB Migration] Migrating 'offer' relation to add 'resource' column...",
			);
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
			console.log("[DB Migration] 'offer' migration complete.");
		}
	} catch (err) {
		console.warn("[DB Migration] Skipping offer migration:", err);
	}

	// 5. Message relation creation (ensure 'message' table exists)
	try {
		const res = (await db.run("::columns message")) as {
			rows: Array<[string, boolean, number, string, boolean]>;
		};
		if (!res || !Array.isArray(res.rows) || res.rows.length === 0) {
			console.log("[DB Migration] Creating 'message' relation...");
			await db.run(`
				:create message {
					id: Int
					=>
					sender_id: Int,
					receiver_id: Int,
					content: String,
					subject: String
				}
			`);
			console.log("[DB Migration] 'message' relation created.");
		}
	} catch {
		try {
			console.log("[DB Migration] Creating 'message' relation...");
			await db.run(`
				:create message {
					id: Int
					=>
					sender_id: Int,
					receiver_id: Int,
					content: String,
					subject: String
				}
			`);
			console.log("[DB Migration] 'message' relation created.");
		} catch (err) {
			console.warn("[DB Migration] Could not create 'message' relation:", err);
		}
	}

	// 6. User ID 1 to 0 migration (if user ID 1 is the only user and no ID 0 exists)
	try {
		const userRes = (await db.run(
			`?[id, name, pass_hash, email, last_accessed, cash, data, created_at] := *user{id, name, pass_hash, email, last_accessed, cash, data, created_at}`,
		)) as { rows: Array<unknown[]> };
		const ids = userRes.rows.map((r) => r[0] as number);
		if (userRes.rows.length === 1 && ids.includes(1) && !ids.includes(0)) {
			const [id, name, pass_hash, email, last_accessed, cash, data, created_at] =
				userRes.rows[0]!;
			console.log(
				"[DB Migration] Migrating single user ID 1 to ID 0...",
			);

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
			console.log(
				"[DB Migration] Migrated single user ID 1 to ID 0 successfully.",
			);
		}
	} catch (err) {
		console.warn("[DB Migration] Skipping user ID migration:", err);
	}

	console.log("[DB Migration] Schema migration completed successfully.");
}

if (import.meta.main) {
	await migrateSchema();
}
