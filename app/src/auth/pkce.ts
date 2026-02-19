function base64URLEncode(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let str = "";
	for (const byte of bytes) {
		str += String.fromCharCode(byte);
	}
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return base64URLEncode(array.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return base64URLEncode(digest);
}
