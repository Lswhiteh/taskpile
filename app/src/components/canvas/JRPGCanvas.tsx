import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
	battleReducer,
	createInitialState,
} from "../../game/jrpg/battleReducer.js";
import { ELEMENT_SYMBOLS } from "../../game/jrpg/elements.js";
import { getSkill } from "../../game/jrpg/skills.js";
import { useAnimationFrame } from "../../hooks/useAnimationFrame.js";
import type {
	BattleAction,
	BattleState,
	MenuState,
	PartyMember,
	PendingAction,
} from "../../types/jrpg.js";
import type { LinearIssue } from "../../types/linear.js";
import { getShakeOffset, updateAnimations } from "./jrpg/animations.js";
import { drawEffects } from "./jrpg/drawEffects.js";
import { drawEnemy } from "./jrpg/drawEnemy.js";
import { drawBattleLog, drawTitleBar, drawTurnOrder } from "./jrpg/drawHUD.js";
import { drawPartyPanel } from "./jrpg/drawParty.js";
import {
	drawGameOverScreen,
	drawLevelUpScreen,
	drawVictoryScreen,
} from "./jrpg/drawScreens.js";

interface JRPGCanvasProps {
	issues: LinearIssue[];
}

export function JRPGCanvas({ issues }: JRPGCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

	const [state, dispatch] = useReducer(
		battleReducer,
		issues,
		createInitialState,
	);

	// Mutable ref for animation state (updated every frame, avoids dispatch spam)
	const animRef = useRef(state.animations);
	animRef.current = state.animations;

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

	// Re-init when issues change
	useEffect(() => {
		if (issues.length > 0) {
			dispatch({ type: "RESTART" });
		}
	}, [issues]);

	// Animation loop
	useAnimationFrame((dt) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const { width, height } = canvasSize;
		canvas.width = width;
		canvas.height = height;

		// Update animations
		animRef.current = updateAnimations(animRef.current, dt);

		// Get shake offset
		const shake = getShakeOffset(animRef.current);

		ctx.save();
		ctx.translate(shake.x, shake.y);

		if (
			state.phase === "battle" ||
			state.phase === "animating" ||
			state.phase === "levelup"
		) {
			drawBattleScene(ctx, state, animRef.current, width, height);
		} else if (state.phase === "gameover") {
			drawGameOverScreen(ctx, state, width, height);
		} else if (state.phase === "victory") {
			drawVictoryScreen(ctx, state, width, height);
		}

		// Draw effects on top (floats, flashes)
		drawEffects(ctx, animRef.current, width, height);

		// Draw level-up overlay
		if (state.phase === "levelup") {
			drawLevelUpScreen(ctx, state.levelUps, width, height);
		}

		ctx.restore();
	});

	// Auto-execute enemy turns
	useEffect(() => {
		if (state.phase !== "battle") return;
		const currentTurn = state.turnQueue[state.currentTurnIndex];
		if (!currentTurn || currentTurn.type !== "enemy") return;

		const timer = setTimeout(() => {
			dispatch({ type: "SELECT_ACTION", action: { type: "attack" } });
		}, 600);
		return () => clearTimeout(timer);
	}, [state.phase, state.currentTurnIndex, state.turnQueue]);

	// Auto-advance to next enemy after defeat
	useEffect(() => {
		if (state.enemy && state.enemy.hp <= 0 && state.phase === "battle") {
			const timer = setTimeout(() => {
				dispatch({ type: "NEXT_ENEMY" });
			}, 800);
			return () => clearTimeout(timer);
		}
	}, [state.enemy, state.phase]);

	const currentTurn = state.turnQueue[state.currentTurnIndex];
	const isPlayerTurn =
		state.phase === "battle" &&
		currentTurn?.type === "party" &&
		state.enemy !== null &&
		state.enemy.hp > 0;

	const activeMember = isPlayerTurn ? state.party[currentTurn.index] : null;

	const handleAction = useCallback(
		(action: PendingAction, targetIndex?: number) => {
			dispatch({ type: "SELECT_ACTION", action, targetIndex });
		},
		[],
	);

	return (
		<div
			ref={containerRef}
			style={{ width: "100%", height: "100%", position: "relative" }}
		>
			<canvas
				ref={canvasRef}
				style={{ display: "block", width: "100%", height: "100%" }}
			/>

			{/* Battle menu overlay */}
			{isPlayerTurn && activeMember && (
				<BattleMenu
					state={state}
					member={activeMember}
					memberIndex={currentTurn.index}
					dispatch={dispatch}
					onAction={handleAction}
				/>
			)}

			{/* Level Up - click to dismiss */}
			{state.phase === "levelup" && (
				<div
					onClick={() => dispatch({ type: "DISMISS_LEVEL_UP" })}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ")
							dispatch({ type: "DISMISS_LEVEL_UP" });
					}}
					style={{
						position: "absolute",
						inset: 0,
						cursor: "pointer",
					}}
				/>
			)}

			{/* Game Over / Victory buttons */}
			{(state.phase === "gameover" || state.phase === "victory") && (
				<div
					style={{
						position: "absolute",
						top: "65%",
						left: "50%",
						transform: "translateX(-50%)",
					}}
				>
					<button
						type="button"
						onClick={() => dispatch({ type: "RESTART" })}
						style={{
							background: "#1a1a2e",
							border: `2px solid ${state.phase === "gameover" ? "#ef4444" : "#22c55e"}`,
							color: state.phase === "gameover" ? "#ef4444" : "#22c55e",
							padding: "10px 28px",
							fontSize: "16px",
							fontFamily: "monospace",
							cursor: "pointer",
							borderRadius: "4px",
							letterSpacing: "1px",
						}}
					>
						{state.phase === "gameover" ? "Try Again" : "Play Again"}
					</button>
				</div>
			)}
		</div>
	);
}

// ── Draw Battle Scene ──

function drawBattleScene(
	ctx: CanvasRenderingContext2D,
	state: BattleState,
	_animations: import("../../types/jrpg.js").AnimationState,
	width: number,
	height: number,
): void {
	// Background
	ctx.fillStyle = "#0d0d1a";
	ctx.fillRect(0, 0, width, height);

	// Subtle grid
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

	// HUD
	drawTitleBar(ctx, state, width);
	drawTurnOrder(ctx, state.turnQueue, state.currentTurnIndex, width);

	// Enemy
	if (state.enemy && state.enemy.hp > 0) {
		drawEnemy(ctx, state.enemy, width);
	}

	// Party
	const currentTurn = state.turnQueue[state.currentTurnIndex];
	const activeIdx = currentTurn?.type === "party" ? currentTurn.index : -1;
	drawPartyPanel(ctx, state.party, activeIdx, width, height);

	// Battle log
	drawBattleLog(ctx, state.battleLog, width, height);
}

// ── Battle Menu Component ──

interface BattleMenuProps {
	state: BattleState;
	member: PartyMember;
	memberIndex: number;
	dispatch: React.Dispatch<BattleAction>;
	onAction: (action: PendingAction, targetIndex?: number) => void;
}

function BattleMenu({
	state,
	member,
	memberIndex,
	dispatch,
	onAction,
}: BattleMenuProps) {
	const menu = state.menu;

	return (
		<div
			style={{
				position: "absolute",
				bottom: "170px",
				left: "50%",
				transform: "translateX(-50%)",
				display: "flex",
				flexDirection: "column",
				gap: "6px",
				alignItems: "center",
			}}
		>
			{/* Active member name */}
			<div
				style={{
					color: "#e2e8f0",
					fontFamily: "monospace",
					fontSize: "12px",
					marginBottom: "2px",
				}}
			>
				{member.name}'s turn
			</div>

			{menu.type === "main" && (
				<MainMenu
					member={member}
					memberIndex={memberIndex}
					dispatch={dispatch}
					onAction={onAction}
				/>
			)}

			{menu.type === "skills" && (
				<SkillsMenu member={member} dispatch={dispatch} onAction={onAction} />
			)}

			{menu.type === "items" && <ItemsMenu state={state} dispatch={dispatch} />}

			{menu.type === "targeting" && (
				<TargetingMenu
					state={state}
					menu={menu}
					dispatch={dispatch}
					onAction={onAction}
				/>
			)}
		</div>
	);
}

function MainMenu({
	member,
	memberIndex,
	dispatch,
	onAction,
}: {
	member: PartyMember;
	memberIndex: number;
	dispatch: React.Dispatch<BattleAction>;
	onAction: (action: PendingAction, targetIndex?: number) => void;
}) {
	const hasLimitBreak = member.limitGauge >= 100;

	return (
		<div
			style={{
				display: "flex",
				gap: "8px",
				flexWrap: "wrap",
				justifyContent: "center",
			}}
		>
			<MenuButton
				label="Attack"
				color="#ef4444"
				onClick={() => onAction({ type: "attack" })}
			/>
			<MenuButton
				label="Defend"
				color="#22c55e"
				onClick={() => onAction({ type: "defend" })}
			/>
			<MenuButton
				label="Skills"
				color="#818cf8"
				onClick={() => dispatch({ type: "OPEN_SKILLS", memberIndex })}
			/>
			<MenuButton
				label="Items"
				color="#f59e0b"
				onClick={() => dispatch({ type: "OPEN_ITEMS" })}
			/>
			{hasLimitBreak && (
				<MenuButton
					label="LIMIT!"
					color="#facc15"
					glow
					onClick={() =>
						onAction({ type: "limitBreak", skillId: member.limitSkill })
					}
				/>
			)}
		</div>
	);
}

function SkillsMenu({
	member,
	dispatch,
	onAction,
}: {
	member: PartyMember;
	dispatch: React.Dispatch<BattleAction>;
	onAction: (action: PendingAction, targetIndex?: number) => void;
}) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				alignItems: "center",
			}}
		>
			<div
				style={{
					display: "flex",
					gap: "6px",
					flexWrap: "wrap",
					justifyContent: "center",
				}}
			>
				{member.skills.map((skillId) => {
					const skill = getSkill(skillId);
					const canUse = member.mp >= skill.mpCost;
					const elementLabel = skill.element
						? ` ${ELEMENT_SYMBOLS[skill.element]}`
						: "";

					return (
						<MenuButton
							key={skillId}
							label={`${skill.name}${elementLabel} ${skill.mpCost > 0 ? `(${skill.mpCost}MP)` : ""}`}
							color={canUse ? "#818cf8" : "#444"}
							disabled={!canUse}
							onClick={() => {
								if (skill.target === "enemy" || skill.isAnalyze) {
									onAction({ type: "skill", skillId });
								} else {
									dispatch({
										type: "OPEN_TARGETING",
										action: { type: "skill", skillId },
									});
								}
							}}
						/>
					);
				})}
			</div>
			<MenuButton
				label="Back"
				color="#666"
				onClick={() => dispatch({ type: "CANCEL_MENU" })}
			/>
		</div>
	);
}

function ItemsMenu({
	state,
	dispatch,
}: {
	state: BattleState;
	dispatch: React.Dispatch<BattleAction>;
}) {
	const available = state.inventory.filter((inv) => inv.count > 0);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				alignItems: "center",
			}}
		>
			<div
				style={{
					display: "flex",
					gap: "6px",
					flexWrap: "wrap",
					justifyContent: "center",
				}}
			>
				{available.length === 0 && (
					<div
						style={{ color: "#666", fontFamily: "monospace", fontSize: "12px" }}
					>
						No items left
					</div>
				)}
				{available.map((inv) => (
					<MenuButton
						key={inv.item.id}
						label={`${inv.item.name} x${inv.count}`}
						color="#f59e0b"
						onClick={() => {
							dispatch({
								type: "OPEN_TARGETING",
								action: { type: "item", itemId: inv.item.id },
							});
						}}
					/>
				))}
			</div>
			<MenuButton
				label="Back"
				color="#666"
				onClick={() => dispatch({ type: "CANCEL_MENU" })}
			/>
		</div>
	);
}

function TargetingMenu({
	state,
	menu,
	dispatch,
	onAction,
}: {
	state: BattleState;
	menu: Extract<MenuState, { type: "targeting" }>;
	dispatch: React.Dispatch<BattleAction>;
	onAction: (action: PendingAction, targetIndex?: number) => void;
}) {
	// Determine valid targets
	const pendingAction = menu.action;
	const isRevive =
		pendingAction.type === "skill" && getSkill(pendingAction.skillId).isRevive;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				alignItems: "center",
			}}
		>
			<div
				style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "11px" }}
			>
				Select target:
			</div>
			<div style={{ display: "flex", gap: "6px" }}>
				{state.party.map((m, i) => {
					const valid = isRevive ? !m.isAlive : m.isAlive;
					return (
						<MenuButton
							key={m.name}
							label={`${m.name} ${m.hp}/${m.maxHp}`}
							color={valid ? "#60a5fa" : "#444"}
							disabled={!valid}
							onClick={() => onAction(pendingAction, i)}
						/>
					);
				})}
			</div>
			<MenuButton
				label="Back"
				color="#666"
				onClick={() => dispatch({ type: "CANCEL_MENU" })}
			/>
		</div>
	);
}

// ── Shared Button Component ──

function MenuButton({
	label,
	color,
	onClick,
	disabled = false,
	glow = false,
}: {
	label: string;
	color: string;
	onClick: () => void;
	disabled?: boolean;
	glow?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			style={{
				background: "#1a1a2e",
				border: `2px solid ${disabled ? "#333" : color}`,
				color: disabled ? "#444" : color,
				padding: "6px 14px",
				fontSize: "12px",
				fontFamily: "monospace",
				cursor: disabled ? "not-allowed" : "pointer",
				borderRadius: "4px",
				letterSpacing: "0.5px",
				minWidth: "80px",
				transition: "opacity 0.15s",
				boxShadow: glow ? `0 0 12px ${color}` : "none",
			}}
		>
			{label}
		</button>
	);
}
