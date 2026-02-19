import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { JRPGCanvas } from "../components/canvas/JRPGCanvas.js";
import { PhysicsCanvas } from "../components/canvas/PhysicsCanvas.js";
import { GameHUD } from "../components/layout/GameHUD.js";
import { TutorialModal } from "../components/ui/TutorialModal.js";
import { useGameMode } from "../game/GameModeContext.js";
import type { GameMode } from "../types/game.js";
import type { LinearIssue } from "../types/linear.js";

export function GamePage() {
	const navigate = useNavigate();
	const { setMode, mode, score } = useGameMode();
	const [issues, setIssues] = useState<LinearIssue[]>([]);
	const [savedCount, setSavedCount] = useState(0);
	const [showTutorial, setShowTutorial] = useState(true);

	useEffect(() => {
		const stored = sessionStorage.getItem("taskpile_game");
		if (!stored) {
			navigate("/setup", { replace: true });
			return;
		}

		const { issues: storedIssues, mode: storedMode } = JSON.parse(stored) as {
			issues: LinearIssue[];
			mode: GameMode;
		};

		setIssues(storedIssues);
		setMode(storedMode);
	}, [navigate, setMode]);

	// Lock scrolling on game page
	useEffect(() => {
		document.documentElement.style.overflow = "hidden";
		document.body.style.overflow = "hidden";
		return () => {
			document.documentElement.style.overflow = "auto";
			document.body.style.overflow = "auto";
		};
	}, []);

	// ESC to go back to setup
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				navigate("/setup");
			}
		}
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [navigate]);

	if (issues.length === 0) return null;

	const goBack = () => navigate("/setup");

	if (mode === "jrpgAdventure") {
		return (
			<div style={{ width: "100%", height: "100%", position: "relative" }}>
				<GameHUD mode={mode} score={score} onBack={goBack} />
				<JRPGCanvas issues={issues} />
				{showTutorial && (
					<TutorialModal
						mode={mode}
						onDismiss={() => setShowTutorial(false)}
					/>
				)}
			</div>
		);
	}

	return (
		<div style={{ width: "100%", height: "100%", position: "relative" }}>
			<GameHUD
				mode={mode}
				score={score}
				savedCount={savedCount}
				onBack={goBack}
			/>
			<PhysicsCanvas issues={issues} onSavedCountChange={setSavedCount} />
			{showTutorial && (
				<TutorialModal
					mode={mode}
					onDismiss={() => setShowTutorial(false)}
				/>
			)}
		</div>
	);
}
