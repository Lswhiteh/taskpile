import Matter from "matter-js";
import type { LinearIssue } from "../../types/linear.js";
import type { PhysicsCard } from "../../types/physics.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TETRIS_SPAWN_INTERVAL_MS = 3000;
export const TETRIS_TIMER_SECONDS = 60;

const TETRIS_GRAVITY = 0.6;
const TETRIS_WALL_THICKNESS = 60;
const TETRIS_ROW_SLICE_HEIGHT = 40;
const TETRIS_ROW_FILL_RATIO = 0.85;
const TETRIS_SCORE_PER_CARD = 10;
const TETRIS_MULTI_CLEAR_BONUS = 5;
const TETRIS_MULTI_CLEAR_THRESHOLD = 3;
const TETRIS_GAME_OVER_Y = 50;

// ---------------------------------------------------------------------------
// Actions interface
// ---------------------------------------------------------------------------

export interface SprintTetrisActions {
	addCard: (issue: LinearIssue, x?: number, y?: number) => void;
	setGravity: (y: number) => void;
	startTimer: (seconds: number) => void;
	addScore: (points: number) => void;
	addBodies: (bodies: Matter.Body[]) => void;
}

// ---------------------------------------------------------------------------
// Wall construction
// ---------------------------------------------------------------------------

function createTetrisWalls(
	canvasWidth: number,
	canvasHeight: number,
): Matter.Body[] {
	const walls: Matter.Body[] = [];

	// Floor — sits just below the visible canvas bottom.
	walls.push(
		Matter.Bodies.rectangle(
			canvasWidth / 2,
			canvasHeight + TETRIS_WALL_THICKNESS / 2,
			canvasWidth + TETRIS_WALL_THICKNESS * 2,
			TETRIS_WALL_THICKNESS,
			{ isStatic: true, label: "wall-floor" },
		),
	);

	// Left wall
	walls.push(
		Matter.Bodies.rectangle(
			-TETRIS_WALL_THICKNESS / 2,
			canvasHeight / 2,
			TETRIS_WALL_THICKNESS,
			canvasHeight * 2,
			{ isStatic: true, label: "wall-left" },
		),
	);

	// Right wall
	walls.push(
		Matter.Bodies.rectangle(
			canvasWidth + TETRIS_WALL_THICKNESS / 2,
			canvasHeight / 2,
			TETRIS_WALL_THICKNESS,
			canvasHeight * 2,
			{ isStatic: true, label: "wall-right" },
		),
	);

	return walls;
}

// ---------------------------------------------------------------------------
// Row-clear logic
// ---------------------------------------------------------------------------

/**
 * Scans horizontal bands (TETRIS_ROW_SLICE_HEIGHT px tall) from the bottom of
 * the canvas upward.  For each slice, sum the widths of cards whose centre-y
 * falls inside that slice.  If the total occupied width exceeds
 * TETRIS_ROW_FILL_RATIO * canvasWidth the row is considered full.
 *
 * Returns an array of issue IDs for every card that belongs to a full row.
 * A card can only appear once in the result even if it spans multiple slices.
 */
export function checkRowClear(
	cards: PhysicsCard[],
	canvasWidth: number,
	canvasHeight: number,
): string[] {
	if (cards.length === 0) return [];

	const threshold = canvasWidth * TETRIS_ROW_FILL_RATIO;
	const idsToRemove = new Set<string>();

	// Determine the range of slices we need to check.
	// We only look from the floor upward as far as the highest card.
	let highestCardY = canvasHeight;
	for (const card of cards) {
		const topEdge = card.body.position.y - card.height / 2;
		if (topEdge < highestCardY) highestCardY = topEdge;
	}

	const totalSlices = Math.ceil(
		(canvasHeight - Math.max(0, highestCardY)) / TETRIS_ROW_SLICE_HEIGHT,
	);

	for (let sliceIdx = 0; sliceIdx < totalSlices; sliceIdx++) {
		// The slice band runs from sliceBottom (inclusive) up to sliceTop.
		const sliceBottom = canvasHeight - sliceIdx * TETRIS_ROW_SLICE_HEIGHT;
		const sliceTop = sliceBottom - TETRIS_ROW_SLICE_HEIGHT;
		const sliceMidY = (sliceBottom + sliceTop) / 2;

		// Accumulate widths of cards whose centre falls in this slice.
		let totalWidth = 0;
		const cardsInSlice: PhysicsCard[] = [];

		for (const card of cards) {
			const centerY = card.body.position.y;
			if (centerY >= sliceTop && centerY < sliceBottom) {
				totalWidth += card.width;
				cardsInSlice.push(card);
			}
		}

		// Suppress unused variable warning — sliceMidY used for potential debug.
		void sliceMidY;

		if (totalWidth >= threshold) {
			for (const card of cardsInSlice) {
				idsToRemove.add(card.issue.id);
			}
		}
	}

	return Array.from(idsToRemove);
}

// ---------------------------------------------------------------------------
// Scoring helper
// ---------------------------------------------------------------------------

/**
 * Calculates the score for a single row-clear event.
 *
 * +TETRIS_SCORE_PER_CARD  for every card cleared.
 * +TETRIS_MULTI_CLEAR_BONUS if 3 or more cards were cleared at once.
 */
export function scoreClear(clearedCount: number): number {
	if (clearedCount === 0) return 0;
	const base = clearedCount * TETRIS_SCORE_PER_CARD;
	const bonus =
		clearedCount >= TETRIS_MULTI_CLEAR_THRESHOLD ? TETRIS_MULTI_CLEAR_BONUS : 0;
	return base + bonus;
}

// ---------------------------------------------------------------------------
// Pile height measurement
// ---------------------------------------------------------------------------

/**
 * Returns the height of the pile measured from the canvas floor upward.
 * Returns 0 when there are no cards.
 */
export function measurePileHeight(
	cards: PhysicsCard[],
	canvasHeight: number,
): number {
	if (cards.length === 0) return 0;

	let highestY = canvasHeight;
	for (const card of cards) {
		const topEdge = card.body.position.y - card.height / 2;
		if (topEdge < highestY) highestY = topEdge;
	}

	return Math.max(0, Math.round(canvasHeight - highestY));
}

// ---------------------------------------------------------------------------
// Game-over detection
// ---------------------------------------------------------------------------

/**
 * Returns true if any card's centre-y has risen above the game-over line
 * (TETRIS_GAME_OVER_Y pixels from the top of the canvas), signalling that
 * the pile has reached the top and the game should end.
 */
export function hasReachedTop(cards: PhysicsCard[]): boolean {
	for (const card of cards) {
		if (card.body.position.y < TETRIS_GAME_OVER_Y) {
			return true;
		}
	}
	return false;
}

// ---------------------------------------------------------------------------
// Mode initialiser
// ---------------------------------------------------------------------------

/**
 * Initialise Sprint Tetris mode.
 *
 * - Builds floor and side walls (no ceiling).
 * - Sets gravity to TETRIS_GRAVITY (0.6) — slow enough for the player to
 *   position cards before they land.
 * - Starts the 60-second countdown.
 * - Spawns one card every TETRIS_SPAWN_INTERVAL_MS from the top centre of the
 *   canvas, cycling through the provided issues.
 *
 * Returns a cleanup function that cancels all intervals/timeouts.
 */
export function initSprintTetris(
	issues: LinearIssue[],
	canvasWidth: number,
	canvasHeight: number,
	actions: SprintTetrisActions,
): () => void {
	// Physics + timer setup.
	actions.setGravity(TETRIS_GRAVITY);
	actions.startTimer(TETRIS_TIMER_SECONDS);

	// Static world boundaries.
	const walls = createTetrisWalls(canvasWidth, canvasHeight);
	actions.addBodies(walls);

	// Spawn cards one at a time from the top centre.
	let idx = 0;

	const spawnInterval = setInterval(() => {
		if (issues.length === 0) return;

		const issue = issues[idx % issues.length];
		idx++;

		// Centre horizontally, just above the visible canvas.
		const x = canvasWidth / 2;
		const y = -40;

		actions.addCard(issue, x, y);
	}, TETRIS_SPAWN_INTERVAL_MS);

	return () => {
		clearInterval(spawnInterval);
	};
}
