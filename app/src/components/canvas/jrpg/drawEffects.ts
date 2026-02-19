import type { AnimationState } from "../../../types/jrpg.js";

/** Draw all active animation effects. Call this last (on top of everything). */
export function drawEffects(
	ctx: CanvasRenderingContext2D,
	animations: AnimationState,
	width: number,
	height: number,
): void {
	// Damage floats (rise + fade)
	for (const float of animations.damageFloats) {
		const progress = float.age / float.duration;
		const alpha = 1 - progress;
		const yOffset = progress * 40;

		ctx.globalAlpha = Math.max(0, alpha);
		ctx.fillStyle = float.color;
		ctx.font = "bold 20px monospace";
		ctx.textAlign = "center";
		ctx.fillText(float.text, float.x, float.y - yOffset);
	}

	// Flash texts ("WEAK!", "RESIST!", "CRITICAL!", "LIMIT BREAK!")
	for (const ft of animations.flashTexts) {
		const progress = ft.age / ft.duration;
		const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
		const scale = 1 + Math.sin(progress * Math.PI) * 0.2;

		ctx.globalAlpha = Math.max(0, alpha);
		ctx.fillStyle = ft.color;
		ctx.font = `bold ${Math.round(ft.size * scale)}px monospace`;
		ctx.textAlign = "center";

		// Text shadow for readability
		ctx.shadowColor = "#000";
		ctx.shadowBlur = 6;
		ctx.fillText(ft.text, ft.x, ft.y);
		ctx.shadowBlur = 0;
	}

	// Flash overlays (full-screen flash)
	for (const flash of animations.flashOverlays) {
		const progress = flash.age / flash.duration;
		const alpha = flash.alpha * (1 - progress);
		ctx.globalAlpha = Math.max(0, alpha);
		ctx.fillStyle = flash.color;
		ctx.fillRect(0, 0, width, height);
	}

	ctx.globalAlpha = 1;
	ctx.textAlign = "left";
}
