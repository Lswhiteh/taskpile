import type { LinearIssue } from "../../types/linear.js";

export interface FreePlayActions {
	dropCards: (issues: LinearIssue[]) => void;
	setGravity: (y: number) => void;
}

export function initFreePlay(
	issues: LinearIssue[],
	actions: FreePlayActions,
): void {
	actions.setGravity(1.2);
	actions.dropCards(issues);
}
