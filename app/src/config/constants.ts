// OAuth
export const LINEAR_CLIENT_ID = import.meta.env.VITE_LINEAR_CLIENT_ID ?? "";
export const LINEAR_AUTH_URL = "https://linear.app/oauth/authorize";
export const WORKER_URL =
	import.meta.env.VITE_WORKER_URL ?? "http://localhost:8787";
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
