import { useCallback, useEffect, useRef, useState } from "react";
import { PRIORITY_COLORS } from "../../config/constants.js";
import {
	type BattleAction,
	type BattleResult,
	type EnemyStats,
	type PlayerStats,
	createEnemy,
	createPlayer,
	executeTurn,
} from "../../game/modes/jrpgAdventure.js";
import type { LinearIssue } from "../../types/linear.js";

interface JRPGCanvasProps {
	issues: LinearIssue[];
}

type GamePhase = "battle" | "victory" | "gameover";

function drawHpBar(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	hp: number,
	maxHp: number,
) {
	const ratio = Math.max(0, hp / maxHp);
	const barHeight = 10;

	// Background
	ctx.fillStyle = "#333344";
	ctx.fillRect(x, y, width, barHeight);

	// HP fill: green -> yellow -> red
	let color: string;
	if (ratio > 0.5) {
		color = "#22c55e";
	} else if (ratio > 0.25) {
		color = "#eab308";
	} else {
		color = "#ef4444";
	}

	ctx.fillStyle = color;
	ctx.fillRect(x, y, Math.round(width * ratio), barHeight);

	// Border
	ctx.strokeStyle = "#666688";
	ctx.lineWidth = 1;
	ctx.strokeRect(x, y, width, barHeight);
}

function drawScene(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	player: PlayerStats,
	enemy: EnemyStats,
	issueIndex: number,
	totalIssues: number,
	battleLog: string[],
) {
	// Dark background
	ctx.fillStyle = "#0d0d1a";
	ctx.fillRect(0, 0, width, height);

	// Subtle grid lines for atmosphere
	ctx.strokeStyle = "#1a1a2e";
	ctx.lineWidth = 1;
	for (let gx = 0; gx < width; gx += 40) {
		ctx.beginPath();
		ctx.moveTo(gx, 0);
		ctx.lineTo(gx, height);
		ctx.stroke();
	}
	for (let gy = 0; gy < height; gy += 40) {
		ctx.beginPath();
		ctx.moveTo(0, gy);
		ctx.lineTo(width, gy);
		ctx.stroke();
	}

	// Title bar at top
	ctx.fillStyle = "#1a1a2e";
	ctx.fillRect(0, 0, width, 48);
	ctx.strokeStyle = "#4a4a6a";
	ctx.lineWidth = 1;
	ctx.strokeRect(0, 0, width, 48);

	ctx.fillStyle = "#c9d1d9";
	ctx.font = "bold 18px monospace";
	ctx.textAlign = "center";
	ctx.fillText(`Battle ${issueIndex + 1} / ${totalIssues}`, width / 2, 30);

	// Priority label
	const priorityLabels: Record<number, string> = {
		0: "NONE",
		1: "URGENT",
		2: "HIGH",
		3: "NORMAL",
		4: "LOW",
	};
	const priorityColor = PRIORITY_COLORS[enemy.priority] ?? "#6b7280";
	ctx.fillStyle = priorityColor;
	ctx.font = "bold 12px monospace";
	ctx.textAlign = "right";
	ctx.fillText(
		`Priority: ${priorityLabels[enemy.priority] ?? "?"}`,
		width - 16,
		30,
	);

	ctx.textAlign = "left";
	ctx.fillStyle = "#888aaa";
	ctx.font = "12px monospace";
	ctx.fillText(`Defeated: ${player.defeated}`, 16, 30);

	// ─── Enemy sprite (right side) ───
	const enemyW = Math.min(200, width * 0.3);
	const enemyH = 120;
	const enemyX = width - enemyW - 60;
	const enemyY = 80;

	// Outer glow effect
	ctx.shadowColor = priorityColor;
	ctx.shadowBlur = 16;
	ctx.strokeStyle = priorityColor;
	ctx.lineWidth = 3;
	ctx.strokeRect(enemyX, enemyY, enemyW, enemyH);
	ctx.shadowBlur = 0;

	// Enemy fill
	ctx.fillStyle = "#1e1e3a";
	ctx.fillRect(enemyX, enemyY, enemyW, enemyH);

	// Enemy identifier badge
	ctx.fillStyle = priorityColor;
	ctx.font = "bold 14px monospace";
	ctx.textAlign = "center";
	ctx.fillText(enemy.identifier, enemyX + enemyW / 2, enemyY + 26);

	// Enemy name (word-wrapped into two lines if needed)
	ctx.fillStyle = "#c9d1d9";
	ctx.font = "11px monospace";
	const nameMaxWidth = enemyW - 12;
	const words = enemy.name.split(" ");
	let line1 = "";
	let line2 = "";
	for (const word of words) {
		const testLine = line1 ? `${line1} ${word}` : word;
		const measured = ctx.measureText(testLine).width;
		if (measured > nameMaxWidth && line1) {
			line2 = line2 ? `${line2} ${word}` : word;
		} else {
			line1 = testLine;
		}
	}
	ctx.fillText(line1, enemyX + enemyW / 2, enemyY + 50);
	if (line2) {
		ctx.fillText(line2, enemyX + enemyW / 2, enemyY + 65);
	}

	// Enemy ATK stat
	ctx.fillStyle = "#ef4444";
	ctx.font = "11px monospace";
	ctx.fillText(`ATK: ${enemy.attack}`, enemyX + enemyW / 2, enemyY + 90);

	// Enemy HP display
	ctx.fillStyle = "#888aaa";
	ctx.font = "10px monospace";
	ctx.fillText(
		`HP: ${Math.max(0, enemy.hp)} / ${enemy.maxHp}`,
		enemyX + enemyW / 2,
		enemyY + 107,
	);

	// Enemy HP bar
	drawHpBar(ctx, enemyX, enemyY - 18, enemyW, enemy.hp, enemy.maxHp);

	// ─── Player sprite (left side) ───
	const playerW = Math.min(160, width * 0.25);
	const playerH = 100;
	const playerX = 60;
	const playerY = 100;

	ctx.shadowColor = "#3b82f6";
	ctx.shadowBlur = 12;
	ctx.strokeStyle = "#3b82f6";
	ctx.lineWidth = 3;
	ctx.strokeRect(playerX, playerY, playerW, playerH);
	ctx.shadowBlur = 0;

	ctx.fillStyle = "#0f1e3a";
	ctx.fillRect(playerX, playerY, playerW, playerH);

	ctx.fillStyle = "#60a5fa";
	ctx.font = "bold 14px monospace";
	ctx.textAlign = "center";
	ctx.fillText("HERO", playerX + playerW / 2, playerY + 26);

	ctx.fillStyle = "#c9d1d9";
	ctx.font = "11px monospace";
	ctx.fillText(`ATK: ${player.attack}`, playerX + playerW / 2, playerY + 48);
	ctx.fillText(`DEF: ${player.defense}`, playerX + playerW / 2, playerY + 64);
	ctx.fillStyle = "#a78bfa";
	ctx.fillText(
		`SP: ${player.specialUses}`,
		playerX + playerW / 2,
		playerY + 82,
	);

	// Player HP bar
	drawHpBar(ctx, playerX, playerY - 18, playerW, player.hp, player.maxHp);

	// Player HP text above bar
	ctx.fillStyle = "#888aaa";
	ctx.font = "10px monospace";
	ctx.textAlign = "left";
	ctx.fillText(
		`HP: ${Math.max(0, player.hp)} / ${player.maxHp}`,
		playerX,
		playerY - 22,
	);

	// ─── Battle log panel at bottom ───
	const logH = 100;
	const logY = height - logH;

	ctx.fillStyle = "#10101e";
	ctx.fillRect(0, logY, width, logH);
	ctx.strokeStyle = "#4a4a6a";
	ctx.lineWidth = 1;
	ctx.strokeRect(0, logY, width, logH);

	ctx.fillStyle = "#6e7aa0";
	ctx.font = "bold 11px monospace";
	ctx.textAlign = "left";
	ctx.fillText("Battle Log", 12, logY + 16);

	const visibleMessages = battleLog.slice(-4);
	visibleMessages.forEach((msg, i) => {
		const alpha = 0.4 + (i / visibleMessages.length) * 0.6;
		ctx.fillStyle = `rgba(180, 185, 210, ${alpha})`;
		ctx.font = "11px monospace";
		ctx.fillText(msg, 12, logY + 32 + i * 16, width - 24);
	});
}

function drawGameOver(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	defeated: number,
) {
	ctx.fillStyle = "#0d0d1a";
	ctx.fillRect(0, 0, width, height);

	// Red glow overlay
	const grad = ctx.createRadialGradient(
		width / 2,
		height / 2,
		0,
		width / 2,
		height / 2,
		width * 0.6,
	);
	grad.addColorStop(0, "rgba(239,68,68,0.15)");
	grad.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, width, height);

	ctx.fillStyle = "#ef4444";
	ctx.font = "bold 48px monospace";
	ctx.textAlign = "center";
	ctx.fillText("GAME OVER", width / 2, height / 2 - 40);

	ctx.fillStyle = "#c9d1d9";
	ctx.font = "20px monospace";
	ctx.fillText(`Issues defeated: ${defeated}`, width / 2, height / 2 + 10);
}

function drawVictory(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	defeated: number,
) {
	ctx.fillStyle = "#0d0d1a";
	ctx.fillRect(0, 0, width, height);

	const grad = ctx.createRadialGradient(
		width / 2,
		height / 2,
		0,
		width / 2,
		height / 2,
		width * 0.6,
	);
	grad.addColorStop(0, "rgba(34,197,94,0.18)");
	grad.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, width, height);

	ctx.fillStyle = "#22c55e";
	ctx.font = "bold 48px monospace";
	ctx.textAlign = "center";
	ctx.fillText("VICTORY!", width / 2, height / 2 - 40);

	ctx.fillStyle = "#c9d1d9";
	ctx.font = "20px monospace";
	ctx.fillText(`All ${defeated} issues cleared!`, width / 2, height / 2 + 10);
}

export function JRPGCanvas({ issues }: JRPGCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const [player, setPlayer] = useState<PlayerStats>(() => createPlayer());
	const [enemy, setEnemy] = useState<EnemyStats | null>(() =>
		issues.length > 0 ? createEnemy(issues[0]) : null,
	);
	const [issueIndex, setIssueIndex] = useState(0);
	const [battleLog, setBattleLog] = useState<string[]>([
		"A wild issue appears! Choose your action.",
	]);
	const [phase, setPhase] = useState<GamePhase>("battle");
	const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
	const [actionLocked, setActionLocked] = useState(false);

	// Resize observer
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setCanvasSize({
					width: entry.contentRect.width,
					height: entry.contentRect.height,
				});
			}
		});

		observer.observe(container);
		setCanvasSize({
			width: container.clientWidth,
			height: container.clientHeight,
		});

		return () => observer.disconnect();
	}, []);

	// Initialize enemy when issues change
	useEffect(() => {
		if (issues.length > 0) {
			setEnemy(createEnemy(issues[0]));
			setIssueIndex(0);
			setPlayer(createPlayer());
			setBattleLog(["A wild issue appears! Choose your action."]);
			setPhase("battle");
			setActionLocked(false);
		}
	}, [issues]);

	// Draw on canvas whenever state changes
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = canvasSize.width;
		canvas.height = canvasSize.height;

		if (phase === "battle" && enemy !== null) {
			drawScene(
				ctx,
				canvasSize.width,
				canvasSize.height,
				player,
				enemy,
				issueIndex,
				issues.length,
				battleLog,
			);
		} else if (phase === "gameover") {
			drawGameOver(ctx, canvasSize.width, canvasSize.height, player.defeated);
		} else if (phase === "victory") {
			drawVictory(ctx, canvasSize.width, canvasSize.height, player.defeated);
		}
	}, [player, enemy, issueIndex, battleLog, phase, canvasSize, issues.length]);

	const handleAction = useCallback(
		(action: BattleAction) => {
			if (phase !== "battle" || enemy === null || actionLocked) return;

			setActionLocked(true);

			const result: BattleResult = executeTurn(player, enemy, action);

			// Compute new player state
			const healAmount = action === "defend" ? 5 : 0;
			const newPlayerHp = Math.min(
				player.maxHp,
				player.hp - result.playerDamage + healAmount,
			);
			const newSpecialUses =
				action === "special" && player.specialUses > 0
					? player.specialUses - 1
					: player.specialUses;

			const newEnemyHp = Math.max(0, enemy.hp - result.enemyDamage);

			// Update battle log
			setBattleLog((prev) => [...prev, result.message]);

			if (result.enemyDefeated) {
				// Enemy defeated
				const newDefeated = player.defeated + 1;
				const updatedPlayer: PlayerStats = {
					...player,
					hp: newPlayerHp,
					specialUses: newSpecialUses,
					defeated: newDefeated,
				};
				setPlayer(updatedPlayer);
				setEnemy({ ...enemy, hp: 0 });

				setBattleLog((prev) => [
					...prev,
					`${enemy.identifier} defeated! Moving to next issue...`,
				]);

				// Advance to next issue after 1 second
				setTimeout(() => {
					const nextIndex = issueIndex + 1;
					if (nextIndex >= issues.length) {
						setPhase("victory");
					} else {
						setIssueIndex(nextIndex);
						setEnemy(createEnemy(issues[nextIndex]));
						setBattleLog([
							`A new issue appears: ${issues[nextIndex].identifier}!`,
						]);
						setActionLocked(false);
					}
				}, 1000);
			} else if (result.playerDefeated) {
				// Player defeated
				const updatedPlayer: PlayerStats = {
					...player,
					hp: 0,
					specialUses: newSpecialUses,
				};
				setPlayer(updatedPlayer);
				setEnemy({ ...enemy, hp: newEnemyHp });
				setBattleLog((prev) => [...prev, "You have been defeated!"]);
				setTimeout(() => {
					setPhase("gameover");
					setActionLocked(false);
				}, 800);
			} else {
				// Continue battle
				setPlayer({
					...player,
					hp: newPlayerHp,
					specialUses: newSpecialUses,
				});
				setEnemy({ ...enemy, hp: newEnemyHp });
				setActionLocked(false);
			}
		},
		[phase, enemy, player, issueIndex, issues, actionLocked],
	);

	const handleRestart = useCallback(() => {
		if (issues.length === 0) return;
		setPlayer(createPlayer());
		setEnemy(createEnemy(issues[0]));
		setIssueIndex(0);
		setBattleLog(["A wild issue appears! Choose your action."]);
		setPhase("battle");
		setActionLocked(false);
	}, [issues]);

	const isBattle = phase === "battle";

	return (
		<div
			ref={containerRef}
			style={{ width: "100%", height: "100%", position: "relative" }}
		>
			<canvas
				ref={canvasRef}
				style={{ display: "block", width: "100%", height: "100%" }}
			/>

			{/* Action buttons overlaid on canvas */}
			{isBattle && (
				<div
					style={{
						position: "absolute",
						bottom: "116px",
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						gap: "12px",
						pointerEvents: actionLocked ? "none" : "auto",
						opacity: actionLocked ? 0.5 : 1,
					}}
				>
					<ActionButton
						label="Attack"
						borderColor="#ef4444"
						onClick={() => handleAction("attack")}
					/>
					<ActionButton
						label="Defend"
						borderColor="#22c55e"
						onClick={() => handleAction("defend")}
					/>
					<ActionButton
						label={`Special (${player.specialUses})`}
						borderColor="#a78bfa"
						onClick={() => handleAction("special")}
						disabled={player.specialUses === 0}
					/>
				</div>
			)}

			{/* Game Over overlay buttons */}
			{phase === "gameover" && (
				<div
					style={{
						position: "absolute",
						top: "60%",
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "8px",
					}}
				>
					<button
						type="button"
						onClick={handleRestart}
						style={{
							background: "#1a1a2e",
							border: "2px solid #ef4444",
							color: "#ef4444",
							padding: "10px 28px",
							fontSize: "16px",
							fontFamily: "monospace",
							cursor: "pointer",
							borderRadius: "4px",
							letterSpacing: "1px",
						}}
					>
						Try Again
					</button>
				</div>
			)}

			{/* Victory overlay buttons */}
			{phase === "victory" && (
				<div
					style={{
						position: "absolute",
						top: "60%",
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "8px",
					}}
				>
					<button
						type="button"
						onClick={handleRestart}
						style={{
							background: "#1a1a2e",
							border: "2px solid #22c55e",
							color: "#22c55e",
							padding: "10px 28px",
							fontSize: "16px",
							fontFamily: "monospace",
							cursor: "pointer",
							borderRadius: "4px",
							letterSpacing: "1px",
						}}
					>
						Play Again
					</button>
				</div>
			)}
		</div>
	);
}

interface ActionButtonProps {
	label: string;
	borderColor: string;
	onClick: () => void;
	disabled?: boolean;
}

function ActionButton({
	label,
	borderColor,
	onClick,
	disabled = false,
}: ActionButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			style={{
				background: "#1a1a2e",
				border: `2px solid ${disabled ? "#444" : borderColor}`,
				color: disabled ? "#555" : borderColor,
				padding: "8px 20px",
				fontSize: "13px",
				fontFamily: "monospace",
				cursor: disabled ? "not-allowed" : "pointer",
				borderRadius: "4px",
				letterSpacing: "1px",
				minWidth: "100px",
				transition: "opacity 0.15s",
			}}
		>
			{label}
		</button>
	);
}
