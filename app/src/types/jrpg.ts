import type { LinearIssue } from "./linear.js";

// ── Elements ──

export type Element = "fire" | "ice" | "thunder" | "water" | "void";

export type ElementMatchup = "weak" | "resist" | "neutral";

// ── Status Effects ──

export type StatusType = "poison" | "burn" | "freeze" | "defDown" | "atkUp";

export interface StatusEffect {
	type: StatusType;
	turnsRemaining: number;
}

// ── Skills ──

export interface Skill {
	id: string;
	name: string;
	mpCost: number;
	power: number; // multiplier (0 = no damage, e.g. heal/buff)
	element: Element | null;
	target: "enemy" | "ally" | "allAllies" | "self";
	effect?: {
		type: StatusType;
		chance: number; // 0-1
	};
	healAmount?: number; // flat heal (Cleric's Heal)
	buffStat?: "def" | "atk";
	buffAmount?: number; // multiplier (e.g. 0.3 = +30%)
	isRevive?: boolean;
	isAnalyze?: boolean;
	isLimitBreak?: boolean;
	description: string;
}

// ── Party Members ──

export type PartyRole = "warrior" | "mage" | "healer";

export interface PartyMemberTemplate {
	name: string;
	role: PartyRole;
	element: Element;
	baseHp: number;
	baseMp: number;
	baseAtk: number;
	baseDef: number;
	baseSpd: number;
	skills: string[]; // skill IDs
	limitSkill: string; // skill ID
}

export interface PartyMember {
	name: string;
	role: PartyRole;
	element: Element;
	level: number;
	xp: number;
	xpToNext: number;
	hp: number;
	maxHp: number;
	mp: number;
	maxMp: number;
	atk: number;
	def: number;
	spd: number;
	skills: string[];
	limitSkill: string;
	limitGauge: number; // 0-100
	statuses: StatusEffect[];
	isAlive: boolean;
}

// ── Enemy ──

export interface EnemyStats {
	hp: number;
	maxHp: number;
	atk: number;
	def: number;
	spd: number;
	name: string;
	identifier: string;
	priority: number;
	element: Element;
	weakness: Element | null;
	resistance: Element | null;
	weaknessRevealed: boolean;
	statuses: StatusEffect[];
}

// ── Items ──

export interface Item {
	id: string;
	name: string;
	description: string;
	effect: "healHp" | "restoreMp";
	amount: number;
}

export interface InventoryItem {
	item: Item;
	count: number;
}

// ── Turn Order ──

export interface TurnEntry {
	type: "party" | "enemy";
	index: number; // party member index or 0 for enemy
	name: string;
	isExtra?: boolean; // "1 More!" bonus turn
}

// ── Battle State ──

export type BattlePhase =
	| "battle"
	| "animating"
	| "victory"
	| "gameover"
	| "levelup";

export type MenuState =
	| { type: "main" }
	| { type: "skills"; memberIndex: number }
	| { type: "items" }
	| { type: "targeting"; action: PendingAction };

export type PendingAction =
	| { type: "attack" }
	| { type: "defend" }
	| { type: "skill"; skillId: string }
	| { type: "item"; itemId: string }
	| { type: "limitBreak"; skillId: string };

// ── Animation Events ──

export interface DamageFloat {
	x: number;
	y: number;
	text: string;
	color: string;
	age: number; // ms elapsed
	duration: number;
}

export interface FlashOverlay {
	color: string;
	alpha: number;
	age: number;
	duration: number;
}

export interface ScreenShake {
	intensity: number;
	age: number;
	duration: number;
}

export interface FlashText {
	text: string;
	x: number;
	y: number;
	color: string;
	age: number;
	duration: number;
	size: number;
}

export interface AnimationState {
	damageFloats: DamageFloat[];
	flashOverlays: FlashOverlay[];
	screenShake: ScreenShake | null;
	flashTexts: FlashText[];
}

// ── Battle Reducer State ──

export interface BattleState {
	party: PartyMember[];
	enemy: EnemyStats | null;
	issues: LinearIssue[];
	issueIndex: number;
	phase: BattlePhase;
	turnQueue: TurnEntry[];
	currentTurnIndex: number;
	menu: MenuState;
	battleLog: string[];
	inventory: InventoryItem[];
	animations: AnimationState;
	totalDefeated: number;
	levelUps: LevelUpInfo[];
}

export interface LevelUpInfo {
	memberIndex: number;
	name: string;
	oldLevel: number;
	newLevel: number;
}

// ── Battle Actions (Reducer) ──

export type BattleAction =
	| { type: "SELECT_ACTION"; action: PendingAction; targetIndex?: number }
	| { type: "OPEN_SKILLS"; memberIndex: number }
	| { type: "OPEN_ITEMS" }
	| { type: "OPEN_TARGETING"; action: PendingAction }
	| { type: "CANCEL_MENU" }
	| { type: "EXECUTE_TURN" }
	| { type: "ANIMATION_DONE" }
	| { type: "ADVANCE_TURN" }
	| { type: "NEXT_ENEMY" }
	| { type: "DISMISS_LEVEL_UP" }
	| { type: "RESTART" };
