const LINEAR_TOKEN_URL = "https://api.linear.app/oauth/token";

interface TokenRequest {
	code: string;
	code_verifier: string;
	redirect_uri: string;
}

interface RefreshRequest {
	refresh_token: string;
}

export async function exchangeToken(
	body: TokenRequest,
	clientId: string,
	clientSecret: string,
): Promise<Response> {
	const params = new URLSearchParams({
		grant_type: "authorization_code",
		client_id: clientId,
		client_secret: clientSecret,
		code: body.code,
		code_verifier: body.code_verifier,
		redirect_uri: body.redirect_uri,
	});

	const resp = await fetch(LINEAR_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params.toString(),
	});

	const data = await resp.json();
	return Response.json(data, { status: resp.status });
}

export async function refreshToken(
	body: RefreshRequest,
	clientId: string,
	clientSecret: string,
): Promise<Response> {
	const params = new URLSearchParams({
		grant_type: "refresh_token",
		client_id: clientId,
		client_secret: clientSecret,
		refresh_token: body.refresh_token,
	});

	const resp = await fetch(LINEAR_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params.toString(),
	});

	const data = await resp.json();
	return Response.json(data, { status: resp.status });
}
