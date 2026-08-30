import { executeNpcPurchase } from "./companies/webstore/npc.ts";

/**
 * Runs a single tick of server-side operations (e.g. NPC civilian store purchases).
 */
export async function runServerTick() {
	try {
		return await executeNpcPurchase();
	} catch (error) {
		console.error("[Ticker] Error during server tick:", error);
		return { purchased: false, message: String(error) };
	}
}

/**
 * Starts the periodic server-side ticker loop.
 *
 * @param intervalMs - Tick interval in milliseconds. Defaults to TICK_INTERVAL_MS env var or 30000ms (30s).
 * @returns The active interval timer handle.
 */
export function startServerTick(
	intervalMs: number = Number(process.env.TICK_INTERVAL_MS) || 30_000,
): ReturnType<typeof setInterval> {
	console.log(`[Ticker] Server ticker started (interval: ${intervalMs}ms)`);
	return setInterval(async () => {
		await runServerTick();
	}, intervalMs);
}
