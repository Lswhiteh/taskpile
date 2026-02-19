import { PRIORITY_COLORS } from "../../../config/constants.js";
import { JRPG } from "../../../config/constants.js";
import {
	ELEMENT_COLORS,
	ELEMENT_LABELS,
	ELEMENT_SYMBOLS,
} from "../../../game/jrpg/elements.js";
import type { EnemyStats } from "../../../types/jrpg.js";

/** Draw the enemy sprite area on the right side of the canvas. */
export function drawEnemy(
	ctx: CanvasRenderingContext2D,
	enemy: EnemyStats,
	width: number,
): void {
	const boxW = 220;
	const boxH = 160;
	const x = width - boxW - 40;
	const y = 80;

	const priorityColor = PRIORITY_COLORS[enemy.priority] ?? "#6b7280";
	const elementColor = ELEMENT_COLORS[enemy.element];

	// Glow
	ctx.shadowColor = priorityColor;
	ctx.shadowBlur = 20;
	ctx.fillStyle = "#1a1a2e";
	ctx.beginPath();
	ctx.roundRect(x, y, boxW, boxH, 8);
	ctx.fill();
	ctx.shadowBlur = 0;

	// Border
	ctx.strokeStyle = priorityColor;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.roundRect(x, y, boxW, boxH, 8);
	ctx.stroke();

	// Identifier badge
	ctx.fillStyle = priorityColor;
	ctx.beginPath();
	ctx.roundRect(x + 8, y + 8, 80, 22, 4);
	ctx.fill();
	ctx.fillStyle = "#fff";
	ctx.font = "bold 12px monospace";
	ctx.textAlign = "center";
	ctx.fillText(enemy.identifier, x + 48, y + 24);

	// Element icon
	ctx.fillStyle = elementColor;
	ctx.font = "18px monospace";
	ctx.textAlign = "right";
	ctx.fillText(ELEMENT_SYMBOLS[enemy.element], x + boxW - 12, y + 26);

	// Enemy name (word-wrapped)
	ctx.fillStyle = "#e2e8f0";
	ctx.font = "13px monospace";
	ctx.textAlign = "left";
	const nameLines = wrapText(enemy.name, 20);
	for (let i = 0; i < nameLines.length; i++) {
		ctx.fillText(nameLines[i], x + 12, y + 50 + i * 16);
	}

	// ATK / DEF stats
	ctx.fillStyle = "#f87171";
	ctx.font = "11px monospace";
	ctx.fillText(`ATK ${enemy.atk}`, x + 12, y + boxH - 30);
	ctx.fillStyle = "#60a5fa";
	ctx.fillText(`DEF ${enemy.def}`, x + 80, y + boxH - 30);

	// Weakness info (if revealed)
	if (enemy.weaknessRevealed && enemy.weakness) {
		ctx.fillStyle = ELEMENT_COLORS[enemy.weakness];
		ctx.font = "10px monospace";
		ctx.fillText(
			`Weak: ${ELEMENT_LABELS[enemy.weakness]}`,
			x + 12,
			y + boxH - 16,
		);
	}

	// HP bar above the box
	const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
	const barW = boxW - 16;
	const barH = 12;
	const barX = x + 8;
	const barY = y - 20;

	ctx.fillStyle = "#1e293b";
	ctx.beginPath();
	ctx.roundRect(barX, barY, barW, barH, 3);
	ctx.fill();

	const hpColor =
		hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#eab308" : "#ef4444";
	if (hpRatio > 0) {
		ctx.fillStyle = hpColor;
		ctx.beginPath();
		ctx.roundRect(barX, barY, barW * hpRatio, barH, 3);
		ctx.fill();
	}

	ctx.strokeStyle = "#475569";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(barX, barY, barW, barH, 3);
	ctx.stroke();

	ctx.fillStyle = "#fff";
	ctx.font = "9px monospace";
	ctx.textAlign = "center";
	ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, barX + barW / 2, barY + 10);

	// Status effect dots
	drawEnemyStatuses(
		ctx,
		x + 12,
		y + boxH - 4,
		enemy.statuses.map((s) => s.type),
	);

	ctx.textAlign = "left";
}

function drawEnemyStatuses(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	statuses: string[],
): void {
	const colors = JRPG.STATUS_COLORS;
	for (let i = 0; i < statuses.length; i++) {
		const color = colors[statuses[i] as keyof typeof colors] ?? "#aaa";
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x + i * 14 + 5, y, 5, 0, Math.PI * 2);
		ctx.fill();
	}
}

function wrapText(text: string, maxChars: number): string[] {
	const words = text.split(" ");
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		if (current.length + word.length + 1 > maxChars && current.length > 0) {
			lines.push(current);
			current = word;
		} else {
			current = current ? `${current} ${word}` : word;
		}
	}
	if (current) lines.push(current);
	return lines;
}
