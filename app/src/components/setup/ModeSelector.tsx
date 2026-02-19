import type { GameMode } from "../../types/game.js";

interface ModeSelectorProps {
	selected: GameMode;
	onSelect: (mode: GameMode) => void;
}

const modes: {
	id: GameMode;
	title: string;
	subtitle: string;
	description: string;
	color: string;
}[] = [
	{
		id: "freePlay",
		title: "Free Play",
		subtitle: "Chaos mode",
		description: "All cards drop at once. Throw them around, no rules.",
		color: "#6366f1",
	},
	{
		id: "sortChallenge",
		title: "Sort Challenge",
		subtitle: "Beat the clock",
		description: "Sort cards into priority bins. 90 seconds on the clock.",
		color: "#eab308",
	},
	{
		id: "stackAttack",
		title: "Stack Attack",
		subtitle: "Defy gravity",
		description: "Stack cards as high as you can. Don't let them fall!",
		color: "#ef4444",
	},
	{
		id: "whackABug",
		title: "Whack-a-Bug",
		subtitle: "Smash bugs",
		description: "Bugs pop up from below. Smash them before they escape!",
		color: "#f97316",
	},
	{
		id: "estimatePong",
		title: "Estimate Pong",
		subtitle: "Solo pong",
		description: "Catch big estimates, dodge small ones. Solo pong!",
		color: "#3b82f6",
	},
	{
		id: "priorityAvalanche",
		title: "Priority Avalanche",
		subtitle: "Save the day",
		description: "Save critical issues from the crushing pile. Gravity rises!",
		color: "#a855f7",
	},
	{
		id: "sprintTetris",
		title: "Sprint Tetris",
		subtitle: "Pack tight",
		description: "Pack cards tight. Clear full rows for points!",
		color: "#22c55e",
	},
	{
		id: "burndownBowling",
		title: "Burndown Bowling",
		subtitle: "Strike!",
		description: "Fling the ball to knock down issue pins. 3 frames!",
		color: "#ec4899",
	},
	{
		id: "jrpgAdventure",
		title: "Issue Quest",
		subtitle: "RPG time",
		description: "Turn-based RPG. Fight your issues one by one!",
		color: "#14b8a6",
	},
];

export function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
	return (
		<>
			<style>
				{`
					@media (max-width: 600px) {
						.tp-mode-grid { gap: 8px !important; }
						.tp-mode-card { flex-basis: 100% !important; padding: 14px 16px !important; }
					}
				`}
			</style>
			<div
				className="tp-mode-grid"
				style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
			>
				{modes.map((m) => {
					const isSelected = selected === m.id;
					return (
						<button
							key={m.id}
							type="button"
							className="tp-mode-card"
							onClick={() => onSelect(m.id)}
							style={{
								flex: "1 1 200px",
								background: isSelected ? "#2a2a4e" : "#111122",
								border: isSelected
									? `2px solid ${m.color}`
									: "2px solid transparent",
								borderRadius: "12px",
								padding: "18px 20px",
								cursor: "pointer",
								textAlign: "left",
								color: "#e0e0e0",
								transition:
									"border-color 0.15s, transform 0.15s, background 0.15s, box-shadow 0.15s",
							}}
							onMouseOver={(e) => {
								if (!isSelected) {
									e.currentTarget.style.borderColor = `${m.color}66`;
									e.currentTarget.style.background = "#1a1a2e";
								}
								e.currentTarget.style.transform = "translateY(-2px)";
								e.currentTarget.style.boxShadow = `0 4px 16px ${m.color}18`;
							}}
							onMouseOut={(e) => {
								if (!isSelected) {
									e.currentTarget.style.borderColor = "transparent";
									e.currentTarget.style.background = "#111122";
								}
								e.currentTarget.style.transform = "translateY(0)";
								e.currentTarget.style.boxShadow = "none";
							}}
							onFocus={(e) => {
								if (!isSelected) {
									e.currentTarget.style.borderColor = `${m.color}66`;
								}
								e.currentTarget.style.transform = "translateY(-2px)";
							}}
							onBlur={(e) => {
								if (!isSelected) {
									e.currentTarget.style.borderColor = "transparent";
								}
								e.currentTarget.style.transform = "translateY(0)";
							}}
						>
							<div
								style={{
									display: "inline-block",
									padding: "2px 10px",
									borderRadius: "6px",
									background: `${m.color}18`,
									color: m.color,
									fontSize: "11px",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.04em",
									marginBottom: "10px",
								}}
							>
								{m.subtitle}
							</div>
							<div
								style={{
									fontSize: "15px",
									fontWeight: 700,
									marginBottom: "4px",
								}}
							>
								{m.title}
							</div>
							<div style={{ fontSize: "13px", color: "#777", lineHeight: 1.5 }}>
								{m.description}
							</div>
						</button>
					);
				})}
			</div>
		</>
	);
}
