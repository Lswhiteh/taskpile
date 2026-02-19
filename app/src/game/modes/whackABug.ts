import Matter from "matter-js";
import type { LinearIssue } from "../../types/linear.js";
import type { PhysicsCard } from "../../types/physics.js";

const WHACK_TIMER_SECONDS = 60;
const WHACK_BUG_POINTS = 1;
const WHACK_NON_BUG_POINTS = -1;
const WHACK_ESCAPE_POINTS = -1;
const WHACK_GRAVITY = 0.3;
const WHACK_INITIAL_SPAWN_MS = 2000;
const WHACK_MIN_SPAWN_MS = 600;
const WHACK_SPAWN_REDUCTION_MS = 50;
const WHACK_SPAWN_REDUCTION_EVERY = 5;
const WHACK_CARD_VELOCITY_Y = -8;
const WHACK_SPAWN_Y_OFFSET = 100;
const WHACK_ESCAPE_Y = -100;

export interface WhackABugActions {
	addCard: (issue: LinearIssue, x?: number, y?: number) => void;
	setGravity: (y: number) => void;
	startTimer: (seconds: number) => void;
	addScore: (points: number) => void;
	addBodies: (bodies: Matter.Body[]) => void;
}

/**
 * Returns true if the given issue should be treated as a "bug" target.
 * An issue is a bug if any of its labels contains "bug" (case-insensitive).
 */
export function isCardBug(issue: LinearIssue): boolean {
	return issue.labels.some((label) => label.name.toLowerCase().includes("bug"));
}

/**
 * Returns true if the card has floated off the top of the canvas and escaped.
 * A card has escaped when its y position is above the escape threshold.
 */
export function hasCardEscaped(card: PhysicsCard): boolean {
	return card.body.position.y < WHACK_ESCAPE_Y;
}

export function initWhackABug(
	issues: LinearIssue[],
	canvasWidth: number,
	canvasHeight: number,
	actions: WhackABugActions,
): () => void {
	actions.setGravity(WHACK_GRAVITY);
	actions.startTimer(WHACK_TIMER_SECONDS);

	// Shuffle issues so spawn order is unpredictable
	const pool = [...issues].sort(() => Math.random() - 0.5);

	let spawnCount = 0;
	let currentIntervalMs = WHACK_INITIAL_SPAWN_MS;
	let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
	let stopped = false;

	function scheduleNextSpawn(): void {
		if (stopped) return;

		timeoutHandle = setTimeout(() => {
			if (stopped) return;

			// Pick a random issue from the pool (cycle through with wrap)
			const issue = pool[spawnCount % pool.length];
			spawnCount++;

			// Random x within canvas, keeping card away from edges
			const margin = 80;
			const x = margin + Math.random() * (canvasWidth - margin * 2);
			const y = canvasHeight + WHACK_SPAWN_Y_OFFSET;

			actions.addCard(issue, x, y);

			// Recalculate interval — reduce every WHACK_SPAWN_REDUCTION_EVERY spawns
			const reductions = Math.floor(spawnCount / WHACK_SPAWN_REDUCTION_EVERY);
			currentIntervalMs = Math.max(
				WHACK_MIN_SPAWN_MS,
				WHACK_INITIAL_SPAWN_MS - reductions * WHACK_SPAWN_REDUCTION_MS,
			);

			scheduleNextSpawn();
		}, currentIntervalMs);
	}

	scheduleNextSpawn();

	return () => {
		stopped = true;
		if (timeoutHandle !== null) {
			clearTimeout(timeoutHandle);
			timeoutHandle = null;
		}
	};
}

/**
 * Called by the game engine when a card is clicked/smashed by the player.
 * Awards or deducts points based on whether the card is a bug.
 */
export function onCardSmashed(
	card: PhysicsCard,
	actions: Pick<WhackABugActions, "addScore">,
): void {
	if (isCardBug(card.issue)) {
		actions.addScore(WHACK_BUG_POINTS);
	} else {
		actions.addScore(WHACK_NON_BUG_POINTS);
	}
}

/**
 * Called by the game engine when a card is detected as having escaped off the top.
 * Deducts a point only if the escaped card was a bug.
 */
export function onCardEscaped(
	card: PhysicsCard,
	actions: Pick<WhackABugActions, "addScore">,
): void {
	if (isCardBug(card.issue)) {
		actions.addScore(WHACK_ESCAPE_POINTS);
	}
}

/**
 * Apply the upward pop velocity to a newly spawned card.
 * The game engine should call this immediately after addCard resolves
 * and passes back the PhysicsCard reference.
 */
export function applyPopVelocity(card: PhysicsCard): void {
	Matter.Body.setVelocity(card.body, { x: 0, y: WHACK_CARD_VELOCITY_Y });
}
