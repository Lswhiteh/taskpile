import type { BattleState, TurnEntry } from "../../../types/jrpg.js";

/** Draw the title bar at the top. */
export function drawTitleBar(
	ctx: CanvasRenderingContext2D,
	state: BattleState,
	width: number,
): void {
	// Background
	ctx.fillStyle = "#0f0f1e";
	ctx.fillRect(0, 0, width, 36);
	ctx.strokeStyle = "#333";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(0, 36);
	ctx.lineTo(width, 36);
	ctx.stroke();

	// Battle counter
	ctx.fillStyle = "#e2e8f0";
	ctx.font = "bold 13px monospace";
	ctx.textAlign = "left";
	const battleNum = Math.min(state.issueIndex + 1, state.issues.length);
	ctx.fillText(`Battle ${battleNum} / ${state.issues.length}`, 12, 24);

	// Defeated counter
	ctx.fillStyle = "#a78bfa";
	ctx.font = "12px monospace";
	ctx.textAlign = "right";
	ctx.fillText(`Defeated: ${state.totalDefeated}`, width - 12, 24);
	ctx.textAlign = "left";
}

/** Draw the turn order indicator bar below the title bar. */
export function drawTurnOrder(
	ctx: CanvasRenderingContext2D,
	turnQueue: TurnEntry[],
	currentIndex: number,
	width: number,
): void {
	const barY = 40;
	const barH = 24;

	ctx.fillStyle = "#0d0d18";
	ctx.fillRect(0, barY, width, barH);

	const maxShow = Math.min(turnQueue.length, 8);
	const chipW = 72;
	const gap = 4;
	const totalW = maxShow * chipW + (maxShow - 1) * gap;
	const startX = (width - totalW) / 2;

	for (let i = 0; i < maxShow; i++) {
		const entry = turnQueue[i];
		if (!entry) continue;

		const x = startX + i * (chipW + gap);
		const isCurrent = i === currentIndex;

		ctx.fillStyle = isCurrent
			? entry.type === "party"
				? "#1e3a5f"
				: "#3f1515"
			: "#1a1a28";
		ctx.strokeStyle = isCurrent ? "#60a5fa" : "#333";
		ctx.lineWidth = isCurrent ? 2 : 1;
		ctx.beginPath();
		ctx.roundRect(x, barY + 2, chipW, barH - 4, 4);
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = entry.isExtra
			? "#facc15"
			: entry.type === "party"
				? "#e2e8f0"
				: "#f87171";
		ctx.font = isCurrent ? "bold 10px monospace" : "10px monospace";
		ctx.textAlign = "center";
		const label = entry.isExtra ? `${entry.name}+` : entry.name;
		ctx.fillText(label.slice(0, 9), x + chipW / 2, barY + barH - 6);
	}

	ctx.textAlign = "left";
}

/** Draw the battle log panel at the bottom. */
export function drawBattleLog(
	ctx: CanvasRenderingContext2D,
	log: string[],
	width: number,
	height: number,
): void {
	const logH = 70;
	const logY = height - logH;

	// Semi-transparent background
	ctx.fillStyle = "rgba(10, 10, 20, 0.85)";
	ctx.fillRect(0, logY, width, logH);
	ctx.strokeStyle = "#333";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(0, logY);
	ctx.lineTo(width, logY);
	ctx.stroke();

	// Last 4 messages
	const visible = log.slice(-4);
	ctx.font = "11px monospace";
	ctx.textAlign = "left";

	for (let i = 0; i < visible.length; i++) {
		const alpha = 0.4 + (i / visible.length) * 0.6;
		ctx.fillStyle = `rgba(200, 200, 220, ${alpha})`;
		const text =
			visible[i].length > 70 ? `${visible[i].slice(0, 67)}...` : visible[i];
		ctx.fillText(text, 12, logY + 16 + i * 14);
	}
}
