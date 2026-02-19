import { STACK_SPAWN_INTERVAL_MS } from "../../config/constants.js";
import type { LinearIssue } from "../../types/linear.js";
import type { PhysicsCard } from "../../types/physics.js";

export interface StackAttackActions {
	addCard: (issue: LinearIssue, x?: number, y?: number) => void;
	setGravity: (y: number) => void;
}

export function initStackAttack(
	issues: LinearIssue[],
	canvasWidth: number,
	actions: StackAttackActions,
): () => void {
	actions.setGravity(0.8);

	let idx = 0;
	const interval = setInterval(() => {
		if (idx >= issues.length) {
			clearInterval(interval);
			return;
		}
		const issue = issues[idx++];
		const x = Math.random() * (canvasWidth - 200) + 100;
		actions.addCard(issue, x, -50);
	}, STACK_SPAWN_INTERVAL_MS);

	return () => clearInterval(interval);
}

export function measureStackHeight(
	cards: PhysicsCard[],
	canvasHeight: number,
): number {
	if (cards.length === 0) return 0;

	let highestY = canvasHeight;
	for (const card of cards) {
		const y = card.body.position.y - card.height / 2;
		if (y < highestY) highestY = y;
	}

	return Math.max(0, Math.round(canvasHeight - highestY));
}

export function checkGameOver(
	cards: PhysicsCard[],
	canvasHeight: number,
): boolean {
	for (const card of cards) {
		if (card.body.position.y > canvasHeight + 200) {
			return true;
		}
	}
	return false;
}
