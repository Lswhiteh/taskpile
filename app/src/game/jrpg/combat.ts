import { JRPG } from "../../config/constants.js";
import type {
	Element,
	EnemyStats,
	PartyMember,
	Skill,
	StatusEffect,
	StatusType,
} from "../../types/jrpg.js";
import { checkElementMatchup } from "./elements.js";

export interface DamageResult {
	damage: number;
	isCrit: boolean;
	isWeak: boolean;
	isResist: boolean;
	statusApplied: StatusType | null;
}

/** Calculate damage from a party member using a skill against an enemy. */
export function calculateDamageToEnemy(
	attacker: PartyMember,
	enemy: EnemyStats,
	skill: Skill,
): DamageResult {
	const atk = getEffectiveAtk(attacker);
	return calculateDamage(
		atk,
		skill.power,
		enemy.def,
		skill.element,
		enemy.element,
		skill.effect,
	);
}

/** Calculate damage from enemy attacking a party member. */
export function calculateDamageToParty(
	enemy: EnemyStats,
	target: PartyMember,
): DamageResult {
	return calculateDamage(
		enemy.atk,
		1.0,
		getEffectiveDef(target),
		null,
		target.element,
		undefined,
	);
}

function calculateDamage(
	atk: number,
	skillPower: number,
	def: number,
	attackElement: Element | null,
	defenderElement: Element,
	effect?: { type: StatusType; chance: number },
): DamageResult {
	const base = Math.max(1, atk * skillPower - def / 2);
	const variance =
		JRPG.DAMAGE_VARIANCE_MIN + Math.random() * JRPG.DAMAGE_VARIANCE_RANGE;

	const matchup = checkElementMatchup(attackElement, defenderElement);
	const isWeak = matchup === "weak";
	const isResist = matchup === "resist";
	const elementMult = isWeak
		? JRPG.ELEMENT_WEAK_MULT
		: isResist
			? JRPG.ELEMENT_RESIST_MULT
			: 1.0;

	const isCrit = Math.random() < JRPG.CRIT_CHANCE;
	const critMult = isCrit ? JRPG.CRIT_MULT : 1.0;

	const damage = Math.round(base * variance * elementMult * critMult);

	let statusApplied: StatusType | null = null;
	if (effect && Math.random() < effect.chance) {
		statusApplied = effect.type;
	}

	return { damage, isCrit, isWeak, isResist, statusApplied };
}

/** Get effective ATK accounting for atkUp status. */
function getEffectiveAtk(member: PartyMember): number {
	const hasAtkUp = member.statuses.some((s) => s.type === "atkUp");
	return hasAtkUp
		? Math.round(member.atk * (1 + JRPG.ATK_UP_MULT))
		: member.atk;
}

/** Get effective DEF accounting for defDown status. */
function getEffectiveDef(member: PartyMember): number {
	const hasDefDown = member.statuses.some((s) => s.type === "defDown");
	return hasDefDown
		? Math.round(member.def * (1 - JRPG.DEF_DOWN_MULT))
		: member.def;
}

/** Process status effect ticks at start of turn. Returns damage taken and updated statuses. */
export function processStatusTicks(
	statuses: StatusEffect[],
	maxHp: number,
): {
	damage: number;
	expiredStatuses: StatusType[];
	remainingStatuses: StatusEffect[];
} {
	let damage = 0;
	const expiredStatuses: StatusType[] = [];
	const remainingStatuses: StatusEffect[] = [];

	for (const status of statuses) {
		if (status.type === "poison") {
			damage += Math.round(maxHp * JRPG.POISON_TICK_PERCENT);
		} else if (status.type === "burn") {
			damage += Math.round(maxHp * JRPG.BURN_TICK_PERCENT);
		}

		const newTurns = status.turnsRemaining - 1;
		if (newTurns <= 0) {
			expiredStatuses.push(status.type);
		} else {
			remainingStatuses.push({ ...status, turnsRemaining: newTurns });
		}
	}

	return { damage, expiredStatuses, remainingStatuses };
}

/** Check if a character is frozen (skip turn). */
export function isFrozen(statuses: StatusEffect[]): boolean {
	return statuses.some((s) => s.type === "freeze");
}

/** Add a status effect, refreshing duration if already present. */
export function addStatus(
	statuses: StatusEffect[],
	type: StatusType,
): StatusEffect[] {
	const duration = getStatusDuration(type);
	const existing = statuses.filter((s) => s.type !== type);
	return [...existing, { type, turnsRemaining: duration }];
}

function getStatusDuration(type: StatusType): number {
	switch (type) {
		case "poison":
			return JRPG.STATUS_DURATION_POISON;
		case "burn":
			return JRPG.STATUS_DURATION_BURN;
		case "freeze":
			return JRPG.STATUS_DURATION_FREEZE;
		case "defDown":
			return JRPG.STATUS_DURATION_BUFF;
		case "atkUp":
			return JRPG.STATUS_DURATION_BUFF;
	}
}

/** Fill limit gauge from damage. Returns new gauge value (capped at 100). */
export function fillLimitGauge(
	current: number,
	damageDealt: number,
	damageTaken: number,
): number {
	const fill =
		damageTaken * JRPG.LIMIT_FILL_DAMAGE_TAKEN +
		damageDealt * JRPG.LIMIT_FILL_DAMAGE_DEALT;
	return Math.min(JRPG.LIMIT_GAUGE_MAX, current + fill);
}
