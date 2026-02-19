import {
	PRIORITY_COLORS,
	SORT_BIN_HEIGHT,
	SORT_DEADLINE_Y_OFFSET,
} from "../config/constants.js";
import type { SortBin } from "../types/game.js";
import type { PhysicsCard } from "../types/physics.js";

const CARD_BG = "#1a1a2e";
const CARD_RADIUS = 6;
const ACCENT_WIDTH = 5;
const FONT_ID = "11px monospace";
const FONT_TITLE = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_AVATAR = "10px -apple-system, sans-serif";

export interface ScoredCardAnim {
	correct: boolean;
	timestamp: number;
}

const FADE_DURATION_MS = 800;

export function drawFrame(
	ctx: CanvasRenderingContext2D,
	cards: PhysicsCard[],
	avatarCache: Map<string, HTMLImageElement>,
	bins?: SortBin[],
	scoredAnims?: Map<string, ScoredCardAnim>,
): void {
	const { width, height } = ctx.canvas;
	ctx.clearRect(0, 0, width, height);

	// Draw background
	ctx.fillStyle = "#0a0a1a";
	ctx.fillRect(0, 0, width, height);

	// Draw bins if present
	if (bins) {
		drawBins(ctx, bins, height);
	}

	const now = performance.now();

	// Draw cards
	for (const card of cards) {
		const anim = scoredAnims?.get(card.issue.id);
		if (anim) {
			const elapsed = now - anim.timestamp;
			const progress = Math.min(elapsed / FADE_DURATION_MS, 1);
			const opacity = 1 - progress;
			ctx.save();
			ctx.globalAlpha = opacity;
			drawCard(ctx, card, avatarCache);
			ctx.globalAlpha = 1;
			drawScoredOverlay(ctx, card, anim.correct, progress);
			ctx.restore();
		} else {
			drawCard(ctx, card, avatarCache);
		}
	}
}

function drawBins(
	ctx: CanvasRenderingContext2D,
	bins: SortBin[],
	canvasHeight: number,
): void {
	const binTop = canvasHeight - SORT_BIN_HEIGHT;
	const deadlineY = canvasHeight - SORT_DEADLINE_Y_OFFSET;

	// Draw deadline line
	ctx.save();
	ctx.setLineDash([8, 6]);
	ctx.strokeStyle = "#ef444488";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, deadlineY);
	ctx.lineTo(ctx.canvas.width, deadlineY);
	ctx.stroke();
	ctx.restore();

	// Deadline label
	ctx.fillStyle = "#ef444488";
	ctx.font = "11px -apple-system, sans-serif";
	ctx.textAlign = "left";
	ctx.fillText("DEADLINE", 8, deadlineY - 6);

	// Draw bin backgrounds and labels
	for (const bin of bins) {
		// Bin background fill
		ctx.fillStyle = `${bin.color}15`;
		ctx.fillRect(bin.x + 3, binTop, bin.width - 6, SORT_BIN_HEIGHT);

		// Bin label at top of bin area
		ctx.fillStyle = `${bin.color}cc`;
		ctx.font = "bold 13px -apple-system, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(bin.label, bin.x + bin.width / 2, binTop + 18);
	}

	// Draw divider lines between bins
	ctx.strokeStyle = "#ffffff33";
	ctx.lineWidth = 4;
	for (let i = 0; i <= bins.length; i++) {
		const x =
			i < bins.length
				? bins[i].x
				: bins[bins.length - 1].x + bins[bins.length - 1].width;
		ctx.beginPath();
		ctx.moveTo(x, binTop);
		ctx.lineTo(x, canvasHeight);
		ctx.stroke();
	}
}

function drawCard(
	ctx: CanvasRenderingContext2D,
	card: PhysicsCard,
	avatarCache: Map<string, HTMLImageElement>,
): void {
	const { body, issue, width, height } = card;
	const { x, y } = body.position;
	const angle = body.angle;

	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);

	// Card background
	roundRect(ctx, -width / 2, -height / 2, width, height, CARD_RADIUS);
	ctx.fillStyle = CARD_BG;
	ctx.fill();

	// Priority accent strip (left edge)
	const accentColor = PRIORITY_COLORS[issue.priority] ?? PRIORITY_COLORS[0];
	ctx.fillStyle = accentColor;
	roundRectLeft(
		ctx,
		-width / 2,
		-height / 2,
		ACCENT_WIDTH,
		height,
		CARD_RADIUS,
	);
	ctx.fill();

	// Identifier
	ctx.fillStyle = "#888";
	ctx.font = FONT_ID;
	ctx.textAlign = "left";
	ctx.fillText(
		issue.identifier,
		-width / 2 + ACCENT_WIDTH + 6,
		-height / 2 + 16,
	);

	// Title (word-wrapped)
	ctx.fillStyle = "#e0e0e0";
	ctx.font = FONT_TITLE;
	const titleX = -width / 2 + ACCENT_WIDTH + 6;
	const titleMaxWidth = width - ACCENT_WIDTH - 12 - 28; // leave room for avatar
	wrapText(ctx, issue.title, titleX, -height / 2 + 32, titleMaxWidth, 15, 3);

	// Assignee avatar
	if (issue.assignee) {
		const avatarSize = 22;
		const ax = width / 2 - avatarSize - 4;
		const ay = height / 2 - avatarSize - 4;

		const avatarImg = issue.assignee.avatarUrl
			? avatarCache.get(issue.assignee.avatarUrl)
			: null;

		if (avatarImg) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(
				ax + avatarSize / 2,
				ay + avatarSize / 2,
				avatarSize / 2,
				0,
				Math.PI * 2,
			);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatarImg, ax, ay, avatarSize, avatarSize);
			ctx.restore();
		} else {
			// Fallback: initials circle
			ctx.fillStyle = accentColor;
			ctx.beginPath();
			ctx.arc(
				ax + avatarSize / 2,
				ay + avatarSize / 2,
				avatarSize / 2,
				0,
				Math.PI * 2,
			);
			ctx.fill();

			ctx.fillStyle = "#fff";
			ctx.font = FONT_AVATAR;
			ctx.textAlign = "center";
			ctx.fillText(
				issue.assignee.name.charAt(0).toUpperCase(),
				ax + avatarSize / 2,
				ay + avatarSize / 2 + 4,
			);
		}
	}

	ctx.restore();
}

function drawScoredOverlay(
	ctx: CanvasRenderingContext2D,
	card: PhysicsCard,
	correct: boolean,
	progress: number,
): void {
	const { body, width, height } = card;
	const { x, y } = body.position;
	const angle = body.angle;

	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);

	// Scale the icon up slightly as it fades
	const scale = 1 + progress * 0.3;
	const iconSize = Math.min(width, height) * 0.5;
	// Fade the icon out more slowly than the card (stays visible longer)
	const iconAlpha = 1 - progress * 0.6;

	ctx.globalAlpha = iconAlpha;
	ctx.scale(scale, scale);

	if (correct) {
		// Green checkmark
		ctx.strokeStyle = "#22c55e";
		ctx.lineWidth = 4;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.beginPath();
		ctx.moveTo(-iconSize * 0.3, 0);
		ctx.lineTo(-iconSize * 0.05, iconSize * 0.25);
		ctx.lineTo(iconSize * 0.3, -iconSize * 0.2);
		ctx.stroke();
	} else {
		// Red X
		ctx.strokeStyle = "#ef4444";
		ctx.lineWidth = 4;
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(-iconSize * 0.2, -iconSize * 0.2);
		ctx.lineTo(iconSize * 0.2, iconSize * 0.2);
		ctx.moveTo(iconSize * 0.2, -iconSize * 0.2);
		ctx.lineTo(-iconSize * 0.2, iconSize * 0.2);
		ctx.stroke();
	}

	ctx.restore();
}

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
): void {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.lineTo(x + w, y + h - r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.lineTo(x + r, y + h);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

function roundRectLeft(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
): void {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w, y);
	ctx.lineTo(x + w, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

function wrapText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	startY: number,
	maxWidth: number,
	lineHeight: number,
	maxLines: number,
): void {
	const words = text.split(" ");
	let line = "";
	let lineCount = 0;
	let currentY = startY;

	for (let i = 0; i < words.length; i++) {
		const testLine = line + (line ? " " : "") + words[i];
		const metrics = ctx.measureText(testLine);

		if (metrics.width > maxWidth && line) {
			lineCount++;
			if (lineCount >= maxLines) {
				ctx.fillText(`${line}...`, x, currentY);
				return;
			}
			ctx.fillText(line, x, currentY);
			line = words[i];
			currentY += lineHeight;
		} else {
			line = testLine;
		}
	}

	if (line) {
		ctx.fillText(line, x, currentY);
	}
}
