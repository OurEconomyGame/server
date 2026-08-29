import { beforeAll, describe, expect, test } from "bun:test";
import { Resources } from "../src/companies/production/resources.ts";
import { deleteOfferById, deleteOrderById } from "../src/db/deletes.ts";
import { initDb } from "../src/db/init.ts";
import {
	createOffer,
	createOrder,
	getAllOffersByCompany,
	getAllOffersByResource,
	getAllOrdersByCompany,
	getAllOrdersByResource,
} from "../src/market/orders.ts";

beforeAll(async () => {
	await initDb();
});

describe("Market Orders & Offers Suite", () => {
	test("getAllOrdersByResource sorts buy orders from highest to lowest price", async () => {
		const compId = 888;
		const o1 = await createOrder(compId, Resources.Water, 100, 1.5);
		const o2 = await createOrder(compId, Resources.Water, 50, 4.0);
		const o3 = await createOrder(compId, Resources.Water, 200, 2.25);

		expect(o1).not.toBeNull();
		expect(o2).not.toBeNull();
		expect(o3).not.toBeNull();

		const orders = await getAllOrdersByResource(Resources.Water);
		expect(orders.length).toBeGreaterThanOrEqual(3);

		// Check sorting: highest price first
		for (let i = 0; i < orders.length - 1; i++) {
			const current = orders[i];
			const next = orders[i + 1];
			if (current && next) {
				expect(current.unitPrice).toBeGreaterThanOrEqual(next.unitPrice);
			}
		}

		if (o1) await deleteOrderById(o1.id);
		if (o2) await deleteOrderById(o2.id);
		if (o3) await deleteOrderById(o3.id);
	});

	test("getAllOffersByResource sorts sell offers from lowest to highest price", async () => {
		const compId = 999;
		const f1 = await createOffer(compId, Resources.Electricity, 500, 10.0);
		const f2 = await createOffer(compId, Resources.Electricity, 300, 2.5);
		const f3 = await createOffer(compId, Resources.Electricity, 1000, 5.75);

		expect(f1).not.toBeNull();
		expect(f2).not.toBeNull();
		expect(f3).not.toBeNull();

		const offers = await getAllOffersByResource(Resources.Electricity);
		expect(offers.length).toBeGreaterThanOrEqual(3);

		// Check sorting: lowest price first
		for (let i = 0; i < offers.length - 1; i++) {
			const current = offers[i];
			const next = offers[i + 1];
			if (current && next) {
				expect(current.unitPrice).toBeLessThanOrEqual(next.unitPrice);
			}
		}

		if (f1) await deleteOfferById(f1.id);
		if (f2) await deleteOfferById(f2.id);
		if (f3) await deleteOfferById(f3.id);
	});

	test("getAllOrdersByCompany and getAllOffersByCompany filter correctly by company ID", async () => {
		const targetCompanyId = 7771;
		const otherCompanyId = 7772;

		const order1 = await createOrder(
			targetCompanyId,
			Resources.Grain,
			500,
			3.0,
		);
		const order2 = await createOrder(otherCompanyId, Resources.Grain, 200, 3.5);
		const offer1 = await createOffer(
			targetCompanyId,
			Resources.Cement,
			100,
			8.0,
		);
		const offer2 = await createOffer(
			otherCompanyId,
			Resources.Cement,
			400,
			7.5,
		);

		const companyOrders = await getAllOrdersByCompany(targetCompanyId);
		expect(companyOrders.some((o) => o.id === order1?.id)).toBe(true);
		expect(companyOrders.every((o) => o.company_id === targetCompanyId)).toBe(
			true,
		);

		const companyOffers = await getAllOffersByCompany(targetCompanyId);
		expect(companyOffers.some((f) => f.id === offer1?.id)).toBe(true);
		expect(companyOffers.every((f) => f.company_id === targetCompanyId)).toBe(
			true,
		);

		if (order1) await deleteOrderById(order1.id);
		if (order2) await deleteOrderById(order2.id);
		if (offer1) await deleteOfferById(offer1.id);
		if (offer2) await deleteOfferById(offer2.id);
	});
});
