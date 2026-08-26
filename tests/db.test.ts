import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	deleteCompanyById,
	deleteSessionById,
	deleteShareById,
	deleteUserById,
} from "../src/db/deletes.ts";
import {
	getAllCompanies,
	getAllSessions,
	getAllShares,
	getAllUsers,
	getCompanyById,
	getCompanyByName,
	getSessionByToken,
	getShareById,
	getSharesByOwned,
	getSharesByOwner,
	getUserById,
} from "../src/db/gets.ts";
import { cleanupDbOnExit, initDb } from "../src/db/init.ts";
import {
	insertCompany,
	insertSession,
	insertShare,
	insertUser,
} from "../src/db/inserts.ts";
import {
	updateCompanyById,
	updateSessionById,
	updateShareById,
	updateUserById,
} from "../src/db/updates.ts";

beforeAll(async () => {
	await initDb();
});

describe("DB CRUD Operations Suite", () => {
	test("User CRUD lifecycle: insert, get, update, getAll, delete", async () => {
		const userId = 5000;
		const inserted = await insertUser(
			userId,
			"test_crud_user",
			"hash123",
			"test@example.com",
			1000,
			{ role: "admin" },
			1000,
		);
		expect(inserted).toBe(true);

		const user = await getUserById(userId);
		expect(user).not.toBeNull();
		expect(user?.name).toBe("test_crud_user");

		const updated = await updateUserById(userId, { name: "updated_crud_user" });
		expect(updated).not.toBeNull();
		expect(updated?.name).toBe("updated_crud_user");

		const allUsers = await getAllUsers();
		expect(
			allUsers.some((u) => u.id === userId && u.name === "updated_crud_user"),
		).toBe(true);

		const deleted = await deleteUserById(userId);
		expect(deleted).toBe(true);

		const afterDelete = await getUserById(userId);
		expect(afterDelete).toBeNull();
	});

	test("Session CRUD lifecycle: insert, get, update, getAll, delete", async () => {
		const sessionId = 6000;
		const token = "token_crud_6000";
		const inserted = await insertSession(sessionId, 2000, token, 1);
		expect(inserted).toBe(true);

		const session = await getSessionByToken(token);
		expect(session).not.toBeNull();
		expect(session?.id).toBe(sessionId);

		const updated = await updateSessionById(sessionId, {
			token: "token_crud_updated",
		});
		expect(updated).not.toBeNull();
		expect(updated?.token).toBe("token_crud_updated");

		const allSessions = await getAllSessions();
		expect(
			allSessions.some(
				(s) => s.id === sessionId && s.token === "token_crud_updated",
			),
		).toBe(true);

		const deleted = await deleteSessionById(sessionId);
		expect(deleted).toBe(true);

		const afterDeleteSession = await getSessionByToken("token_crud_updated");
		expect(afterDeleteSession).toBeNull();
	});

	test("Company CRUD lifecycle: insert, getById, getByName, update, getAll, delete", async () => {
		const companyId = 7000;
		const companyName = "Acme_Industrial_Corp";
		const inserted = await insertCompany(
			companyId,
			companyName,
			501,
			1,
			1000,
			1000,
			501,
			{ vault_cash: 50000 },
			1000000,
		);
		expect(inserted).toBe(true);

		const companyById = await getCompanyById(companyId);
		expect(companyById).not.toBeNull();
		expect(companyById?.name).toBe(companyName);
		expect(companyById?.shares_outstanding).toBe(1000000);

		const companyByName = await getCompanyByName(companyName);
		expect(companyByName).not.toBeNull();
		expect(companyByName?.id).toBe(companyId);

		const updated = await updateCompanyById(companyId, {
			ceo: 502,
			shares_outstanding: 2000000,
		});
		expect(updated).not.toBeNull();
		expect(updated?.ceo).toBe(502);
		expect(updated?.shares_outstanding).toBe(2000000);

		const allCompanies = await getAllCompanies();
		expect(allCompanies.some((c) => c.id === companyId && c.ceo === 502)).toBe(
			true,
		);

		const deleted = await deleteCompanyById(companyId);
		expect(deleted).toBe(true);

		const afterDelete = await getCompanyById(companyId);
		expect(afterDelete).toBeNull();
	});

	test("Share CRUD lifecycle: insert, getById, getByOwner, getByOwned, update, getAll, delete", async () => {
		const shareId = 8000;
		const ownerId = 901;
		const ownedCompanyId = 7001;

		const inserted = await insertShare(
			shareId,
			ownerId,
			true,
			5000,
			ownedCompanyId,
		);
		expect(inserted).toBe(true);

		const shareById = await getShareById(shareId);
		expect(shareById).not.toBeNull();
		expect(shareById?.quantity).toBe(5000);

		const sharesByOwner = await getSharesByOwner(ownerId, true);
		expect(
			sharesByOwner.some((s) => s.id === shareId && s.quantity === 5000),
		).toBe(true);

		const sharesByOwned = await getSharesByOwned(ownedCompanyId);
		expect(
			sharesByOwned.some((s) => s.id === shareId && s.owner_id === ownerId),
		).toBe(true);

		const updated = await updateShareById(shareId, { quantity: 7500 });
		expect(updated).not.toBeNull();
		expect(updated?.quantity).toBe(7500);

		const allShares = await getAllShares();
		expect(allShares.some((s) => s.id === shareId && s.quantity === 7500)).toBe(
			true,
		);

		const deleted = await deleteShareById(shareId);
		expect(deleted).toBe(true);

		const afterDelete = await getShareById(shareId);
		expect(afterDelete).toBeNull();
	});
});
