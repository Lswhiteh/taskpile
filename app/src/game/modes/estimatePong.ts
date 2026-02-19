import Matter from "matter-js";
import type { LinearIssue } from "../../types/linear.js";
import type { PhysicsCard } from "../../types/physics.js";

export const PONG_PADDLE_LABEL = "pong-paddle";

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 120;
const PADDLE_X = 40;
const WALL_THICKNESS = 50;
const CARD_SPAWN_X_OFFSET = 50;
const CARD_VELOCITY_X = -4;
const SPAWN_INTERVAL_MS = 2500;
const TIMER_SECONDS = 60;
const PADDLE_HIT_X_THRESHOLD = 60;
const CARD_OFF_LEFT_THRESHOLD = -50;

export interface EstimatePongActions {
	addCard: (issue: LinearIssue, x?: number, y?: number) => void;
	setGravity: (y: number) => void;
	startTimer: (seconds: number) => void;
	addScore: (points: number) => void;
	addBodies: (bodies: Matter.Body[]) => void;
}

export function isHighEstimate(issue: LinearIssue): boolean {
	return issue.estimate !== null && issue.estimate >= 5;
}

export function hasCardPassedPaddle(card: PhysicsCard): boolean {
	return card.body.position.x < CARD_OFF_LEFT_THRESHOLD;
}

export function hasCardHitPaddle(
	card: PhysicsCard,
	paddleBody: Matter.Body,
): boolean {
	const cardX = card.body.position.x;
	const cardY = card.body.position.y;
	const paddleY = paddleBody.position.y;

	if (cardX >= PADDLE_HIT_X_THRESHOLD) return false;

	const paddleTop = paddleY - PADDLE_HEIGHT / 2;
	const paddleBottom = paddleY + PADDLE_HEIGHT / 2;

	return cardY >= paddleTop && cardY <= paddleBottom;
}

export function updatePaddlePosition(
	paddleBody: Matter.Body,
	mouseY: number,
): void {
	Matter.Body.setPosition(paddleBody, {
		x: paddleBody.position.x,
		y: mouseY,
	});
}

function randomBetween(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

export function initEstimatePong(
	issues: LinearIssue[],
	canvasWidth: number,
	canvasHeight: number,
	actions: EstimatePongActions,
): () => void {
	actions.setGravity(0);
	actions.startTimer(TIMER_SECONDS);

	// Create paddle on the left side
	const paddle = Matter.Bodies.rectangle(
		PADDLE_X,
		canvasHeight / 2,
		PADDLE_WIDTH,
		PADDLE_HEIGHT,
		{
			isStatic: true,
			label: PONG_PADDLE_LABEL,
			restitution: 0.8,
			frictionAir: 0,
		},
	);

	// Top wall
	const topWall = Matter.Bodies.rectangle(
		canvasWidth / 2,
		-WALL_THICKNESS / 2,
		canvasWidth + WALL_THICKNESS * 2,
		WALL_THICKNESS,
		{ isStatic: true, label: "pong-wall-top", restitution: 0.8 },
	);

	// Bottom wall
	const bottomWall = Matter.Bodies.rectangle(
		canvasWidth / 2,
		canvasHeight + WALL_THICKNESS / 2,
		canvasWidth + WALL_THICKNESS * 2,
		WALL_THICKNESS,
		{ isStatic: true, label: "pong-wall-bottom", restitution: 0.8 },
	);

	// Right wall (cards spawn from here, wall sits just off-screen to the right)
	const rightWall = Matter.Bodies.rectangle(
		canvasWidth + WALL_THICKNESS / 2,
		canvasHeight / 2,
		WALL_THICKNESS,
		canvasHeight + WALL_THICKNESS * 2,
		{ isStatic: true, label: "pong-wall-right", restitution: 0.8 },
	);

	actions.addBodies([paddle, topWall, bottomWall, rightWall]);

	let idx = 0;
	const interval = setInterval(() => {
		if (idx >= issues.length) {
			clearInterval(interval);
			return;
		}
		const issue = issues[idx++];
		const spawnX = canvasWidth - CARD_SPAWN_X_OFFSET;
		const spawnY = randomBetween(60, canvasHeight - 60);
		actions.addCard(issue, spawnX, spawnY);
	}, SPAWN_INTERVAL_MS);

	// Return cleanup function - velocity/physics properties on cards are set by
	// the game engine via addCard; the mode relies on addCard hooking into the
	// physics world. After addCard we apply velocity via a deferred call so the
	// body exists in the world first.
	const velocityInterval = setInterval(() => {
		// Nothing to do here - velocity is applied externally when cards are added.
		// This interval is a placeholder; actual velocity injection is handled by
		// the game engine listening to addCard events with pong-specific overrides.
	}, 100);

	return () => {
		clearInterval(interval);
		clearInterval(velocityInterval);
	};
}

/**
 * Apply initial leftward velocity to a newly spawned pong card.
 * Should be called by the game engine immediately after the card body is
 * added to the Matter.js world.
 */
export function applyPongCardVelocity(body: Matter.Body): void {
	body.frictionAir = 0;
	body.restitution = 0.8;
	body.density = 0.001;
	Matter.Body.setVelocity(body, {
		x: CARD_VELOCITY_X,
		y: randomBetween(-1, 1),
	});
}
