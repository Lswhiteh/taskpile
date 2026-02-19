import type { PartyMember, PartyMemberTemplate } from "../../types/jrpg.js";
import { xpToNextLevel } from "./progression.js";

const PARTY_TEMPLATES: PartyMemberTemplate[] = [
	{
		name: "Blade",
		role: "warrior",
		element: "fire",
		baseHp: 120,
		baseMp: 30,
		baseAtk: 18,
		baseDef: 8,
		baseSpd: 10,
		skills: ["slash", "powerStrike", "guardAll"],
		limitSkill: "bladeFury",
	},
	{
		name: "Arcanist",
		role: "mage",
		element: "ice",
		baseHp: 70,
		baseMp: 80,
		baseAtk: 12,
		baseDef: 4,
		baseSpd: 12,
		skills: ["arcaneBlast", "fireball", "iceShards", "thunderbolt", "analyze"],
		limitSkill: "megaFlare",
	},
	{
		name: "Cleric",
		role: "healer",
		element: "thunder",
		baseHp: 85,
		baseMp: 60,
		baseAtk: 10,
		baseDef: 6,
		baseSpd: 14,
		skills: ["smite", "heal", "barrier", "cleanse", "revive"],
		limitSkill: "divineLight",
	},
];

/** Create fresh party members at level 1 with full HP/MP. */
export function createParty(): PartyMember[] {
	return PARTY_TEMPLATES.map((t) => ({
		name: t.name,
		role: t.role,
		element: t.element,
		level: 1,
		xp: 0,
		xpToNext: xpToNextLevel(1),
		hp: t.baseHp,
		maxHp: t.baseHp,
		mp: t.baseMp,
		maxMp: t.baseMp,
		atk: t.baseAtk,
		def: t.baseDef,
		spd: t.baseSpd,
		skills: t.skills,
		limitSkill: t.limitSkill,
		limitGauge: 0,
		statuses: [],
		isAlive: true,
	}));
}

/** Apply a single level-up to a party member. Returns the updated member. */
export function applyLevelUp(member: PartyMember): PartyMember {
	const newLevel = member.level + 1;
	const maxHp = member.maxHp + 10;
	const maxMp = member.maxMp + 5;
	return {
		...member,
		level: newLevel,
		maxHp,
		maxMp,
		hp: maxHp, // full restore on level up
		mp: maxMp,
		atk: member.atk + 2,
		def: member.def + 1,
		spd: member.spd + 1,
		xpToNext: xpToNextLevel(newLevel),
	};
}
