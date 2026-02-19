import type { EnemyStats } from "../../types/jrpg.js";
import type { LinearIssue } from "../../types/linear.js";
import { getResistance, getWeakness, priorityToElement } from "./elements.js";

/** Create an enemy from a Linear issue. */
export function createEnemy(issue: LinearIssue): EnemyStats {
	const estimate = issue.estimate ?? 1;
	const priority = issue.priority;
	const element = priorityToElement(priority);

	const hp = Math.max(30, estimate * 18);
	const atk = Math.max(6, (5 - priority) * 5);
	const def = Math.max(2, Math.floor(estimate * 1.5));
	const spd = Math.max(4, 12 - priority * 2);

	const name =
		issue.title.length > 28 ? `${issue.title.slice(0, 28)}..` : issue.title;

	return {
		hp,
		maxHp: hp,
		atk,
		def,
		spd,
		name,
		identifier: issue.identifier,
		priority,
		element,
		weakness: getWeakness(element),
		resistance: getResistance(element),
		weaknessRevealed: false,
		statuses: [],
	};
}
