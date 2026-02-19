import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export function CallbackPage() {
	const [searchParams] = useSearchParams();
	const { handleCallback } = useAuth();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const code = searchParams.get("code");
		const errorParam = searchParams.get("error");

		if (errorParam) {
			setError(errorParam);
			return;
		}

		if (!code) {
			setError("No authorization code received");
			return;
		}

		handleCallback(code)
			.then(() => navigate("/setup", { replace: true }))
			.catch((err) => setError(err.message));
	}, [searchParams, handleCallback, navigate]);

	if (error) {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
					gap: "16px",
				}}
			>
				<p style={{ color: "#ef4444" }}>Authentication failed: {error}</p>
				<a href="/login" style={{ color: "#6366f1" }}>
					Try again
				</a>
			</div>
		);
	}

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				color: "#888",
			}}
		>
			Authenticating...
		</div>
	);
}
