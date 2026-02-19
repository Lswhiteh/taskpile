import { corsHeaders, handleOptions } from "./cors.js";
import { exchangeToken, refreshToken } from "./oauth.js";

interface Env {
	ALLOWED_ORIGINS: string;
	LINEAR_CLIENT_ID: string;
	LINEAR_CLIENT_SECRET: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const origin = request.headers.get("Origin") ?? "";

		if (request.method === "OPTIONS") {
			return handleOptions(request, env.ALLOWED_ORIGINS);
		}

		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		const headers = corsHeaders(origin, env.ALLOWED_ORIGINS);

		try {
			let response: Response;

			if (url.pathname === "/token") {
				const body = await request.json();
				response = await exchangeToken(
					body as { code: string; code_verifier: string; redirect_uri: string },
					env.LINEAR_CLIENT_ID,
					env.LINEAR_CLIENT_SECRET,
				);
			} else if (url.pathname === "/refresh") {
				const body = await request.json();
				response = await refreshToken(
					body as { refresh_token: string },
					env.LINEAR_CLIENT_ID,
					env.LINEAR_CLIENT_SECRET,
				);
			} else {
				return new Response("Not found", { status: 404, headers });
			}

			// Clone response with CORS headers
			const data = await response.json();
			return Response.json(data, {
				status: response.status,
				headers,
			});
		} catch {
			return Response.json(
				{ error: "Internal server error" },
				{ status: 500, headers },
			);
		}
	},
};
