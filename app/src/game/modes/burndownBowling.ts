import Matter from "matter-js";
import type { LinearIssue } from "../../types/linear.js";
import type { PhysicsCard } from "../../types/physics.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BOWLING_FRAMES = 3;
export const BOWLING_BALL_LABEL = "bowling-ball";

const WALL_THICKNESS = 60;
const BALL_RADIUS = 30;
const BALL_DENSITY = 0.05;
const BALL_RESTITUTION = 0.9;
const BALL_FRICTION = 0;
const BALL_FRICTION_AIR = 0;

/** Number of pins per row, arranged from rightmost (row 0) to leftmost (row 3). */
const PIN_ROWS = [1, 2, 3, 4];
const MAX_PINS = 10;

/** Horizontal gap between pin rows (left–right direction). */
const PIN_ROW_SPACING_X = 100;

/** Vertical gap between cards within the same row. */
const PIN_CARD_SPACING_Y = 90;

/** How far (px) a card must move from its origin to be considered "knocked down". */
const KNOCKED_DOWN_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface BurndownBowlingActions {
	/** Place a single card into the physics world at the given position. */
	addCard: (issue: LinearIssue, x?: number, y?: number) => void;
	/** Set world gravity (y component). Use 0 for top-down view. */
	setGravity: (y: number) => void;
	/** Add to the player's score. */
	addScore: (points: number) => void;
	/** Add arbitrary Matter.js bodies directly to the world. */
	addBodies: (bodies: Matter.Body[]) => void;
}

// ---------------------------------------------------------------------------
// Bowling ball factory
// ---------------------------------------------------------------------------

/**
 * Create a fresh bowling ball body positioned off the left edge, vertically
 * centred on the canvas.
 */
export function createBowlingBall(canvasHeight: number): Matter.Body {
	return Matter.Bodies.circle(80, canvasHeight / 2, BALL_RADIUS, {
		density: BALL_DENSITY,
		restitution: BALL_RESTITUTION,
		friction: BALL_FRICTION,
		frictionAir: BALL_FRICTION_AIR,
		label: BOWLING_BALL_LABEL,
	});
}

// ---------------------------------------------------------------------------
// Scoring helper
// ---------------------------------------------------------------------------

/**
 * Count how many cards have moved more than KNOCKED_DOWN_THRESHOLD pixels
 * from their original positions (Euclidean distance).
 */
export function countKnockedDown(
	cards: PhysicsCard[],
	originalPositions: Map<string, { x: number; y: number }>,
): number {
	let count = 0;
	for (const card of cards) {
		const origin = originalPositions.get(card.body.id.toString());
		if (!origin) continue;
		const dx = card.body.position.x - origin.x;
		const dy = card.body.position.y - origin.y;
		if (Math.sqrt(dx * dx + dy * dy) > KNOCKED_DOWN_THRESHOLD) {
			count++;
		}
	}
	return count;
}

// ---------------------------------------------------------------------------
// Wall builder (no left wall — ball launches from the left)
// ---------------------------------------------------------------------------

function createBowlingWalls(
	canvasWidth: number,
	canvasHeight: number,
): Matter.Body[] {
	return [
		// Top wall
		Matter.Bodies.rectangle(
			canvasWidth / 2,
			-WALL_THICKNESS / 2,
			canvasWidth + WALL_THICKNESS * 2,
			WALL_THICKNESS,
			{ isStatic: true, label: "wall-top" },
		),
		// Bottom wall
		Matter.Bodies.rectangle(
			canvasWidth / 2,
			canvasHeight + WALL_THICKNESS / 2,
			canvasWidth + WALL_THICKNESS * 2,
			WALL_THICKNESS,
			{ isStatic: true, label: "wall-bottom" },
		),
		// Right wall
		Matter.Bodies.rectangle(
			canvasWidth + WALL_THICKNESS / 2,
			canvasHeight / 2,
			WALL_THICKNESS,
			canvasHeight * 2,
			{ isStatic: true, label: "wall-right" },
		),
	];
}

// ---------------------------------------------------------------------------
// Pin placement
// ---------------------------------------------------------------------------

/**
 * Compute pin positions for the bowling triangle.
 *
 * Layout (top-down view):
 *   - Row 0 (rightmost): 1 card at canvasWidth * 0.7
 *   - Row 1: 2 cards at x - 100
 *   - Row 2: 3 cards at x - 200
 *   - Row 3: 4 cards at x - 300
 *
 * Rows are offset by PIN_ROW_SPACING_X each step to the left.
 * Cards in each row are evenly spaced vertically around canvas centre.
 */
function computePinPositions(
	canvasWidth: number,
	canvasHeight: number,
): { x: number; y: number }[] {
	const positions: { x: number; y: number }[] = [];
	const startX = canvasWidth * 0.7;

	for (let rowIndex = 0; rowIndex < PIN_ROWS.length; rowIndex++) {
		const pinsInRow = PIN_ROWS[rowIndex];
		const x = startX - rowIndex * PIN_ROW_SPACING_X;

		// Vertically centre the row around canvas mid-point.
		const totalHeight = (pinsInRow - 1) * PIN_CARD_SPACING_Y;
		const topY = canvasHeight / 2 - totalHeight / 2;

		for (let pinIndex = 0; pinIndex < pinsInRow; pinIndex++) {
			positions.push({ x, y: topY + pinIndex * PIN_CARD_SPACING_Y });
		}
	}

	return positions;
}

// ---------------------------------------------------------------------------
// Reset pins helper (for subsequent frames)
// ---------------------------------------------------------------------------

/**
 * Re-create the pin formation for a new bowling frame.
 * Call this between frames after clearing the old card bodies.
 */
export function resetPins(
	issues: LinearIssue[],
	canvasWidth: number,
	canvasHeight: number,
	actions: BurndownBowlingActions,
): void {
	const positions = computePinPositions(canvasWidth, canvasHeight);
	const pinCount = Math.min(issues.length, MAX_PINS, positions.length);

	for (let i = 0; i < pinCount; i++) {
		actions.addCard(issues[i], positions[i].x, positions[i].y);
	}
}

// ---------------------------------------------------------------------------
// Main initialiser
// ---------------------------------------------------------------------------

/**
 * Initialise Burndown Bowling mode.
 *
 * - Gravity is set to 0 (top-down / overhead view).
 * - Top, bottom, and right walls are added (no left wall).
 * - Up to 10 issues are placed as cards in a bowling-pin triangle on the
 *   right side of the canvas.
 * - A bowling ball is placed near the left edge for the player to fling with
 *   the existing MouseConstraint.
 *
 * Returns a no-op cleanup function (no timers/intervals are started).
 */
export function initBurndownBowling(
	issues: LinearIssue[],
	canvasWidth: number,
	canvasHeight: number,
	actions: BurndownBowlingActions,
): () => void {
	// Top-down view — zero gravity.
	actions.setGravity(0);

	// Add boundary walls (no left wall so the ball can enter from the left).
	const walls = createBowlingWalls(canvasWidth, canvasHeight);
	actions.addBodies(walls);

	// Place pin cards in the triangle formation.
	const positions = computePinPositions(canvasWidth, canvasHeight);
	const pinCount = Math.min(issues.length, MAX_PINS, positions.length);

	for (let i = 0; i < pinCount; i++) {
		actions.addCard(issues[i], positions[i].x, positions[i].y);
	}

	// Add the bowling ball.
	const ball = createBowlingBall(canvasHeight);
	actions.addBodies([ball]);

	// No timers or intervals — cleanup is a no-op.
	return () => {};
}
