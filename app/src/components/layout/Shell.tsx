import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.js";
import { Logo } from "../Logo.js";

export function Shell({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, logout } = useAuth();
	const navigate = useNavigate();

	return (
		<div
			style={{
				width: "100%",
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<nav
				style={{
					position: "sticky",
					top: 0,
					zIndex: 50,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "12px 28px",
					background: "rgba(10, 10, 26, 0.85)",
					backdropFilter: "blur(12px)",
					borderBottom: "1px solid #222244",
					flexShrink: 0,
				}}
			>
				<button
					type="button"
					onClick={() => navigate("/setup")}
					style={{
						background: "none",
						border: "none",
						display: "flex",
						alignItems: "center",
						gap: "10px",
						cursor: "pointer",
						padding: 0,
					}}
				>
					<Logo size={28} />
					<span
						style={{
							color: "#e0e0e0",
							fontSize: "18px",
							fontWeight: 800,
						}}
					>
						TaskPile
					</span>
				</button>
				{isAuthenticated && (
					<button
						type="button"
						onClick={logout}
						style={{
							background: "transparent",
							border: "1px solid #444",
							color: "#999",
							padding: "6px 16px",
							borderRadius: "8px",
							cursor: "pointer",
							fontSize: "13px",
							fontWeight: 600,
							transition: "border-color 0.15s, color 0.15s",
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.borderColor = "#ef4444";
							e.currentTarget.style.color = "#ef4444";
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.borderColor = "#444";
							e.currentTarget.style.color = "#999";
						}}
						onFocus={(e) => {
							e.currentTarget.style.borderColor = "#ef4444";
							e.currentTarget.style.color = "#ef4444";
						}}
						onBlur={(e) => {
							e.currentTarget.style.borderColor = "#444";
							e.currentTarget.style.color = "#999";
						}}
					>
						Logout
					</button>
				)}
			</nav>
			<div style={{ flex: 1 }}>{children}</div>
		</div>
	);
}
