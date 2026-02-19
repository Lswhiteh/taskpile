import type { GameMode, ScoreState } from "../../types/game.js";

const MODE_LABELS: Record<GameMode, string> = {
	freePlay: "Free Play",
	sortChallenge: "Sort Challenge",
	stackAttack: "Stack Attack",
	whackABug: "Whack-a-Bug",
	estimatePong: "Estimate Pong",
	priorityAvalanche: "Priority Avalanche",
	sprintTetris: "Sprint Tetris",
	burndownBowling: "Burndown Bowling",
	jrpgAdventure: "Issue Quest",
};

const TIMED_MODES: GameMode[] = [
	"sortChallenge",
	"whackABug",
	"estimatePong",
	"priorityAvalanche",
	"sprintTetris",
];

const pillStyle: React.CSSProperties = {
	background: "rgba(10, 10, 26, 0.85)",
	backdropFilter: "blur(8px)",
	padding: "8px 16px",
	borderRadius: "10px",
	fontSize: "14px",
	border: "1px solid #222244",
	pointerEvents: "auto",
};

interface GameHUDProps {
	mode: GameMode;
	score: ScoreState;
	stackHeight?: number;
	savedCount?: number;
	onBack: () => void;
}

export function GameHUD({
	mode,
	score,
	stackHeight,
	savedCount,
	onBack,
}: GameHUDProps) {
	const showTimedScore = TIMED_MODES.includes(mode);
	const showScorePanel = mode !== "freePlay" && mode !== "jrpgAdventure";

	return (
		<>
			{/* Mode label — top left */}
			<div
				style={{
					position: "absolute",
					top: 12,
					left: 20,
					zIndex: 10,
					...pillStyle,
					fontWeight: 700,
				}}
			>
				{MODE_LABELS[mode]}
			</div>

			{/* Score / timer — top center */}
			{showScorePanel && (
				<div
					style={{
						position: "absolute",
						top: 12,
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 10,
						...pillStyle,
						display: "flex",
						gap: "20px",
						alignItems: "center",
						whiteSpace: "nowrap",
					}}
				>
					{showTimedScore && (
						<>
							<span>
								Score: <strong>{score.score}</strong>
							</span>
							<span
								style={{
									color: score.timeRemaining <= 10 ? "#ef4444" : "#e0e0e0",
									fontWeight: 700,
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{score.timeRemaining}s
							</span>
						</>
					)}
					{mode === "stackAttack" && (
						<>
							<span>
								Height: <strong>{stackHeight ?? 0}px</strong>
							</span>
							{!score.isRunning && score.score > 0 && (
								<span
									style={{
										color: "#ef4444",
										fontWeight: 800,
										fontSize: "15px",
									}}
								>
									Game Over!
								</span>
							)}
						</>
					)}
					{mode === "priorityAvalanche" && savedCount !== undefined && (
						<span>
							Saved: <strong>{savedCount}</strong>
						</span>
					)}
					{mode === "burndownBowling" && (
						<span>
							Knocked Down: <strong>{score.score}</strong>
						</span>
					)}
				</div>
			)}

			{/* Back button — top right */}
			<button
				type="button"
				onClick={onBack}
				style={{
					position: "absolute",
					top: 12,
					right: 20,
					zIndex: 10,
					...pillStyle,
					color: "#999",
					cursor: "pointer",
					fontSize: "13px",
					fontWeight: 600,
					transition: "border-color 0.15s, color 0.15s",
				}}
				onMouseOver={(e) => {
					e.currentTarget.style.borderColor = "#6366f1";
					e.currentTarget.style.color = "#e0e0e0";
				}}
				onMouseOut={(e) => {
					e.currentTarget.style.borderColor = "#222244";
					e.currentTarget.style.color = "#999";
				}}
				onFocus={(e) => {
					e.currentTarget.style.borderColor = "#6366f1";
					e.currentTarget.style.color = "#e0e0e0";
				}}
				onBlur={(e) => {
					e.currentTarget.style.borderColor = "#222244";
					e.currentTarget.style.color = "#999";
				}}
			>
				Back to Setup
			</button>
		</>
	);
}
