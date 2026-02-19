const TOKEN_KEY = "taskpile_token";
const REFRESH_KEY = "taskpile_refresh";
const EXPIRY_KEY = "taskpile_expiry";

export interface StoredTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

export function saveTokens(
	accessToken: string,
	refreshToken: string,
	expiresIn: number,
): void {
	const expiresAt = Date.now() + expiresIn * 1000;
	localStorage.setItem(TOKEN_KEY, accessToken);
	localStorage.setItem(REFRESH_KEY, refreshToken);
	localStorage.setItem(EXPIRY_KEY, String(expiresAt));
}

export function getTokens(): StoredTokens | null {
	const accessToken = localStorage.getItem(TOKEN_KEY);
	const refreshToken = localStorage.getItem(REFRESH_KEY);
	const expiresAt = localStorage.getItem(EXPIRY_KEY);

	if (!accessToken || !refreshToken || !expiresAt) return null;

	return {
		accessToken,
		refreshToken,
		expiresAt: Number(expiresAt),
	};
}

export function clearTokens(): void {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(REFRESH_KEY);
	localStorage.removeItem(EXPIRY_KEY);
}

export function isTokenExpiringSoon(): boolean {
	const tokens = getTokens();
	if (!tokens) return true;
	// Refresh if within 5 minutes of expiration
	return tokens.expiresAt - Date.now() < 5 * 60 * 1000;
}
