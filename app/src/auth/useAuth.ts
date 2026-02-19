import { useCallback, useEffect, useState } from "react";
import {
	LINEAR_AUTH_URL,
	LINEAR_CLIENT_ID,
	REDIRECT_URI,
	WORKER_URL,
} from "../config/constants.js";
import { generateCodeChallenge, generateCodeVerifier } from "./pkce.js";
import {
	clearTokens,
	getTokens,
	isTokenExpiringSoon,
	saveTokens,
} from "./tokenStore.js";

interface AuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	accessToken: string | null;
}

const VERIFIER_KEY = "taskpile_pkce_verifier";

export function useAuth() {
	const [state, setState] = useState<AuthState>({
		isAuthenticated: false,
		isLoading: true,
		accessToken: null,
	});

	// Check stored tokens on mount
	useEffect(() => {
		const tokens = getTokens();
		if (tokens && tokens.expiresAt > Date.now()) {
			setState({
				isAuthenticated: true,
				isLoading: false,
				accessToken: tokens.accessToken,
			});
		} else {
			setState({ isAuthenticated: false, isLoading: false, accessToken: null });
		}
	}, []);

	// Auto-refresh timer
	useEffect(() => {
		if (!state.isAuthenticated) return;

		const interval = setInterval(async () => {
			if (isTokenExpiringSoon()) {
				const tokens = getTokens();
				if (!tokens) return;

				try {
					const resp = await fetch(`${WORKER_URL}/refresh`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							refresh_token: tokens.refreshToken,
						}),
					});
					const data = await resp.json();
					if (data.access_token) {
						saveTokens(
							data.access_token,
							data.refresh_token ?? tokens.refreshToken,
							data.expires_in ?? 3600,
						);
						setState((s) => ({ ...s, accessToken: data.access_token }));
					}
				} catch {
					// Refresh failed, will try again next interval
				}
			}
		}, 60_000);

		return () => clearInterval(interval);
	}, [state.isAuthenticated]);

	const login = useCallback(async () => {
		const verifier = generateCodeVerifier();
		const challenge = await generateCodeChallenge(verifier);
		sessionStorage.setItem(VERIFIER_KEY, verifier);

		const params = new URLSearchParams({
			client_id: LINEAR_CLIENT_ID,
			response_type: "code",
			redirect_uri: REDIRECT_URI,
			code_challenge: challenge,
			code_challenge_method: "S256",
			scope: "read",
			prompt: "consent",
		});

		window.location.href = `${LINEAR_AUTH_URL}?${params}`;
	}, []);

	const handleCallback = useCallback(async (code: string) => {
		const verifier = sessionStorage.getItem(VERIFIER_KEY);
		if (!verifier) throw new Error("Missing PKCE verifier");

		const resp = await fetch(`${WORKER_URL}/token`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				code,
				code_verifier: verifier,
				redirect_uri: REDIRECT_URI,
			}),
		});

		const data = await resp.json();
		if (!data.access_token) {
			throw new Error(data.error ?? "Token exchange failed");
		}

		saveTokens(data.access_token, data.refresh_token, data.expires_in ?? 3600);
		sessionStorage.removeItem(VERIFIER_KEY);

		setState({
			isAuthenticated: true,
			isLoading: false,
			accessToken: data.access_token,
		});
	}, []);

	const logout = useCallback(() => {
		clearTokens();
		setState({ isAuthenticated: false, isLoading: false, accessToken: null });
	}, []);

	return { ...state, login, handleCallback, logout };
}
