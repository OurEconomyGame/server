import { companyTypes } from "../helpers/types.ts";

export type ValidationResult =
	| {
			ok: true;
			name: string;
			type: companyTypes;
			data: Record<string, unknown>;
	  }
	| {
			ok: false;
			status: string;
	  };

/**
 * Validates and extracts parameters for founding a new company.
 *
 * @param params - The raw payload received in the request.
 * @returns ValidationResult with parsed properties on success, or failure status message.
 */
export function validateFoundingParams(params: unknown): ValidationResult {
	if (!params || typeof params !== "object" || Array.isArray(params)) {
		return {
			ok: false,
			status:
				"I need some info, you cant just say: I will start a buisness, and ask for a building, and then wonder why you got a bakery instead of a office building.",
		};
	}

	const p = params as Record<string, unknown>;

	if (typeof p.name !== "string") {
		return {
			ok: false,
			status:
				"Ok, um, are you thick? You didnt give me the info where I can see it.",
		};
	}

	const rawName = p.name;
	if (rawName.trim() === "") {
		return {
			ok: false,
			status:
				"You cant have a null company, though I dont see why not zero width characters but it cant just be whitespace.",
		};
	}
	const name = rawName.trim();

	const rawType =
		typeof p.type === "number"
			? p.type
			: typeof p.the_hell_you_want === "number"
				? p.the_hell_you_want
				: null;

	if (
		rawType === null ||
		(rawType !== companyTypes.Production &&
			rawType !== companyTypes.Holding &&
			rawType !== companyTypes.WebStore)
	) {
		return {
			ok: false,
			status: "I still aint got any idea what you want.",
		};
	}

	const type: companyTypes = rawType;
	const data: Record<string, unknown> = {};

	return {
		ok: true,
		name,
		type,
		data,
	};
}
