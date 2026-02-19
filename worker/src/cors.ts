export function corsHeaders(
	origin: string,
	allowedOrigins: string,
): Record<string, string> {
	const allowed = allowedOrigins.split(",").map((o) => o.trim());
	const isAllowed = allowed.includes(origin);

	return {
		"Access-Control-Allow-Origin": isAllowed ? origin : "",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400",
	};
}

export function handleOptions(
	request: Request,
	allowedOrigins: string,
): Response {
	const origin = request.headers.get("Origin") ?? "";
	return new Response(null, {
		status: 204,
		headers: corsHeaders(origin, allowedOrigins),
	});
}
