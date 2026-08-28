/**
 * Type helper that disallows the empty string literal `""`.
 */
export type NonEmptyString<T extends string> = T extends "" ? never : T;

/**
 * Constructs a standardized response object while enforcing non-blank status messages.
 *
 * @param status - A non-empty status message.
 * @param id - The company ID (defaults to 0 on failures).
 * @returns Standardized status and ID response object.
 */
export function respond<S extends string>(
	status: S extends "" ? never : S,
	id = 0,
): { status: S; id: number } {
	if ((status as string) === "") {
		throw new Error("Status message cannot be blank");
	}
	return { status, id };
}
