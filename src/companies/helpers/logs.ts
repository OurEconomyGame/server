import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById } from "../../db/updates.ts";

/**
 * A company log entry represented as a [text, unix timestamp] pair.
 */
export type CompanyLogEntry = [string, number];

/**
 * Appends a log entry to a company's in-memory data object.
 *
 * @param companyData - Company's data record object.
 * @param text - Log text describing the purchase or sale.
 * @param timestamp - Unix timestamp in seconds (defaults to current time).
 * @returns Updated array of log entries.
 */
export function addCompanyDataLog(
	companyData: Record<string, unknown>,
	text: string,
	timestamp: number = Math.floor(Date.now() / 1000),
): CompanyLogEntry[] {
	const existingLogs = Array.isArray(companyData.logs)
		? (companyData.logs as CompanyLogEntry[])
		: [];
	const updatedLogs = [...existingLogs, [text, timestamp] as CompanyLogEntry];
	companyData.logs = updatedLogs;
	return updatedLogs;
}

/**
 * Appends a purchase or sale log entry directly to a company in the database.
 *
 * @param companyId - Numeric company ID.
 * @param text - Log text describing the purchase or sale.
 * @param timestamp - Unix timestamp in seconds (defaults to current time).
 * @returns Promise resolving to true if successfully updated, false otherwise.
 */
export async function appendCompanyLog(
	companyId: number,
	text: string,
	timestamp: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
	if (companyId <= 0) return false;
	const company = await getCompanyById(companyId);
	if (!company) return false;

	const companyData = { ...(company.data ?? {}) } as Record<string, unknown>;
	addCompanyDataLog(companyData, text, timestamp);

	const updated = await updateCompanyById(companyId, { data: companyData });
	return updated !== null;
}
