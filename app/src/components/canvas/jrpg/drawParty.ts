import { JRPG } from "../../../config/constants.js";
import {
	ELEMENT_COLORS,
	ELEMENT_SYMBOLS,
} from "../../../game/jrpg/elements.js";
import type { PartyMember } from "../../../types/jrpg.js";

const ROLE_COLORS: Record<string, string> = {
	warrior: "#ef4444",
	mage: "#818cf8",
	healer: "#4ade80",
};

/** Draw all 3 party member panels at the bottom-left area. */
export function drawPartyPanel(
	ctx: CanvasRenderingContext2D,
	party: PartyMember[],
	activeIndex: number,
	width: number,
	height: number,
): void {
	const panelY = height - 160;
	const panelWidth = Math.min(200, (width - 40) / 3);
	const panelHeight = 120;
	const gap = 8;
	const startX = 10;

	for (let i = 0; i < party.length; i++) {
		const member = party[i];
		const x = startX + i * (panelWidth + gap);
		const isActive = i === activeIndex;
		const isDown = !member.isAlive;

		// Panel background
		ctx.fillStyle = isDown ? "#1a1012" : isActive ? "#1a1a3e" : "#12121f";
		ctx.strokeStyle = isActive ? "#60a5fa" : "#333";
		ctx.lineWidth = isActive ? 2 : 1;
		ctx.beginPath();
		ctx.roundRect(x, panelY, panelWidth, panelHeight, 6);
		ctx.fill();
		ctx.stroke();

		if (isDown) {
			ctx.globalAlpha = 0.4;
		}

		// Name + Role indicator
		const roleColor = ROLE_COLORS[member.role] ?? "#aaa";
		ctx.fillStyle = roleColor;
		ctx.font = "bold 13px monospace";
		ctx.textAlign = "left";
		ctx.fillText(member.name, x + 8, panelY + 18);

		// Level
		ctx.fillStyle = "#888";
		ctx.font = "11px monospace";
		ctx.fillText(`Lv${member.level}`, x + panelWidth - 38, panelY + 18);

		// Element symbol
		ctx.fillStyle = ELEMENT_COLORS[member.element];
		ctx.font = "12px monospace";
		ctx.fillText(
			ELEMENT_SYMBOLS[member.element],
			x + panelWidth - 58,
			panelY + 18,
		);

		// HP bar
		drawBar(
			ctx,
			x + 8,
			panelY + 26,
			panelWidth - 16,
			10,
			member.hp,
			member.maxHp,
			"#22c55e",
			"#166534",
		);
		ctx.fillStyle = "#ccc";
		ctx.font = "9px monospace";
		ctx.fillText(`HP ${member.hp}/${member.maxHp}`, x + 8, panelY + 48);

		// MP bar
		drawBar(
			ctx,
			x + 8,
			panelY + 52,
			panelWidth - 16,
			8,
			member.mp,
			member.maxMp,
			"#3b82f6",
			"#1e3a5f",
		);
		ctx.fillStyle = "#aaa";
		ctx.font = "9px monospace";
		ctx.fillText(`MP ${member.mp}/${member.maxMp}`, x + 8, panelY + 70);

		// Limit gauge
		drawBar(
			ctx,
			x + 8,
			panelY + 76,
			panelWidth - 16,
			6,
			member.limitGauge,
			100,
			"#facc15",
			"#4a3c00",
		);
		if (member.limitGauge >= 100) {
			ctx.fillStyle = "#facc15";
			ctx.font = "bold 9px monospace";
			ctx.fillText("LIMIT!", x + 8, panelY + 92);
		}

		// Status effect icons
		drawStatusIcons(
			ctx,
			x + 8,
			panelY + 96,
			member.statuses.map((s) => s.type),
		);

		if (isDown) {
			ctx.globalAlpha = 1;
			ctx.fillStyle = "#ef4444";
			ctx.font = "bold 14px monospace";
			ctx.textAlign = "center";
			ctx.fillText("DOWN", x + panelWidth / 2, panelY + panelHeight / 2 + 5);
			ctx.textAlign = "left";
		}
	}
}

function drawBar(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	current: number,
	max: number,
	fillColor: string,
	bgColor: string,
): void {
	const ratio = Math.max(0, Math.min(1, current / max));

	// Background
	ctx.fillStyle = bgColor;
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, 2);
	ctx.fill();

	// Fill
	if (ratio > 0) {
		ctx.fillStyle = fillColor;
		ctx.beginPath();
		ctx.roundRect(x, y, width * ratio, height, 2);
		ctx.fill();
	}

	// Border
	ctx.strokeStyle = "#555";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, 2);
	ctx.stroke();
}

function drawStatusIcons(
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
		ctx.arc(x + i * 12 + 4, y + 4, 4, 0, Math.PI * 2);
		ctx.fill();
	}
}
