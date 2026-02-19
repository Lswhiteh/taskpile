import type { LinearIssue } from "../../types/linear.js";

/** XP earned from defeating an enemy. */
export function calculateXp(issue: LinearIssue): number {
	const estimate = issue.estimate ?? 1;
	const priority = issue.priority;
	return estimate * 8 + (5 - priority) * 5 + 10;
}

/** XP required to reach the next level from current level. */
export function xpToNextLevel(level: number): number {
	return Math.round(50 * level * (1 + level * 0.15));
}
