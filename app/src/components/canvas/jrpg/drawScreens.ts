import type { BattleState, LevelUpInfo } from "../../../types/jrpg.js";

/** Draw the victory screen with XP summary. */
export function drawVictoryScreen(
	ctx: CanvasRenderingContext2D,
	state: BattleState,
	width: number,
	height: number,
): void {
	// Green radial gradient background
	const grad = ctx.createRadialGradient(
		width / 2,
		height / 2,
		0,
		width / 2,
		height / 2,
		Math.max(width, height) / 2,
	);
	grad.addColorStop(0, "#064e3b");
	grad.addColorStop(1, "#0d0d1a");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, width, height);

	// Title
	ctx.fillStyle = "#4ade80";
	ctx.font = "bold 42px monospace";
	ctx.textAlign = "center";
	ctx.fillText("VICTORY!", width / 2, height * 0.25);

	// Stats
	ctx.fillStyle = "#e2e8f0";
	ctx.font = "16px monospace";
	ctx.fillText(
		`Enemies Defeated: ${state.totalDefeated}`,
		width / 2,
		height * 0.38,
	);

	// Party summary
	ctx.font = "14px monospace";
	for (let i = 0; i < state.party.length; i++) {
		const m = state.party[i];
		const y = height * 0.48 + i * 28;
		ctx.fillStyle = m.isAlive ? "#e2e8f0" : "#666";
		ctx.fillText(
			`${m.name} - Lv${m.level}  HP ${m.hp}/${m.maxHp}  MP ${m.mp}/${m.maxMp}`,
			width / 2,
			y,
		);
	}

	ctx.textAlign = "left";
}

/** Draw the game over screen. */
export function drawGameOverScreen(
	ctx: CanvasRenderingContext2D,
	state: BattleState,
	width: number,
	height: number,
): void {
	// Red radial gradient background
	const grad = ctx.createRadialGradient(
		width / 2,
		height / 2,
		0,
		width / 2,
		height / 2,
		Math.max(width, height) / 2,
	);
	grad.addColorStop(0, "#450a0a");
	grad.addColorStop(1, "#0d0d1a");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, width, height);

	// Title
	ctx.fillStyle = "#ef4444";
	ctx.font = "bold 42px monospace";
	ctx.textAlign = "center";
	ctx.fillText("GAME OVER", width / 2, height * 0.35);

	ctx.fillStyle = "#94a3b8";
	ctx.font = "16px monospace";
	ctx.fillText(
		`Enemies Defeated: ${state.totalDefeated}`,
		width / 2,
		height * 0.48,
	);

	ctx.textAlign = "left";
}

/** Draw level-up notification overlay. */
export function drawLevelUpScreen(
	ctx: CanvasRenderingContext2D,
	levelUps: LevelUpInfo[],
	width: number,
	height: number,
): void {
	// Semi-transparent overlay
	ctx.fillStyle = "rgba(10, 10, 30, 0.85)";
	ctx.fillRect(0, 0, width, height);

	ctx.fillStyle = "#facc15";
	ctx.font = "bold 32px monospace";
	ctx.textAlign = "center";
	ctx.fillText("LEVEL UP!", width / 2, height * 0.3);

	ctx.font = "18px monospace";
	for (let i = 0; i < levelUps.length; i++) {
		const lu = levelUps[i];
		const y = height * 0.42 + i * 30;
		ctx.fillStyle = "#e2e8f0";
		ctx.fillText(
			`${lu.name}: Lv${lu.oldLevel} \u2192 Lv${lu.newLevel}`,
			width / 2,
			y,
		);
	}

	ctx.fillStyle = "#94a3b8";
	ctx.font = "14px monospace";
	ctx.fillText("Click to continue", width / 2, height * 0.7);

	ctx.textAlign = "left";
}
