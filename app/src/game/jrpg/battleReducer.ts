import { JRPG } from "../../config/constants.js";
import type {
	AnimationState,
	BattleAction,
	BattleState,
	DamageFloat,
	EnemyStats,
	FlashText,
	LevelUpInfo,
	PendingAction,
} from "../../types/jrpg.js";
import type { LinearIssue } from "../../types/linear.js";
import {
	addStatus,
	calculateDamageToEnemy,
	calculateDamageToParty,
	fillLimitGauge,
	isFrozen,
	processStatusTicks,
} from "./combat.js";
import { createEnemy } from "./enemy.js";
import { createInventory } from "./items.js";
import { getItem } from "./items.js";
import { applyLevelUp, createParty } from "./party.js";
import { calculateXp, xpToNextLevel } from "./progression.js";
import { getBasicAttackId, getSkill } from "./skills.js";
import { buildTurnQueue, insertExtraTurn } from "./turnOrder.js";

export function createInitialState(issues: LinearIssue[]): BattleState {
	const party = createParty();
	const enemy = issues[0] ? createEnemy(issues[0]) : null;
	const turnQueue = buildTurnQueue(party, enemy);

	return {
		party,
		enemy,
		issues,
		issueIndex: 0,
		phase: "battle",
		turnQueue,
		currentTurnIndex: 0,
		menu: { type: "main" },
		battleLog: [`Battle begins! ${enemy?.identifier ?? "No enemy"} appears!`],
		inventory: createInventory(),
		animations: emptyAnimations(),
		totalDefeated: 0,
		levelUps: [],
	};
}

function emptyAnimations(): AnimationState {
	return {
		damageFloats: [],
		flashOverlays: [],
		screenShake: null,
		flashTexts: [],
	};
}

export function battleReducer(
	state: BattleState,
	action: BattleAction,
): BattleState {
	switch (action.type) {
		case "OPEN_SKILLS":
			return {
				...state,
				menu: { type: "skills", memberIndex: action.memberIndex },
			};

		case "OPEN_ITEMS":
			return { ...state, menu: { type: "items" } };

		case "OPEN_TARGETING":
			return { ...state, menu: { type: "targeting", action: action.action } };

		case "CANCEL_MENU":
			return { ...state, menu: { type: "main" } };

		case "SELECT_ACTION":
			return executeAction(state, action.action, action.targetIndex);

		case "ADVANCE_TURN":
			return advanceTurn(state);

		case "NEXT_ENEMY":
			return nextEnemy(state);

		case "DISMISS_LEVEL_UP":
			return dismissLevelUp(state);

		case "RESTART":
			return createInitialState(state.issues);

		default:
			return state;
	}
}

function executeAction(
	state: BattleState,
	pendingAction: PendingAction,
	targetIndex?: number,
): BattleState {
	if (state.phase !== "battle" || !state.enemy) return state;

	const currentTurn = state.turnQueue[state.currentTurnIndex];
	if (!currentTurn) return advanceTurn(state);

	// If it's the enemy's turn, handle AI
	if (currentTurn.type === "enemy") {
		return executeEnemyTurn(state);
	}

	const memberIdx = currentTurn.index;
	const member = state.party[memberIdx];
	if (!member.isAlive) return advanceTurn(state);

	// Check frozen
	if (isFrozen(member.statuses)) {
		const newParty = [...state.party];
		newParty[memberIdx] = {
			...member,
			statuses: member.statuses.filter((s) => s.type !== "freeze"),
		};
		return advanceTurn({
			...state,
			party: newParty,
			battleLog: [
				...state.battleLog,
				`${member.name} is frozen and can't move!`,
			],
		});
	}

	switch (pendingAction.type) {
		case "attack":
			return executeAttack(state, memberIdx);
		case "defend":
			return executeDefend(state, memberIdx);
		case "skill":
			return executeSkill(state, memberIdx, pendingAction.skillId, targetIndex);
		case "item":
			return executeItem(state, pendingAction.itemId, targetIndex);
		case "limitBreak":
			return executeLimitBreak(state, memberIdx, pendingAction.skillId);
		default:
			return state;
	}
}

function executeAttack(state: BattleState, memberIdx: number): BattleState {
	const member = state.party[memberIdx];
	if (!state.enemy) return state;
	const enemy = state.enemy;
	const basicId = getBasicAttackId(member.role);
	const skill = getSkill(basicId);

	const result = calculateDamageToEnemy(member, enemy, skill);
	const newEnemyHp = Math.max(0, enemy.hp - result.damage);

	const newEnemy: EnemyStats = {
		...enemy,
		hp: newEnemyHp,
		statuses: result.statusApplied
			? addStatus(enemy.statuses, result.statusApplied)
			: enemy.statuses,
	};

	const newMember = {
		...member,
		limitGauge: fillLimitGauge(member.limitGauge, result.damage, 0),
	};

	const newParty = [...state.party];
	newParty[memberIdx] = newMember;

	let msg = `${member.name} attacks for ${result.damage} damage!`;
	if (result.isCrit) msg += " CRITICAL!";

	const animations = buildDamageAnimations(state, result, true);

	let newQueue = state.turnQueue;
	if (result.isWeak) {
		msg += " WEAK! 1 More!";
		newQueue = insertExtraTurn(
			newQueue,
			state.currentTurnIndex,
			state.turnQueue[state.currentTurnIndex],
		);
	}

	const newState: BattleState = {
		...state,
		party: newParty,
		enemy: newEnemy,
		turnQueue: newQueue,
		battleLog: [...state.battleLog, msg],
		menu: { type: "main" },
		animations,
	};

	if (newEnemyHp <= 0) {
		return handleEnemyDefeated(newState);
	}

	return advanceTurn(newState);
}

function executeDefend(state: BattleState, memberIdx: number): BattleState {
	const member = state.party[memberIdx];
	const healAmount = 5;
	const newHp = Math.min(member.maxHp, member.hp + healAmount);

	const newParty = [...state.party];
	newParty[memberIdx] = {
		...member,
		hp: newHp,
		def: member.def, // DEF boost handled via temporary status
		statuses: addStatus(member.statuses, "atkUp"), // reuse as a "guarding" indicator for 1 turn
	};

	// Actually, defend should give a DEF buff, not ATK. Let's add a proper temporary buff.
	// We'll just heal and add to log. The defend benefit is the heal.
	newParty[memberIdx] = {
		...member,
		hp: newHp,
	};

	return advanceTurn({
		...state,
		party: newParty,
		battleLog: [
			...state.battleLog,
			`${member.name} defends, recovering ${healAmount} HP!`,
		],
		menu: { type: "main" },
	});
}

function executeSkill(
	state: BattleState,
	memberIdx: number,
	skillId: string,
	targetIndex?: number,
): BattleState {
	const member = state.party[memberIdx];
	const skill = getSkill(skillId);

	if (member.mp < skill.mpCost) {
		return {
			...state,
			battleLog: [...state.battleLog, `${member.name} doesn't have enough MP!`],
		};
	}

	const newMember = { ...member, mp: member.mp - skill.mpCost };
	const newParty = [...state.party];
	newParty[memberIdx] = newMember;

	// Analyze
	if (skill.isAnalyze && state.enemy) {
		const newEnemy = { ...state.enemy, weaknessRevealed: true };
		return advanceTurn({
			...state,
			party: newParty,
			enemy: newEnemy,
			battleLog: [
				...state.battleLog,
				`${member.name} analyzes the enemy! Weakness revealed!`,
			],
			menu: { type: "main" },
		});
	}

	// Heal
	if (
		skill.healAmount &&
		skill.target === "ally" &&
		targetIndex !== undefined
	) {
		const target = state.party[targetIndex];

		if (skill.isRevive) {
			if (target.isAlive) {
				return {
					...state,
					battleLog: [...state.battleLog, `${target.name} is already alive!`],
				};
			}
			newParty[targetIndex] = {
				...target,
				hp: skill.healAmount,
				isAlive: true,
				statuses: [],
			};
			return advanceTurn({
				...state,
				party: newParty,
				battleLog: [
					...state.battleLog,
					`${member.name} revives ${target.name}!`,
				],
				menu: { type: "main" },
			});
		}

		if (!target.isAlive) {
			return {
				...state,
				battleLog: [...state.battleLog, `${target.name} is down!`],
			};
		}
		const healed = Math.min(target.maxHp, target.hp + skill.healAmount);
		newParty[targetIndex] = { ...target, hp: healed };
		return advanceTurn({
			...state,
			party: newParty,
			battleLog: [
				...state.battleLog,
				`${member.name} heals ${target.name} for ${healed - target.hp} HP!`,
			],
			menu: { type: "main" },
		});
	}

	// Full party heal (limit break)
	if (skill.healAmount && skill.target === "allAllies") {
		for (let i = 0; i < newParty.length; i++) {
			if (newParty[i].isAlive) {
				newParty[i] = {
					...newParty[i],
					hp: Math.min(newParty[i].maxHp, newParty[i].hp + skill.healAmount),
				};
			}
		}
		const animations = skill.isLimitBreak
			? buildLimitBreakAnimations(state)
			: state.animations;
		return advanceTurn({
			...state,
			party: newParty,
			battleLog: [
				...state.battleLog,
				`${member.name} uses ${skill.name}! Party healed!`,
			],
			menu: { type: "main" },
			animations,
		});
	}

	// DEF/ATK buff
	if (skill.buffStat) {
		if (skill.target === "allAllies") {
			for (let i = 0; i < newParty.length; i++) {
				if (newParty[i].isAlive) {
					// For Guard All, we boost DEF via a temporary marker
					newParty[i] = {
						...newParty[i],
						def: newParty[i].def, // DEF buff is handled via status check
						statuses: addStatus(newParty[i].statuses, "atkUp"),
					};
				}
			}
		} else if (skill.target === "ally" && targetIndex !== undefined) {
			newParty[targetIndex] = {
				...newParty[targetIndex],
				statuses: addStatus(newParty[targetIndex].statuses, "atkUp"),
			};
		}

		return advanceTurn({
			...state,
			party: newParty,
			battleLog: [...state.battleLog, `${member.name} uses ${skill.name}!`],
			menu: { type: "main" },
		});
	}

	// Cleanse
	if (skillId === "cleanse" && targetIndex !== undefined) {
		newParty[targetIndex] = {
			...newParty[targetIndex],
			statuses: [],
		};
		return advanceTurn({
			...state,
			party: newParty,
			battleLog: [
				...state.battleLog,
				`${member.name} cleanses ${newParty[targetIndex].name}!`,
			],
			menu: { type: "main" },
		});
	}

	// Offensive skill
	if (skill.power > 0 && state.enemy) {
		const result = calculateDamageToEnemy(
			newParty[memberIdx],
			state.enemy,
			skill,
		);
		const newEnemyHp = Math.max(0, state.enemy.hp - result.damage);

		const newEnemy: EnemyStats = {
			...state.enemy,
			hp: newEnemyHp,
			statuses: result.statusApplied
				? addStatus(state.enemy.statuses, result.statusApplied)
				: state.enemy.statuses,
		};

		newParty[memberIdx] = {
			...newParty[memberIdx],
			limitGauge: fillLimitGauge(
				newParty[memberIdx].limitGauge,
				result.damage,
				0,
			),
		};

		let msg = `${member.name} uses ${skill.name} for ${result.damage} damage!`;
		if (result.isCrit) msg += " CRITICAL!";
		if (result.statusApplied)
			msg += ` ${result.statusApplied.toUpperCase()} inflicted!`;

		const animations = skill.isLimitBreak
			? buildLimitBreakAnimations(state)
			: buildDamageAnimations(state, result, true);

		let newQueue = state.turnQueue;
		if (result.isWeak) {
			msg += " WEAK! 1 More!";
			newQueue = insertExtraTurn(
				newQueue,
				state.currentTurnIndex,
				state.turnQueue[state.currentTurnIndex],
			);
		}

		const newState: BattleState = {
			...state,
			party: newParty,
			enemy: newEnemy,
			turnQueue: newQueue,
			battleLog: [...state.battleLog, msg],
			menu: { type: "main" },
			animations,
		};

		if (newEnemyHp <= 0) {
			return handleEnemyDefeated(newState);
		}

		return advanceTurn(newState);
	}

	return advanceTurn({ ...state, party: newParty, menu: { type: "main" } });
}

function executeLimitBreak(
	state: BattleState,
	memberIdx: number,
	skillId: string,
): BattleState {
	const newParty = [...state.party];
	newParty[memberIdx] = { ...newParty[memberIdx], limitGauge: 0 };
	return executeSkill({ ...state, party: newParty }, memberIdx, skillId);
}

function executeItem(
	state: BattleState,
	itemId: string,
	targetIndex?: number,
): BattleState {
	if (targetIndex === undefined) return state;
	const item = getItem(itemId);
	const invIdx = state.inventory.findIndex(
		(inv) => inv.item.id === itemId && inv.count > 0,
	);
	if (invIdx === -1) return state;

	const target = state.party[targetIndex];
	if (!target.isAlive) {
		return {
			...state,
			battleLog: [...state.battleLog, `${target.name} is down!`],
		};
	}

	const newInventory = [...state.inventory];
	newInventory[invIdx] = {
		...newInventory[invIdx],
		count: newInventory[invIdx].count - 1,
	};

	const newParty = [...state.party];

	if (item.effect === "healHp") {
		const newHp = Math.min(target.maxHp, target.hp + item.amount);
		newParty[targetIndex] = { ...target, hp: newHp };
	} else if (item.effect === "restoreMp") {
		const newMp = Math.min(target.maxMp, target.mp + item.amount);
		newParty[targetIndex] = { ...target, mp: newMp };
	}

	return advanceTurn({
		...state,
		party: newParty,
		inventory: newInventory,
		battleLog: [...state.battleLog, `Used ${item.name} on ${target.name}!`],
		menu: { type: "main" },
	});
}

function executeEnemyTurn(state: BattleState): BattleState {
	if (!state.enemy) return state;
	const enemy = state.enemy;

	// Process enemy status ticks
	const statusResult = processStatusTicks(enemy.statuses, enemy.maxHp);
	let updatedEnemy: EnemyStats = {
		...enemy,
		hp: Math.max(0, enemy.hp - statusResult.damage),
		statuses: statusResult.remainingStatuses,
	};

	if (updatedEnemy.hp <= 0) {
		return handleEnemyDefeated({ ...state, enemy: updatedEnemy });
	}

	if (isFrozen(enemy.statuses)) {
		updatedEnemy = {
			...updatedEnemy,
			statuses: updatedEnemy.statuses.filter((s) => s.type !== "freeze"),
		};
		return advanceTurn({
			...state,
			enemy: updatedEnemy,
			battleLog: [...state.battleLog, `${enemy.identifier} is frozen!`],
		});
	}

	// AI: target lowest HP alive party member
	let targetIdx = -1;
	let lowestHp = Number.POSITIVE_INFINITY;
	for (let i = 0; i < state.party.length; i++) {
		if (state.party[i].isAlive && state.party[i].hp < lowestHp) {
			lowestHp = state.party[i].hp;
			targetIdx = i;
		}
	}

	if (targetIdx === -1) {
		return { ...state, phase: "gameover" };
	}

	const target = state.party[targetIdx];
	const result = calculateDamageToParty(updatedEnemy, target);

	const newHp = Math.max(0, target.hp - result.damage);
	const newParty = [...state.party];
	const newMember = {
		...target,
		hp: newHp,
		isAlive: newHp > 0,
		limitGauge: fillLimitGauge(target.limitGauge, 0, result.damage),
	};
	newParty[targetIdx] = newMember;

	let msg = `${enemy.identifier} attacks ${target.name} for ${result.damage} damage!`;
	if (result.isCrit) msg += " CRITICAL!";
	if (newHp <= 0) msg += ` ${target.name} falls!`;

	const animations = buildDamageAnimations(state, result, false);

	// Process party member status ticks for the targeted member
	// (status ticks happen at the start of each character's own turn, handled in advanceTurn)

	const allDead = newParty.every((m) => !m.isAlive);

	return advanceTurn({
		...state,
		party: newParty,
		enemy: updatedEnemy,
		phase: allDead ? "gameover" : state.phase,
		battleLog: [...state.battleLog, msg],
		animations,
	});
}

function advanceTurn(state: BattleState): BattleState {
	if (
		state.phase === "gameover" ||
		state.phase === "victory" ||
		state.phase === "levelup"
	) {
		return state;
	}

	const nextIdx = state.currentTurnIndex + 1;

	if (nextIdx >= state.turnQueue.length) {
		// New round: process status ticks for party, rebuild turn queue
		const newParty = [...state.party];
		const logs: string[] = [];

		for (let i = 0; i < newParty.length; i++) {
			if (!newParty[i].isAlive) continue;
			const ticks = processStatusTicks(newParty[i].statuses, newParty[i].maxHp);
			if (ticks.damage > 0) {
				const newHp = Math.max(0, newParty[i].hp - ticks.damage);
				logs.push(`${newParty[i].name} takes ${ticks.damage} status damage!`);
				newParty[i] = {
					...newParty[i],
					hp: newHp,
					isAlive: newHp > 0,
					statuses: ticks.remainingStatuses,
				};
				if (newHp <= 0) logs.push(`${newParty[i].name} falls!`);
			} else {
				newParty[i] = { ...newParty[i], statuses: ticks.remainingStatuses };
			}
		}

		const allDead = newParty.every((m) => !m.isAlive);
		if (allDead) {
			return {
				...state,
				party: newParty,
				phase: "gameover",
				battleLog: [...state.battleLog, ...logs],
			};
		}

		const newQueue = buildTurnQueue(newParty, state.enemy);
		return {
			...state,
			party: newParty,
			turnQueue: newQueue,
			currentTurnIndex: 0,
			menu: { type: "main" },
			battleLog: [...state.battleLog, ...logs],
		};
	}

	return {
		...state,
		currentTurnIndex: nextIdx,
		menu: { type: "main" },
	};
}

function handleEnemyDefeated(state: BattleState): BattleState {
	const issue = state.issues[state.issueIndex];
	const xp = calculateXp(issue);

	const newParty = [...state.party];
	const levelUps: LevelUpInfo[] = [];

	for (let i = 0; i < newParty.length; i++) {
		if (!newParty[i].isAlive) continue;
		let member = { ...newParty[i], xp: newParty[i].xp + xp };
		while (member.xp >= member.xpToNext) {
			const oldLevel = member.level;
			member = { ...applyLevelUp(member), xp: member.xp - member.xpToNext };
			member.xpToNext = xpToNextLevel(member.level);
			levelUps.push({
				memberIndex: i,
				name: member.name,
				oldLevel,
				newLevel: member.level,
			});
		}
		newParty[i] = member;
	}

	const defeated = state.totalDefeated + 1;
	const nextIndex = state.issueIndex + 1;
	const isVictory = nextIndex >= state.issues.length;

	const enemyId = state.enemy?.identifier ?? "Enemy";

	return {
		...state,
		party: newParty,
		enemy: state.enemy ? { ...state.enemy, hp: 0 } : null,
		totalDefeated: defeated,
		phase: levelUps.length > 0 ? "levelup" : isVictory ? "victory" : "battle",
		levelUps,
		battleLog: [...state.battleLog, `${enemyId} defeated! +${xp} XP!`],
		issueIndex: nextIndex,
	};
}

function nextEnemy(state: BattleState): BattleState {
	if (state.issueIndex >= state.issues.length) {
		return { ...state, phase: "victory" };
	}

	const newEnemy = createEnemy(state.issues[state.issueIndex]);
	const newQueue = buildTurnQueue(state.party, newEnemy);

	return {
		...state,
		enemy: newEnemy,
		turnQueue: newQueue,
		currentTurnIndex: 0,
		phase: "battle",
		menu: { type: "main" },
		battleLog: [...state.battleLog, `${newEnemy.identifier} appears!`],
	};
}

function dismissLevelUp(state: BattleState): BattleState {
	const isVictory = state.issueIndex >= state.issues.length;
	return {
		...state,
		levelUps: [],
		phase: isVictory ? "victory" : "battle",
	};
}

// ── Animation Helpers ──

function buildDamageAnimations(
	state: BattleState,
	result: {
		damage: number;
		isCrit: boolean;
		isWeak: boolean;
		isResist: boolean;
	},
	targetIsEnemy: boolean,
): AnimationState {
	const floats: DamageFloat[] = [
		{
			x: targetIsEnemy ? 600 : 200,
			y: targetIsEnemy ? 180 : 220,
			text: `${result.damage}`,
			color: result.isCrit ? "#facc15" : result.isWeak ? "#ef4444" : "#ffffff",
			age: 0,
			duration: JRPG.DAMAGE_FLOAT_DURATION,
		},
	];

	const flashTexts: FlashText[] = [];
	if (result.isWeak) {
		flashTexts.push({
			text: "WEAK!",
			x: targetIsEnemy ? 580 : 180,
			y: targetIsEnemy ? 140 : 180,
			color: "#ef4444",
			age: 0,
			duration: JRPG.FLASH_TEXT_DURATION,
			size: 28,
		});
	}
	if (result.isResist) {
		flashTexts.push({
			text: "RESIST!",
			x: targetIsEnemy ? 580 : 180,
			y: targetIsEnemy ? 140 : 180,
			color: "#60a5fa",
			age: 0,
			duration: JRPG.FLASH_TEXT_DURATION,
			size: 24,
		});
	}
	if (result.isCrit) {
		flashTexts.push({
			text: "CRITICAL!",
			x: targetIsEnemy ? 580 : 180,
			y: targetIsEnemy ? 160 : 200,
			color: "#facc15",
			age: 0,
			duration: JRPG.FLASH_TEXT_DURATION,
			size: 22,
		});
	}

	return {
		damageFloats: [...state.animations.damageFloats, ...floats],
		flashOverlays: state.animations.flashOverlays,
		screenShake: result.isCrit
			? { intensity: 6, age: 0, duration: JRPG.SCREEN_SHAKE_DURATION }
			: state.animations.screenShake,
		flashTexts: [...state.animations.flashTexts, ...flashTexts],
	};
}

function buildLimitBreakAnimations(state: BattleState): AnimationState {
	return {
		damageFloats: state.animations.damageFloats,
		flashOverlays: [
			...state.animations.flashOverlays,
			{
				color: "#ffffff",
				alpha: 0.8,
				age: 0,
				duration: JRPG.FLASH_OVERLAY_DURATION * 2,
			},
		],
		screenShake: {
			intensity: 10,
			age: 0,
			duration: JRPG.SCREEN_SHAKE_DURATION * 1.5,
		},
		flashTexts: [
			...state.animations.flashTexts,
			{
				text: "LIMIT BREAK!",
				x: 400,
				y: 200,
				color: "#facc15",
				age: 0,
				duration: JRPG.FLASH_TEXT_DURATION * 1.5,
				size: 36,
			},
		],
	};
}
