import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth.js";

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
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
				Loading...
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}
