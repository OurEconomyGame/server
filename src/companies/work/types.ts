import type { IFacility } from "../production/facilities.ts";

export interface ProductionCycleResult {
	facility?: string;
	output?: number;
	quantity?: number;
	error?: string;
}

export interface WorkResult {
	status: string;
	wage_paid?: number;
	company_cash?: number;
	user_cash?: number;
	production?: ProductionCycleResult;
	[key: string]: unknown;
}

export interface UserDailyWork {
	date: string;
	count: number;
	companies: number[];
}

export interface CompanyWorkData {
	inventory?: Record<number, number>;
	facilities?: IFacility[];
	wage?: number;
	workers?: number[];
	worked?: boolean[];
	daily_shifts_count?: number;
	last_work_day?: string;
	[key: string]: unknown;
}

export function getTodayUtc(): string {
	return new Date().toISOString().slice(0, 10);
}
