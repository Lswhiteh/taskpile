import type { LinearIssue } from "../../types/linear.js";

export interface PlayerStats {
	hp: number;
	maxHp: number;
	attack: number;
	defense: number;
	specialUses: number;
	defeated: number;
}

export interface EnemyStats {
	hp: number;
	maxHp: number;
	attack: number;
	name: string;
	identifier: string;
	priority: number;
}

export type BattleAction = "attack" | "defend" | "special";

export interface BattleResult {
	playerDamage: number;
	enemyDamage: number;
	message: string;
	enemyDefeated: boolean;
	playerDefeated: boolean;
}

export function createPlayer(): PlayerStats {
	return {
		hp: 100,
		maxHp: 100,
		attack: 15,
		defense: 5,
		specialUses: 3,
		defeated: 0,
	};
}

export function createEnemy(issue: LinearIssue): EnemyStats {
	const hp = Math.max(20, (issue.estimate ?? 1) * 15);
	const attack = Math.max(5, (5 - issue.priority) * 4);
	const name = issue.title.length > 30 ? issue.title.slice(0, 30) : issue.title;
	return {
		hp,
		maxHp: hp,
		attack,
		name,
		identifier: issue.identifier,
		priority: issue.priority,
	};
}

export function executeTurn(
	player: PlayerStats,
	enemy: EnemyStats,
	action: BattleAction,
): BattleResult {
	let enemyDamage = 0;
	let playerDamage = 0;
	let message = "";

	const randomInt = (max: number): number =>
		Math.floor(Math.random() * (max + 1));

	if (action === "attack") {
		// Player attacks enemy
		enemyDamage = player.attack + randomInt(5);

		// Enemy counterattacks
		const rawDamage = enemy.attack + randomInt(3) - player.defense;
		playerDamage = Math.max(1, rawDamage);

		message = `You attack for ${enemyDamage} damage! ${enemy.identifier} hits back for ${playerDamage}!`;
	} else if (action === "defend") {
		// No player attack - player heals and takes half damage
		const rawDamage = enemy.attack + randomInt(3) - player.defense;
		const fullDamage = Math.max(1, rawDamage);
		playerDamage = Math.max(0, Math.floor(fullDamage / 2));

		// Healing (no enemy damage)
		enemyDamage = 0;

		message = `You defend, healing 5 HP and blocking half damage! ${enemy.identifier} deals ${playerDamage}!`;
	} else {
		// Special
		if (player.specialUses > 0) {
			// Player deals 2.5x attack
			enemyDamage = Math.round(player.attack * 2.5);

			// Enemy counterattacks at half strength
			const rawDamage =
				Math.floor(enemy.attack / 2) + randomInt(3) - player.defense;
			playerDamage = Math.max(1, rawDamage);

			message = `SPECIAL ATTACK for ${enemyDamage} damage! ${enemy.identifier} hits back weakly for ${playerDamage}!`;
		} else {
			// No special uses left - treat as normal attack
			enemyDamage = player.attack + randomInt(5);
			const rawDamage = enemy.attack + randomInt(3) - player.defense;
			playerDamage = Math.max(1, rawDamage);

			message = `No special uses left! Normal attack for ${enemyDamage} damage! ${enemy.identifier} hits for ${playerDamage}!`;
		}
	}

	// Calculate new HP values to determine defeats
	const newPlayerHp = player.hp - playerDamage + (action === "defend" ? 5 : 0);
	const newEnemyHp = enemy.hp - enemyDamage;

	const enemyDefeated = newEnemyHp <= 0;
	const playerDefeated = newPlayerHp <= 0;

	return {
		playerDamage,
		enemyDamage,
		message,
		enemyDefeated,
		playerDefeated,
	};
}

export function isGameOver(player: PlayerStats): boolean {
	return player.hp <= 0;
}
