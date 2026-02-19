import type { AnimationState } from "../../../types/jrpg.js";

/** Update all animation timers. Returns the new state with expired animations removed. */
export function updateAnimations(
	state: AnimationState,
	dt: number,
): AnimationState {
	return {
		damageFloats: state.damageFloats
			.map((f) => ({ ...f, age: f.age + dt }))
			.filter((f) => f.age < f.duration),

		flashOverlays: state.flashOverlays
			.map((f) => ({ ...f, age: f.age + dt }))
			.filter((f) => f.age < f.duration),

		screenShake:
			state.screenShake &&
			state.screenShake.age + dt < state.screenShake.duration
				? { ...state.screenShake, age: state.screenShake.age + dt }
				: null,

		flashTexts: state.flashTexts
			.map((f) => ({ ...f, age: f.age + dt }))
			.filter((f) => f.age < f.duration),
	};
}

/** Returns true if any animation is still active. */
export function hasActiveAnimations(state: AnimationState): boolean {
	return (
		state.damageFloats.length > 0 ||
		state.flashOverlays.length > 0 ||
		state.screenShake !== null ||
		state.flashTexts.length > 0
	);
}

/** Get screen shake offset for the current frame. */
export function getShakeOffset(state: AnimationState): {
	x: number;
	y: number;
} {
	if (!state.screenShake) return { x: 0, y: 0 };
	const progress = state.screenShake.age / state.screenShake.duration;
	const decay = 1 - progress;
	const intensity = state.screenShake.intensity * decay;
	return {
		x: (Math.random() - 0.5) * intensity * 2,
		y: (Math.random() - 0.5) * intensity * 2,
	};
}
