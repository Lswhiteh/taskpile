import type { EnemyStats, PartyMember, TurnEntry } from "../../types/jrpg.js";

/** Build the turn queue for a round, sorted by SPD descending. */
export function buildTurnQueue(
	party: PartyMember[],
	enemy: EnemyStats | null,
): TurnEntry[] {
	const entries: TurnEntry[] = [];

	for (let i = 0; i < party.length; i++) {
		if (party[i].isAlive) {
			entries.push({
				type: "party",
				index: i,
				name: party[i].name,
			});
		}
	}

	if (enemy && enemy.hp > 0) {
		entries.push({
			type: "enemy",
			index: 0,
			name: enemy.identifier,
		});
	}

	// Sort by SPD descending; ties broken by party first
	entries.sort((a, b) => {
		const spdA = a.type === "party" ? party[a.index].spd : (enemy?.spd ?? 0);
		const spdB = b.type === "party" ? party[b.index].spd : (enemy?.spd ?? 0);
		if (spdB !== spdA) return spdB - spdA;
		// Party members go before enemy on ties
		if (a.type === "party" && b.type === "enemy") return -1;
		if (a.type === "enemy" && b.type === "party") return 1;
		return a.index - b.index;
	});

	return entries;
}

/** Insert a "1 More!" extra turn immediately after the current position. */
export function insertExtraTurn(
	queue: TurnEntry[],
	afterIndex: number,
	entry: TurnEntry,
): TurnEntry[] {
	const newQueue = [...queue];
	newQueue.splice(afterIndex + 1, 0, {
		...entry,
		isExtra: true,
	});
	return newQueue;
}
