import { beforeAll, describe, expect, test } from "bun:test";
import { isCompanyCeo } from "../src/companies/auth.ts";
import {
	deleteCompanyById,
	deleteSessionById,
	deleteUserById,
} from "../src/db/deletes.ts";
import { initDb } from "../src/db/init.ts";
import { insertCompany, insertSession, insertUser } from "../src/db/inserts.ts";
import { isCompanyCeo as isMarketCompanyCeo } from "../src/market/index.ts";

beforeAll(async () => {
	await initDb();
});

describe("Company & Market Auth Wrapper (isCompanyCeo)", () => {
	test("returns false for missing or null auth token", async () => {
		expect(await isCompanyCeo(null, 1)).toBe(false);
		expect(await isCompanyCeo("", 1)).toBe(false);
		expect(await isMarketCompanyCeo(null, 1)).toBe(false);
	});

	test("returns false for non-existent company or user", async () => {
		expect(await isCompanyCeo("fake_token_123", 999999)).toBe(false);
	});

	test("returns true if user is CEO, false if another user", async () => {
		const ceoUserId = 8001;
		const otherUserId = 8002;
		const companyId = 88001;
		const ceoToken = "test_ceo_token_8001";
		const otherToken = "test_other_token_8002";

		await insertUser(
			ceoUserId,
			"ceo_user",
			"pass",
			"ceo@test.com",
			0,
			0,
			{},
			0,
		);
		await insertUser(
			otherUserId,
			"other_user",
			"pass",
			"other@test.com",
			0,
			0,
			{},
			0,
		);

		await insertSession(80001, 0, ceoToken, ceoUserId);
		await insertSession(80002, 0, otherToken, otherUserId);

		await insertCompany(
			companyId,
			"Auth Test Corp",
			ceoUserId,
			0,
			0,
			1000,
			0,
			ceoUserId,
			{ inventory: {} },
			100,
		);

		// CEO caller -> true
		expect(await isCompanyCeo(ceoToken, companyId)).toBe(true);
		expect(await isMarketCompanyCeo(ceoToken, companyId)).toBe(true);

		// Other user caller -> false
		expect(await isCompanyCeo(otherToken, companyId)).toBe(false);
		expect(await isMarketCompanyCeo(otherToken, companyId)).toBe(false);

		// Admin user (UID 0) -> true
		const adminToken = "admin_auth_test_tok";
		await insertSession(80003, 0, adminToken, 0);
		expect(await isCompanyCeo(adminToken, companyId)).toBe(true);
		expect(await isMarketCompanyCeo(adminToken, companyId)).toBe(true);

		// Clean up
		await deleteCompanyById(companyId);
		await deleteSessionById(80001);
		await deleteSessionById(80002);
		await deleteSessionById(80003);
		await deleteUserById(ceoUserId);
		await deleteUserById(otherUserId);
	});
});
