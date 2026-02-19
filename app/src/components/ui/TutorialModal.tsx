import { useState } from "react";
import type { GameMode } from "../../types/game.js";

interface TutorialContent {
	title: string;
	description: string;
	rules: string[];
	tip?: string;
}

const TUTORIALS: Record<GameMode, TutorialContent> = {
	freePlay: {
		title: "Free Play",
		description: "No rules — just watch your issues tumble and interact!",
		rules: [
			"Cards fall from the top with physics gravity",
			"Click and drag cards to toss them around",
			"Scroll to zoom in/out, middle-click to pan",
		],
		tip: "Great for exploring your backlog in a new way.",
	},
	sortChallenge: {
		title: "Sort Challenge",
		description:
			"Drag each issue card into the correct priority bin before time runs out.",
		rules: [
			"You have 90 seconds to sort as many cards as possible",
			"Drag cards into the matching priority bin at the bottom",
			"Correct sort: +1 point",
			"Wrong bin: -2 points",
			"Missed card (falls off screen): -1 point",
		],
		tip: "Focus on accuracy — wrong bins cost more than missed cards.",
	},
	stackAttack: {
		title: "Stack Attack",
		description: "Stack your issue cards as high as you can without toppling!",
		rules: [
			"Cards drop from the top one at a time",
			"Position them to build a stable tower",
			"Your score is the max stack height in pixels",
			"Game over if a card falls off the bottom edge",
		],
		tip: "Wider cards make better foundations. Be patient!",
	},
	whackABug: {
		title: "Whack-a-Bug",
		description: "Bugs are popping up — smash them before they escape!",
		rules: [
			"Cards labeled 'Bug' launch upward from the bottom",
			"Click bug cards to smash them for points",
			"Non-bug cards are harmless — ignore them",
			"Bugs that escape off the top cost you points",
			"Spawn rate increases over time",
		],
		tip: "Watch for the bug label — don't waste clicks on regular issues.",
	},
	estimatePong: {
		title: "Estimate Pong",
		description:
			"Use your paddle to block over-estimated issues and let small ones pass.",
		rules: [
			"Move your mouse to control the paddle",
			"Block cards with estimate >= 5 points (big issues)",
			"Let cards with estimate < 5 pass through",
			"Correct block/pass: +1 point",
			"Wrong action: -1 point",
		],
		tip: "Card size reflects the estimate — bigger cards need blocking.",
	},
	priorityAvalanche: {
		title: "Priority Avalanche",
		description:
			"An avalanche of issues is coming! Save the high-priority ones before time runs out.",
		rules: [
			"You have 60 seconds as cards cascade down the screen",
			"Drag Urgent and High priority cards to the safe zone on the right",
			"Each saved high-priority card earns points",
			"Low-priority cards are worth nothing — don't waste time on them",
		],
		tip: "Red (Urgent) and orange (High) cards are your targets.",
	},
	sprintTetris: {
		title: "Sprint Tetris",
		description: "Fill complete rows with issue cards to clear them, Tetris-style!",
		rules: [
			"Cards drop and settle into a grid",
			"Fill a complete horizontal row to clear it",
			"Each cleared row earns 10 points",
			"Game ends if cards stack to the top of the screen",
		],
		tip: "Try to keep the surface level — gaps are hard to fill.",
	},
	burndownBowling: {
		title: "Burndown Bowling",
		description:
			"Your issues are set up like bowling pins. Launch the ball and knock them down!",
		rules: [
			"Issue cards are arranged in a pin formation",
			"Click to launch the bowling ball",
			"Your score is how many cards you knock down",
			"Aim for the center for maximum impact",
		],
		tip: "A slight offset from center can create a better chain reaction.",
	},
	jrpgAdventure: {
		title: "Issue Quest",
		description:
			"Battle your issues in turn-based RPG combat! Defeat them all to clear your backlog.",
		rules: [
			"Each issue appears as an enemy with HP based on estimate",
			"Choose Attack, Defend, or Special each turn",
			"Attack deals damage, Defend reduces incoming damage",
			"Special deals heavy damage but has limited uses",
			"Defeat all issues to achieve victory",
		],
		tip: "Defend when low on HP — surviving is more important than speed.",
	},
};

interface TutorialModalProps {
	mode: GameMode;
	onDismiss: () => void;
}

export function TutorialModal({ mode, onDismiss }: TutorialModalProps) {
	const tutorial = TUTORIALS[mode];
	const [isExiting, setIsExiting] = useState(false);

	const handleDismiss = () => {
		setIsExiting(true);
		setTimeout(onDismiss, 200);
	};

	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				zIndex: 100,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0, 0, 0, 0.7)",
				backdropFilter: "blur(4px)",
				opacity: isExiting ? 0 : 1,
				transition: "opacity 0.2s ease-out",
			}}
			onClick={handleDismiss}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") handleDismiss();
			}}
		>
			<div
				style={{
					background: "#12122a",
					border: "1px solid #333366",
					borderRadius: "16px",
					padding: "32px 36px",
					maxWidth: 460,
					width: "90%",
					boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
					transform: isExiting ? "scale(0.95)" : "scale(1)",
					transition: "transform 0.2s ease-out",
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={() => {}}
			>
				<h2
					style={{
						margin: "0 0 6px 0",
						fontSize: "22px",
						fontWeight: 800,
						color: "#e0e0e0",
					}}
				>
					{tutorial.title}
				</h2>

				<p
					style={{
						margin: "0 0 20px 0",
						fontSize: "14px",
						color: "#9999bb",
						lineHeight: 1.5,
					}}
				>
					{tutorial.description}
				</p>

				<ul
					style={{
						margin: "0 0 20px 0",
						padding: "0 0 0 20px",
						listStyle: "disc",
					}}
				>
					{tutorial.rules.map((rule) => (
						<li
							key={rule}
							style={{
								fontSize: "13px",
								color: "#c0c0d8",
								lineHeight: 1.7,
							}}
						>
							{rule}
						</li>
					))}
				</ul>

				{tutorial.tip && (
					<p
						style={{
							margin: "0 0 24px 0",
							fontSize: "12px",
							color: "#7777aa",
							fontStyle: "italic",
						}}
					>
						Tip: {tutorial.tip}
					</p>
				)}

				<button
					type="button"
					onClick={handleDismiss}
					style={{
						width: "100%",
						padding: "12px 0",
						fontSize: "15px",
						fontWeight: 700,
						color: "#e0e0e0",
						background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
						border: "none",
						borderRadius: "10px",
						cursor: "pointer",
						transition: "opacity 0.15s",
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.opacity = "0.85";
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.opacity = "1";
					}}
					onFocus={(e) => {
						e.currentTarget.style.opacity = "0.85";
					}}
					onBlur={(e) => {
						e.currentTarget.style.opacity = "1";
					}}
				>
					Let's Go!
				</button>

				<p
					style={{
						margin: "12px 0 0 0",
						fontSize: "11px",
						color: "#555577",
						textAlign: "center",
					}}
				>
					Press Enter, Space, or click anywhere to start
				</p>
			</div>
		</div>
	);
}
