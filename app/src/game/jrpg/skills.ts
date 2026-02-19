import type { Skill } from "../../types/jrpg.js";

/** All skill definitions indexed by ID. */
export const SKILLS: Record<string, Skill> = {
	// ── Blade (Warrior) ──
	slash: {
		id: "slash",
		name: "Slash",
		mpCost: 0,
		power: 1.0,
		element: null,
		target: "enemy",
		description: "A basic sword strike.",
	},
	powerStrike: {
		id: "powerStrike",
		name: "Power Strike",
		mpCost: 8,
		power: 1.8,
		element: "fire",
		target: "enemy",
		effect: { type: "burn", chance: 0.25 },
		description: "A fiery heavy blow. May inflict Burn.",
	},
	guardAll: {
		id: "guardAll",
		name: "Guard All",
		mpCost: 12,
		power: 0,
		element: null,
		target: "allAllies",
		buffStat: "def",
		buffAmount: 0.3,
		description: "Raises DEF for all allies for 3 turns.",
	},

	// ── Arcanist (Mage) ──
	arcaneBlast: {
		id: "arcaneBlast",
		name: "Arcane Blast",
		mpCost: 0,
		power: 0.9,
		element: null,
		target: "enemy",
		description: "A weak magic projectile.",
	},
	fireball: {
		id: "fireball",
		name: "Fireball",
		mpCost: 6,
		power: 1.6,
		element: "fire",
		target: "enemy",
		effect: { type: "burn", chance: 0.2 },
		description: "Fire magic. May inflict Burn.",
	},
	iceShards: {
		id: "iceShards",
		name: "Ice Shards",
		mpCost: 6,
		power: 1.6,
		element: "ice",
		target: "enemy",
		effect: { type: "freeze", chance: 0.15 },
		description: "Ice magic. May inflict Freeze.",
	},
	thunderbolt: {
		id: "thunderbolt",
		name: "Thunderbolt",
		mpCost: 6,
		power: 1.6,
		element: "thunder",
		target: "enemy",
		description: "Thunder magic.",
	},
	analyze: {
		id: "analyze",
		name: "Analyze",
		mpCost: 3,
		power: 0,
		element: null,
		target: "enemy",
		isAnalyze: true,
		description: "Reveal the enemy's elemental weakness.",
	},

	// ── Cleric (Healer) ──
	smite: {
		id: "smite",
		name: "Smite",
		mpCost: 0,
		power: 0.8,
		element: null,
		target: "enemy",
		description: "A light-infused strike.",
	},
	heal: {
		id: "heal",
		name: "Heal",
		mpCost: 8,
		power: 0,
		element: null,
		target: "ally",
		healAmount: 35,
		description: "Restore 35 HP to one ally.",
	},
	barrier: {
		id: "barrier",
		name: "Barrier",
		mpCost: 10,
		power: 0,
		element: null,
		target: "ally",
		buffStat: "def",
		buffAmount: 0.3,
		description: "Raise one ally's DEF for 3 turns.",
	},
	cleanse: {
		id: "cleanse",
		name: "Cleanse",
		mpCost: 5,
		power: 0,
		element: null,
		target: "ally",
		description: "Remove all status ailments from one ally.",
	},
	revive: {
		id: "revive",
		name: "Revive",
		mpCost: 20,
		power: 0,
		element: null,
		target: "ally",
		isRevive: true,
		healAmount: 30,
		description: "Revive a fallen ally with 30 HP.",
	},

	// ── Limit Breaks ──
	bladeFury: {
		id: "bladeFury",
		name: "Blade Fury",
		mpCost: 0,
		power: 3.5,
		element: "fire",
		target: "enemy",
		isLimitBreak: true,
		description: "Devastating multi-slash inferno.",
	},
	megaFlare: {
		id: "megaFlare",
		name: "Mega Flare",
		mpCost: 0,
		power: 4.0,
		element: "void",
		target: "enemy",
		isLimitBreak: true,
		description: "Overwhelming arcane explosion.",
	},
	divineLight: {
		id: "divineLight",
		name: "Divine Light",
		mpCost: 0,
		power: 0,
		element: null,
		target: "allAllies",
		isLimitBreak: true,
		healAmount: 999, // full heal (clamped to maxHp)
		description: "Fully restore all allies' HP.",
	},
};

export function getSkill(id: string): Skill {
	const skill = SKILLS[id];
	if (!skill) throw new Error(`Unknown skill: ${id}`);
	return skill;
}

/** Get the basic attack skill for a party member role. */
export function getBasicAttackId(role: string): string {
	switch (role) {
		case "warrior":
			return "slash";
		case "mage":
			return "arcaneBlast";
		case "healer":
			return "smite";
		default:
			return "slash";
	}
}
