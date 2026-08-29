import { getAllOffersByResource } from "./offers.ts";
import { getAllOrdersByResource } from "./orders.ts";

/**
 * Handles HTTP request to inspect orderbook depth for a resource.
 */
export async function handleMarketDepth(
	params: Record<string, string>,
): Promise<Record<string, unknown>> {
	const rawResource = params.resource ?? params.id;
	const resource = Number(rawResource);

	if (!Number.isFinite(resource) || resource < 0) {
		return { status: "Missing or invalid resource parameter" };
	}

	const orders = await getAllOrdersByResource(resource);
	const offers = await getAllOffersByResource(resource);

	return {
		status: "Success",
		resource,
		orders,
		offers,
	};
}
