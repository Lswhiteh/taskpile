import { useAuth } from "../auth/useAuth.js";

export function LoginPage() {
	const { login, isAuthenticated } = useAuth();

	if (isAuthenticated) {
		window.location.href = "/setup";
		return null;
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				gap: "24px",
			}}
		>
			<h1 style={{ fontSize: "48px", fontWeight: "bold" }}>TaskPile</h1>
			<p
				style={{
					color: "#888",
					fontSize: "16px",
					maxWidth: "400px",
					textAlign: "center",
				}}
			>
				Turn your Linear issues into a physics playground. Throw them around,
				sort them, stack them.
			</p>
			<button
				type="button"
				onClick={login}
				style={{
					background: "#5E6AD2",
					color: "white",
					border: "none",
					borderRadius: "8px",
					padding: "12px 32px",
					fontSize: "16px",
					fontWeight: "bold",
					cursor: "pointer",
					transition: "background 0.15s",
				}}
				onFocus={(e) => {
					e.currentTarget.style.background = "#6E7AE2";
				}}
				onBlur={(e) => {
					e.currentTarget.style.background = "#5E6AD2";
				}}
				onMouseOver={(e) => {
					e.currentTarget.style.background = "#6E7AE2";
				}}
				onMouseOut={(e) => {
					e.currentTarget.style.background = "#5E6AD2";
				}}
			>
				Connect to Linear
			</button>
		</div>
	);
}
