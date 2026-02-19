import Matter from "matter-js";
import type { LinearIssue } from "../../types/linear.js";
import type { PhysicsCard } from "../../types/physics.js";

const AVALANCHE_TIMER_SECONDS = 60;
const AVALANCHE_INITIAL_GRAVITY = 0.5;
const AVALANCHE_GRAVITY_INCREMENT = 0.1;
const AVALANCHE_GRAVITY_INTERVAL_MS = 5000;
const AVALANCHE_CARD_STAGGER_MS = 50;
const AVALANCHE_WALL_THICKNESS = 60;
const AVALANCHE_DIVIDER_THICKNESS = 12;

export const SAFE_ZONE_X_RATIO = 0.75;
export const SAFE_ZONE_WALL_HEIGHT = 300;

export interface PriorityAvalancheActions {
	addCard: (issue: LinearIssue, x?: number, y?: number) => void;
	setGravity: (y: number) => void;
	startTimer: (seconds: number) => void;
	addScore: (points: number) => void;
	addBodies: (bodies: Matter.Body[]) => void;
}

/**
 * Returns true if the issue is a critical priority card (Urgent or High).
 * These are the cards the player must save in the safe zone to score points.
 */
export function isCriticalCard(issue: LinearIssue): boolean {
	return issue.priority === 1 || issue.priority === 2;
}

/**
 * Returns true if the card's center position is within the safe zone
 * (right side of the screen, past the divider wall).
 */
export function isCardInSafeZone(
	card: PhysicsCard,
	canvasWidth: number,
): boolean {
	return card.body.position.x > canvasWidth * SAFE_ZONE_X_RATIO;
}

/**
 * Counts the number of critical priority cards (Urgent or High) that are
 * currently resting inside the safe zone.
 */
export function countSavedCards(
	cards: PhysicsCard[],
	canvasWidth: number,
): number {
	let count = 0;
	for (const card of cards) {
		if (isCriticalCard(card.issue) && isCardInSafeZone(card, canvasWidth)) {
			count++;
		}
	}
	return count;
}

/**
 * Create the floor, side walls, and the safe zone divider wall.
 * The divider sits at x = canvasWidth * SAFE_ZONE_X_RATIO and extends
 * SAFE_ZONE_WALL_HEIGHT pixels upward from the floor, leaving a gap at the
 * top so the player can toss cards over it into the safe zone.
 */
function createAvalancheWalls(
	canvasWidth: number,
	canvasHeight: number,
): Matter.Body[] {
	const walls: Matter.Body[] = [];

	// Floor
	walls.push(
		Matter.Bodies.rectangle(
			canvasWidth / 2,
			canvasHeight + AVALANCHE_WALL_THICKNESS / 2,
			canvasWidth + AVALANCHE_WALL_THICKNESS * 2,
			AVALANCHE_WALL_THICKNESS,
			{ isStatic: true, label: "wall-floor" },
		),
	);

	// Left wall
	walls.push(
		Matter.Bodies.rectangle(
			-AVALANCHE_WALL_THICKNESS / 2,
			canvasHeight / 2,
			AVALANCHE_WALL_THICKNESS,
			canvasHeight * 2,
			{ isStatic: true, label: "wall-left" },
		),
	);

	// Right wall
	walls.push(
		Matter.Bodies.rectangle(
			canvasWidth + AVALANCHE_WALL_THICKNESS / 2,
			canvasHeight / 2,
			AVALANCHE_WALL_THICKNESS,
			canvasHeight * 2,
			{ isStatic: true, label: "wall-right" },
		),
	);

	// Safe zone divider — partial height wall anchored at the floor.
	// Its top edge sits at canvasHeight - SAFE_ZONE_WALL_HEIGHT, leaving the
	// area above it open so cards can be tossed over.
	const dividerX = canvasWidth * SAFE_ZONE_X_RATIO;
	const dividerCenterY = canvasHeight - SAFE_ZONE_WALL_HEIGHT / 2;

	walls.push(
		Matter.Bodies.rectangle(
			dividerX,
			dividerCenterY,
			AVALANCHE_DIVIDER_THICKNESS,
			SAFE_ZONE_WALL_HEIGHT,
			{ isStatic: true, label: "safe-zone-divider" },
		),
	);

	return walls;
}

/**
 * Initialise Priority Avalanche mode.
 *
 * All cards are dropped from the top of the canvas with a short stagger
 * (50 ms apart) at random horizontal positions across the left ¾ of the
 * screen so they land in a chaotic pile away from the safe zone.
 *
 * Gravity starts at 0.5 and increases by 0.1 every 5 seconds.
 * The 60-second countdown begins immediately.
 *
 * Returns a cleanup function that cancels all running intervals/timeouts.
 */
export function initPriorityAvalanche(
	issues: LinearIssue[],
	canvasWidth: number,
	canvasHeight: number,
	actions: PriorityAvalancheActions,
): () => void {
	// Set initial gravity and start the countdown timer.
	actions.setGravity(AVALANCHE_INITIAL_GRAVITY);
	actions.startTimer(AVALANCHE_TIMER_SECONDS);

	// Add the floor, side walls, and the safe zone divider.
	const walls = createAvalancheWalls(canvasWidth, canvasHeight);
	actions.addBodies(walls);

	// Drop all cards at once with staggered timing so they don't perfectly
	// overlap on spawn.  Cards land in the left ¾ of the canvas (the "danger
	// zone") to avoid immediately cluttering the safe zone area.
	const spawnMargin = 80;
	const spawnMaxX = canvasWidth * SAFE_ZONE_X_RATIO - spawnMargin;
	const timeouts: ReturnType<typeof setTimeout>[] = [];

	for (let i = 0; i < issues.length; i++) {
		const delay = i * AVALANCHE_CARD_STAGGER_MS;
		const handle = setTimeout(() => {
			const x = spawnMargin + Math.random() * (spawnMaxX - spawnMargin);
			// Spawn above the visible canvas so they fall in naturally.
			actions.addCard(issues[i], x, -60 - Math.random() * 40);
		}, delay);
		timeouts.push(handle);
	}

	// Gravity escalation — increases by AVALANCHE_GRAVITY_INCREMENT every
	// AVALANCHE_GRAVITY_INTERVAL_MS milliseconds for the duration of the game.
	let currentGravity = AVALANCHE_INITIAL_GRAVITY;
	const gravityInterval = setInterval(() => {
		currentGravity =
			Math.round((currentGravity + AVALANCHE_GRAVITY_INCREMENT) * 10) / 10;
		actions.setGravity(currentGravity);
	}, AVALANCHE_GRAVITY_INTERVAL_MS);

	return () => {
		for (const handle of timeouts) {
			clearTimeout(handle);
		}
		clearInterval(gravityInterval);
	};
}
