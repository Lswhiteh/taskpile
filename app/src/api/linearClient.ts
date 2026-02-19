import { getTokens } from "../auth/tokenStore.js";

const LINEAR_API = "https://api.linear.app/graphql";

export async function linearGql<T>(
	query: string,
	variables?: Record<string, unknown>,
): Promise<T> {
	const tokens = getTokens();
	if (!tokens) throw new Error("Not authenticated");

	const resp = await fetch(LINEAR_API, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: tokens.accessToken,
		},
		body: JSON.stringify({ query, variables }),
	});

	if (!resp.ok) {
		throw new Error(`Linear API error: ${resp.status}`);
	}

	const json = await resp.json();
	if (json.errors?.length) {
		throw new Error(json.errors[0].message);
	}

	return json.data as T;
}
