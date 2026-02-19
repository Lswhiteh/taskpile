import Matter from "matter-js";
import {
	PRIORITY_COLORS,
	SORT_BIN_HEIGHT,
	SORT_DEADLINE_Y_OFFSET,
	SORT_GRAVITY,
	SORT_SPAWN_INTERVAL_MS,
	SORT_TIMER_SECONDS,
} from "../../config/constants.js";
import type { SortBin } from "../../types/game.js";
import type { LinearIssue } from "../../types/linear.js";
import type { PhysicsCard } from "../../types/physics.js";

const BIN_LABELS: { priority: number; label: string }[] = [
	{ priority: 1, label: "Urgent" },
	{ priority: 2, label: "High" },
	{ priority: 3, label: "Normal" },
	{ priority: 4, label: "Low" },
];

const DIVIDER_THICKNESS = 6;

export function createBins(canvasWidth: number): SortBin[] {
	const binWidth = canvasWidth / BIN_LABELS.length;
	return BIN_LABELS.map((b, i) => ({
		label: b.label,
		priority: b.priority,
		x: i * binWidth,
		width: binWidth,
		color: PRIORITY_COLORS[b.priority],
	}));
}

export function createBinWalls(
	canvasWidth: number,
	canvasHeight: number,
): Matter.Body[] {
	const binCount = BIN_LABELS.length;
	const binWidth = canvasWidth / binCount;
	const binTop = canvasHeight - SORT_BIN_HEIGHT;
	const walls: Matter.Body[] = [];

	// Bin floor
	walls.push(
		Matter.Bodies.rectangle(
			canvasWidth / 2,
			canvasHeight + 25,
			canvasWidth + 100,
			50,
			{ isStatic: true, label: "bin-floor" },
		),
	);

	// Divider walls between bins (and on edges)
	for (let i = 0; i <= binCount; i++) {
		const x = i * binWidth;
		walls.push(
			Matter.Bodies.rectangle(
				x,
				binTop + SORT_BIN_HEIGHT / 2,
				DIVIDER_THICKNESS,
				SORT_BIN_HEIGHT,
				{ isStatic: true, label: `bin-divider-${i}` },
			),
		);
	}

	return walls;
}

export interface SortChallengeActions {
	addCard: (issue: LinearIssue, x?: number, y?: number) => void;
	setGravity: (y: number) => void;
	startTimer: (seconds: number) => void;
	addScore: (points: number) => void;
	setBins: (bins: SortBin[]) => void;
	addBodies: (bodies: Matter.Body[]) => void;
}

export function initSortChallenge(
	issues: LinearIssue[],
	canvasWidth: number,
	canvasHeight: number,
	actions: SortChallengeActions,
): () => void {
	actions.setGravity(SORT_GRAVITY);
	const bins = createBins(canvasWidth);
	actions.setBins(bins);
	actions.startTimer(SORT_TIMER_SECONDS);

	// Create physical bin walls
	const binWalls = createBinWalls(canvasWidth, canvasHeight);
	actions.addBodies(binWalls);

	let idx = 0;
	const interval = setInterval(() => {
		if (idx >= issues.length) {
			clearInterval(interval);
			return;
		}
		const issue = issues[idx++];
		const x = canvasWidth / 2 + (Math.random() - 0.5) * 200;
		actions.addCard(issue, x, -80);
	}, SORT_SPAWN_INTERVAL_MS);

	return () => {
		clearInterval(interval);
	};
}

/**
 * Check if a card has settled into a bin (below deadline line).
 * Returns which bin it's in and whether it's correct.
 */
export function checkCardInBin(
	card: PhysicsCard,
	bins: SortBin[],
	canvasHeight: number,
): { binPriority: number; correct: boolean } | null {
	const { x, y } = card.body.position;
	const deadlineY = canvasHeight - SORT_DEADLINE_Y_OFFSET;

	if (y < deadlineY) return null;

	for (const bin of bins) {
		if (x >= bin.x && x < bin.x + bin.width) {
			return {
				binPriority: bin.priority,
				correct: card.issue.priority === bin.priority,
			};
		}
	}
	return null;
}

/**
 * Check if a card has crossed the deadline line without being dragged.
 * A card "misses" if it crosses the deadline and has low velocity (not being held).
 */
export function hasCardCrossedDeadline(
	card: PhysicsCard,
	canvasHeight: number,
): boolean {
	const { y } = card.body.position;
	const deadlineY = canvasHeight - SORT_DEADLINE_Y_OFFSET;
	return y > deadlineY;
}
