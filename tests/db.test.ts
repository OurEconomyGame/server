import { beforeAll, describe, expect, test } from "bun:test";
import {
	deleteCompanyById,
	deleteOfferById,
	deleteOrderById,
	deleteSessionById,
	deleteShareById,
	deleteUserById,
} from "../src/db/deletes.ts";
import {
	getAllCompanies,
	getAllOffers,
	getAllOrders,
	getAllSessions,
	getAllShares,
	getAllUsers,
	getCompanyById,
	getCompanyByName,
	getOfferById,
	getOrderById,
	getSessionByToken,
	getShareById,
	getSharesByOwned,
	getSharesByOwner,
	getUserById,
} from "../src/db/gets.ts";
import { initDb } from "../src/db/init.ts";
import {
	insertCompany,
	insertOffer,
	insertOrder,
	insertSession,
	insertShare,
	insertUser,
} from "../src/db/inserts.ts";
import {
	updateCompanyById,
	updateOfferById,
	updateOrderById,
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
			5000,
			{ role: "admin" },
			1000,
		);
		expect(inserted).toBe(true);

		const user = await getUserById(userId);
		expect(user).not.toBeNull();
		expect(user?.name).toBe("test_crud_user");
		expect(user?.cash).toBe(5000);

		const updated = await updateUserById(userId, {
			name: "updated_crud_user",
			cash: 6000,
		});
		expect(updated).not.toBeNull();
		expect(updated?.name).toBe("updated_crud_user");
		expect(updated?.cash).toBe(6000);

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
			10000,
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

	test("Order and Offer CRUD lifecycle with floating point quantities and prices", async () => {
		const orderId = 9101;
		const offerId = 9201;
		const companyId = 6500;

		const orderInserted = await insertOrder(orderId, companyId, 1, 15.5, 3.25);
		expect(orderInserted).toBe(true);

		const order = await getOrderById(orderId);
		expect(order).not.toBeNull();
		expect(order?.quantity).toBeCloseTo(15.5);
		expect(order?.unitPrice).toBeCloseTo(3.25);

		const orderUpdated = await updateOrderById(orderId, { quantity: 8.25 });
		expect(orderUpdated).not.toBeNull();
		expect(orderUpdated?.quantity).toBeCloseTo(8.25);

		const allOrders = await getAllOrders();
		expect(allOrders.some((o) => o.id === orderId)).toBe(true);

		const orderDeleted = await deleteOrderById(orderId);
		expect(orderDeleted).toBe(true);
		expect(await getOrderById(orderId)).toBeNull();

		const offerInserted = await insertOffer(offerId, companyId, 2, 20.75, 4.5);
		expect(offerInserted).toBe(true);

		const offer = await getOfferById(offerId);
		expect(offer).not.toBeNull();
		expect(offer?.quantity).toBeCloseTo(20.75);
		expect(offer?.unitPrice).toBeCloseTo(4.5);

		const offerUpdated = await updateOfferById(offerId, { unitPrice: 4.25 });
		expect(offerUpdated).not.toBeNull();
		expect(offerUpdated?.unitPrice).toBeCloseTo(4.25);

		const allOffers = await getAllOffers();
		expect(allOffers.some((f) => f.id === offerId)).toBe(true);

		const offerDeleted = await deleteOfferById(offerId);
		expect(offerDeleted).toBe(true);
		expect(await getOfferById(offerId)).toBeNull();
	});

	test("verifySchema succeeds on valid schema, and migrateSchema can be invoked manually", async () => {
		const { verifySchema, EXPECTED_SCHEMA } = await import("../src/db/verify.ts");
		const { migrateSchema } = await import("../src/db/migrate.ts");

		expect(EXPECTED_SCHEMA.company).toContain("cash");
		expect(EXPECTED_SCHEMA.user).toContain("cash");
		expect(EXPECTED_SCHEMA.order).toContain("resource");
		expect(EXPECTED_SCHEMA.offer).toContain("resource");

		// Should not throw on valid initialized database
		await expect(verifySchema()).resolves.toBeUndefined();

		// Standalone migration tool executes cleanly
		await expect(migrateSchema()).resolves.toBeUndefined();
	});
});
