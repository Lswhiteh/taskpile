// OAuth
export const LINEAR_CLIENT_ID =
	import.meta.env.VITE_LINEAR_CLIENT_ID || "d5f3188f248dd5d35bb19e950aeaf716";
export const LINEAR_AUTH_URL = "https://linear.app/oauth/authorize";
export const WORKER_URL =
	import.meta.env.VITE_WORKER_URL ?? "https://api.taskpile.dev";
export const REDIRECT_URI = `${window.location.origin}/callback`;

// Card sizing
export const CARD_BASE_WIDTH = 140;
export const CARD_BASE_HEIGHT = 80;
export const CARD_MAX_ESTIMATE = 13;
export const CARD_SCALE_FACTOR = 1.2;

export function cardSize(estimate: number | null): {
	width: number;
	height: number;
} {
	const est = estimate ?? 0;
	const scale = 1 + Math.sqrt(est / CARD_MAX_ESTIMATE) * CARD_SCALE_FACTOR;
	return {
		width: Math.round(CARD_BASE_WIDTH * scale),
		height: Math.round(CARD_BASE_HEIGHT * scale),
	};
}

// Physics tuning
export const PHYSICS = {
	gravity: { x: 0, y: 1.2 },
	restitution: 0.35,
	friction: 0.6,
	frictionAir: 0.02,
	density: 0.002,
	mouse: {
		stiffness: 0.2,
		damping: 0.0,
	},
} as const;

// Priority colors
export const PRIORITY_COLORS: Record<number, string> = {
	0: "#6b7280", // None - gray
	1: "#ef4444", // Urgent - red
	2: "#f97316", // High - orange
	3: "#eab308", // Normal - yellow
	4: "#3b82f6", // Low - blue
};

// Game modes
export const SORT_TIMER_SECONDS = 90;
export const SORT_CORRECT_POINTS = 1;
export const SORT_WRONG_POINTS = -1;
export const SORT_MISS_POINTS = -1;
export const SORT_SPAWN_INTERVAL_MS = 3000;
export const SORT_GRAVITY = 0.3;
export const SORT_BIN_HEIGHT = 160;
export const SORT_DEADLINE_Y_OFFSET = 180; // from bottom
export const STACK_SPAWN_INTERVAL_MS = 3000;
export const CARD_DROP_STAGGER_MS = 80;

// ── JRPG Adventure ──

export const JRPG = {
	// Damage
	ELEMENT_WEAK_MULT: 1.75,
	ELEMENT_RESIST_MULT: 0.5,
	CRIT_MULT: 1.5,
	CRIT_CHANCE: 0.08,
	DAMAGE_VARIANCE_MIN: 0.9,
	DAMAGE_VARIANCE_RANGE: 0.2,

	// Limit Break
	LIMIT_GAUGE_MAX: 100,
	LIMIT_FILL_DAMAGE_TAKEN: 0.8,
	LIMIT_FILL_DAMAGE_DEALT: 0.2,

	// Status durations
	STATUS_DURATION_POISON: 3,
	STATUS_DURATION_BURN: 3,
	STATUS_DURATION_FREEZE: 1,
	STATUS_DURATION_BUFF: 3,
	POISON_TICK_PERCENT: 0.05,
	BURN_TICK_PERCENT: 0.08,
	DEF_DOWN_MULT: 0.3,
	ATK_UP_MULT: 0.3,

	// Animation timings (ms)
	DAMAGE_FLOAT_DURATION: 1200,
	FLASH_OVERLAY_DURATION: 300,
	SCREEN_SHAKE_DURATION: 400,
	FLASH_TEXT_DURATION: 1000,
	HP_BAR_LERP_SPEED: 0.08,

	// Element colors
	ELEMENT_COLORS: {
		fire: "#ef4444",
		ice: "#60a5fa",
		thunder: "#facc15",
		water: "#3b82f6",
		void: "#a78bfa",
	},

	// Status colors
	STATUS_COLORS: {
		poison: "#a855f7",
		burn: "#f97316",
		freeze: "#67e8f9",
		defDown: "#f87171",
		atkUp: "#4ade80",
	},
} as const;
