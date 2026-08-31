import details from "../package.json";
import { handleCashInject } from "./admin/cash.ts";
import {
	handleCompanyDeposit,
	handleCompanyDividend,
} from "./companies/capital/index.ts";
import { handleCompanyDelete } from "./companies/delete/delete.ts";
import { foundCompany } from "./companies/found/found.ts";
import { buyFacility } from "./companies/production/buy.ts";
import { getCompaniesByCeo } from "./companies/read/ceo.ts";
import { getCompanyInfo } from "./companies/read/get.ts";
import { getAllCompaniesInfo } from "./companies/read/list.ts";
import { getCompanyShareholders } from "./companies/read/shareholders.ts";
import {
	handleStoreBuy,
	handleStorePrice,
} from "./companies/webstore/index.ts";
import {
	handleCompanyFire,
	handleCompanyQuit,
	handleCompanySetWage,
	handleCompanyWork,
	getUserWorkStatus,
} from "./companies/work/index.ts";
import { handleDocs } from "./docs.ts";
import parseAuthHeader from "./header_parse.ts";
import {
	handleMarketBuy,
	handleMarketCancel,
	handleMarketDepth,
	handleMarketSell,
} from "./market/index.ts";
import handleOptions from "./options.ts";
import { getUserPortfolio } from "./shares/portfolio.ts";
import { createUser } from "./users/create.ts";
import { handleUserDelete } from "./users/delete.ts";
import { getUserPublicInfo } from "./users/get.ts";
import { getAllUsersPublicInfo } from "./users/list.ts";
import { login } from "./users/login.ts";

/**
 * Attaches standard CORS headers to any outgoing HTTP response.
 *
 * @param response - The HTTP Response object.
 * @returns The HTTP Response object with CORS headers attached.
 */
function withCors(response: Response): Response {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Auth, Authorization",
	);
	return response;
}

/**
 * Internal route handler for processing request business logic.
 *
 * @param request - The incoming HTTP Request object.
 * @returns A promise that resolves to the HTTP Response object.
 */
async function handleRequest(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const method = request.method;
	const path = url.pathname;
	const params = Object.fromEntries(url.searchParams.entries());
	const auth_token: string | null = parseAuthHeader(request.headers);
	const text = await request.text();
	const postParams = text ? JSON.parse(text) : null;

	console.log("Request Received at URL: ", url);

	switch (path) {
		case "/version":
			return Response.json({ version: details.version });

		case "/docs":
			return handleDocs(request);

		case "/terms":
			return new Response(Bun.file("./API_TERMS.md"), {
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			});

		case "/openapi.json":
			return new Response(Bun.file("./openapi.json"));

		case "/list/users":
			return Response.json(await getAllUsersPublicInfo(params));

		case "/user":
			return Response.json(await getUserPublicInfo(params));

		case "/user/work":
		case "/work/status":
			return Response.json(await getUserWorkStatus(auth_token));

		case "/list/companies":
			return Response.json(await getAllCompaniesInfo(params, auth_token));

		case "/company":
			return Response.json(await getCompanyInfo(params, auth_token));

		case "/company/ceo":
		case "/companies/ceo":
			return Response.json(await getCompaniesByCeo(params, auth_token));

		case "/company/shareholders":
			return Response.json(await getCompanyShareholders(params));

		case "/portfolio":
			return Response.json(await getUserPortfolio(auth_token));

		case "/signup":
			if (method !== "POST")
				return Response.json({
					status: "How can I make an acount without postage?",
					id: 0,
				});
			return Response.json(await createUser(postParams));

		case "/login":
			if (method !== "POST")
				return Response.json({ status: "Your killing me.", token: "none" });
			return Response.json(await login(postParams));

		case "/found":
			if (method !== "POST")
				return Response.json({ status: "I am not a mind reader.", id: 0 });
			return Response.json(await foundCompany(postParams, auth_token));

		case "/facility/buy":
			if (method !== "POST")
				return Response.json({
					status: "You cannot purchase facilities with carrier pigeons.",
				});
			return Response.json(await buyFacility(postParams, auth_token));

		case "/company/work":
		case "/work":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to report for work",
				});
			return Response.json(await handleCompanyWork(postParams, auth_token));

		case "/company/wage":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to set company wage",
				});
			return Response.json(await handleCompanySetWage(postParams, auth_token));

		case "/company/fire":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to fire a worker",
				});
			return Response.json(await handleCompanyFire(postParams, auth_token));

		case "/company/quit":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to quit a company",
				});
			return Response.json(await handleCompanyQuit(postParams, auth_token));

		case "/company/deposit":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to deposit funds",
				});
			return Response.json(await handleCompanyDeposit(postParams, auth_token));

		case "/company/dividend":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to distribute dividends",
				});
			return Response.json(await handleCompanyDividend(postParams, auth_token));

		case "/store/price":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to set store price",
				});
			return Response.json(await handleStorePrice(postParams, auth_token));

		case "/store/buy":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to purchase from store",
				});
			return Response.json(await handleStoreBuy(postParams, auth_token));

		case "/market/depth":
			return Response.json(await handleMarketDepth(params));

		case "/market/buy":
			if (method !== "POST")
				return Response.json({
					status: "POST method required for market orders",
				});
			return Response.json(await handleMarketBuy(postParams, auth_token));

		case "/market/sell":
			if (method !== "POST")
				return Response.json({
					status: "POST method required for market offers",
				});
			return Response.json(await handleMarketSell(postParams, auth_token));

		case "/market/cancel":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to cancel market orders",
				});
			return Response.json(await handleMarketCancel(postParams, auth_token));

		case "/cash/inject":
		case "/cash/mint":
		case "/admin/cash":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to inject cash",
				});
			return Response.json(await handleCashInject(postParams, auth_token));

		case "/user/delete":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to delete user",
				});
			return Response.json(await handleUserDelete(postParams, auth_token));

		case "/company/delete":
			if (method !== "POST")
				return Response.json({
					status: "POST method required to delete company",
				});
			return Response.json(await handleCompanyDelete(postParams, auth_token));

		default:
			return new Response("You are utterless and hopelessly lost. Get a GPS.", {
				status: 404,
			});
	}
}

/**
 * Handles incoming requests, routes OPTIONS preflights, and wraps responses with CORS headers.
 *
 * @param request - The incoming HTTP Request object.
 * @returns A promise that resolves to the HTTP Response object with CORS headers.
 */
export default async function route(request: Request): Promise<Response> {
	if (request.method === "OPTIONS") {
		const optionsRes = await handleOptions(request);
		console.log(
			"Response Sent for OPTIONS URL: ",
			request.url,
			"Status: ",
			optionsRes.status,
		);
		return optionsRes;
	}

	const response = await handleRequest(request);
	const finalResponse = withCors(response);
	try {
		const cloned = finalResponse.clone();
		const responseBody = await cloned.text();
		console.log(
			"Response Sent for URL: ",
			request.url,
			"Status: ",
			finalResponse.status,
			"Body: ",
			responseBody.length > 500
				? responseBody.slice(0, 500) + "... [truncated]"
				: responseBody,
		);
	} catch {
		console.log(
			"Response Sent for URL: ",
			request.url,
			"Status: ",
			finalResponse.status,
		);
	}
	return finalResponse;
}
