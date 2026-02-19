import { Route, Routes } from "react-router-dom";
import { AuthGuard } from "./auth/AuthGuard.js";
import { Shell } from "./components/layout/Shell.js";
import { GameModeProvider } from "./game/GameModeContext.js";
import { CallbackPage } from "./pages/CallbackPage.js";
import { GamePage } from "./pages/GamePage.js";
import { LandingPage } from "./pages/LandingPage.js";
import { PrivacyPage } from "./pages/PrivacyPage.js";
import { SetupPage } from "./pages/SetupPage.js";

export function App() {
	return (
		<Routes>
			<Route path="/callback" element={<CallbackPage />} />
			<Route
				path="/setup"
				element={
					<AuthGuard>
						<Shell>
							<SetupPage />
						</Shell>
					</AuthGuard>
				}
			/>
			<Route
				path="/play"
				element={
					<AuthGuard>
						<GameModeProvider>
							<GamePage />
						</GameModeProvider>
					</AuthGuard>
				}
			/>
			<Route path="/privacy" element={<PrivacyPage />} />
			<Route path="*" element={<LandingPage />} />
		</Routes>
	);
}
