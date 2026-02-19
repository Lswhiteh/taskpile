import Matter from "matter-js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	SORT_CORRECT_POINTS,
	SORT_MISS_POINTS,
	SORT_WRONG_POINTS,
} from "../../config/constants.js";
import { useGameMode } from "../../game/GameModeContext.js";
import { initBurndownBowling } from "../../game/modes/burndownBowling.js";
import {
	PONG_PADDLE_LABEL,
	applyPongCardVelocity,
	hasCardHitPaddle,
	hasCardPassedPaddle,
	initEstimatePong,
	isHighEstimate,
	updatePaddlePosition,
} from "../../game/modes/estimatePong.js";
import { initFreePlay } from "../../game/modes/freePlay.js";
import {
	countSavedCards,
	initPriorityAvalanche,
} from "../../game/modes/priorityAvalanche.js";
import {
	checkCardInBin,
	hasCardCrossedDeadline,
	initSortChallenge,
} from "../../game/modes/sortChallenge.js";
import {
	checkRowClear,
	hasReachedTop,
	initSprintTetris,
	scoreClear,
} from "../../game/modes/sprintTetris.js";
import {
	checkGameOver,
	initStackAttack,
	measureStackHeight,
} from "../../game/modes/stackAttack.js";
import {
	applyPopVelocity,
	hasCardEscaped,
	initWhackABug,
	onCardEscaped,
	onCardSmashed,
} from "../../game/modes/whackABug.js";
import { useAnimationFrame } from "../../hooks/useAnimationFrame.js";
import { useAvatarCache } from "../../hooks/useAvatarCache.js";
import { useCanvasSize } from "../../hooks/useCanvasSize.js";
import { drawFrame } from "../../physics/renderer.js";
import { usePhysicsWorld } from "../../physics/usePhysicsWorld.js";
import type { LinearIssue } from "../../types/linear.js";

interface PhysicsCanvasProps {
	issues: LinearIssue[];
	onSavedCountChange?: (count: number) => void;
}

export function PhysicsCanvas({
	issues,
	onSavedCountChange,
}: PhysicsCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const bounds = useCanvasSize(containerRef);
	const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
	const stackHeightRef = useRef(0);
	const [, setStackHeight] = useState(0);
	const scoredCardsRef = useRef(new Set<string>());
	// Track scored cards for fade-out animation: id -> { correct, timestamp }
	const scoredCardAnimRef = useRef(
		new Map<string, { correct: boolean; timestamp: number }>(),
	);

	// Camera state for pan/zoom
	const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
	const isPanningRef = useRef(false);
	const panStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

	// Pong paddle ref
	const paddleRef = useRef<Matter.Body | null>(null);
	// Pong cards that have been scored
	const pongScoredRef = useRef(new Set<string>());

	const { mode, score, bins, addScore, startTimer, stopGame, setBins } =
		useGameMode();

	const {
		cardsRef,
		dropCards,
		addCard,
		addBodies,
		removeCard,
		setGravity,
		engineRef,
	} = usePhysicsWorld(canvasEl, bounds);

	const avatarCache = useAvatarCache(issues);

	// Canvas ref callback
	const setCanvas = useCallback((el: HTMLCanvasElement | null) => {
		canvasRef.current = el;
		setCanvasEl(el);
	}, []);

	// Pong mouse tracking
	useEffect(() => {
		if (!canvasEl || mode !== "estimatePong") return;

		function onMouseMove(e: MouseEvent) {
			if (!paddleRef.current || !canvasEl) return;
			const rect = canvasEl.getBoundingClientRect();
			const mouseY = e.clientY - rect.top;
			updatePaddlePosition(paddleRef.current, mouseY);
		}

		canvasEl.addEventListener("mousemove", onMouseMove);
		return () => canvasEl.removeEventListener("mousemove", onMouseMove);
	}, [canvasEl, mode]);

	// Whack-a-Bug click handler — refs are read at event-time, not setup-time
	// biome-ignore lint/correctness/useExhaustiveDependencies: refs read inside event handler
	useEffect(() => {
		if (!canvasEl || mode !== "whackABug") return;

		function onClick(e: PointerEvent) {
			if (!canvasEl) return;
			const rect = canvasEl.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;

			// Hit-test against all cards
			for (const card of cardsRef.current) {
				if (scoredCardsRef.current.has(card.issue.id)) continue;
				const { position } = card.body;
				const hw = card.width / 2;
				const hh = card.height / 2;
				if (
					mx >= position.x - hw &&
					mx <= position.x + hw &&
					my >= position.y - hh &&
					my <= position.y + hh
				) {
					scoredCardsRef.current.add(card.issue.id);
					onCardSmashed(card, { addScore });
					removeCard(card.issue.id);
					break;
				}
			}
		}

		canvasEl.addEventListener("pointerdown", onClick);
		return () => canvasEl.removeEventListener("pointerdown", onClick);
	}, [canvasEl, mode, addScore, removeCard]);

	// Pan/zoom handlers for free play
	useEffect(() => {
		if (!canvasEl || mode !== "freePlay") return;

		function onWheel(e: WheelEvent) {
			if (!canvasEl) return;
			e.preventDefault();
			const cam = cameraRef.current;

			if (e.ctrlKey || e.metaKey) {
				const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
				const newZoom = Math.min(3, Math.max(0.3, cam.zoom * zoomDelta));
				const rect = canvasEl.getBoundingClientRect();
				const mx = e.clientX - rect.left;
				const my = e.clientY - rect.top;
				cam.x = mx - (mx - cam.x) * (newZoom / cam.zoom);
				cam.y = my - (my - cam.y) * (newZoom / cam.zoom);
				cam.zoom = newZoom;
			} else {
				cam.x -= e.deltaX;
				cam.y -= e.deltaY;
			}
		}

		function onMiddleDown(e: PointerEvent) {
			if (e.button !== 1 || !canvasEl) return;
			e.preventDefault();
			isPanningRef.current = true;
			panStartRef.current = {
				x: e.clientX,
				y: e.clientY,
				camX: cameraRef.current.x,
				camY: cameraRef.current.y,
			};
			canvasEl.setPointerCapture(e.pointerId);
		}

		function onMiddleMove(e: PointerEvent) {
			if (!isPanningRef.current) return;
			const cam = cameraRef.current;
			cam.x = panStartRef.current.camX + (e.clientX - panStartRef.current.x);
			cam.y = panStartRef.current.camY + (e.clientY - panStartRef.current.y);
		}

		function onMiddleUp(e: PointerEvent) {
			if (e.button !== 1) return;
			isPanningRef.current = false;
		}

		canvasEl.addEventListener("wheel", onWheel, { passive: false });
		canvasEl.addEventListener("pointerdown", onMiddleDown);
		canvasEl.addEventListener("pointermove", onMiddleMove);
		canvasEl.addEventListener("pointerup", onMiddleUp);

		return () => {
			canvasEl.removeEventListener("wheel", onWheel);
			canvasEl.removeEventListener("pointerdown", onMiddleDown);
			canvasEl.removeEventListener("pointermove", onMiddleMove);
			canvasEl.removeEventListener("pointerup", onMiddleUp);
		};
	}, [canvasEl, mode]);

	// Init game mode when issues or mode changes
	const cleanupRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		if (!canvasEl || issues.length === 0) return;

		const timer = setTimeout(() => {
			cleanupRef.current?.();
			scoredCardsRef.current.clear();
			scoredCardAnimRef.current.clear();
			pongScoredRef.current.clear();
			paddleRef.current = null;
			stackHeightRef.current = 0;

			switch (mode) {
				case "freePlay":
					initFreePlay(issues, { dropCards, setGravity });
					break;
				case "sortChallenge":
					cleanupRef.current = initSortChallenge(
						issues,
						bounds.width,
						bounds.height,
						{
							addCard,
							setGravity,
							startTimer,
							addScore,
							setBins,
							addBodies,
						},
					);
					break;
				case "stackAttack":
					cleanupRef.current = initStackAttack(issues, bounds.width, {
						addCard,
						setGravity,
					});
					break;
				case "whackABug":
					cleanupRef.current = initWhackABug(
						issues,
						bounds.width,
						bounds.height,
						{
							addCard,
							setGravity,
							startTimer,
							addScore,
							addBodies,
						},
					);
					break;
				case "estimatePong": {
					// Find paddle after init
					cleanupRef.current = initEstimatePong(
						issues,
						bounds.width,
						bounds.height,
						{
							addCard,
							setGravity,
							startTimer,
							addScore,
							addBodies,
						},
					);
					// Find paddle body in the world
					const engine = engineRef.current;
					if (engine) {
						const bodies = Matter.Composite.allBodies(engine.world);
						paddleRef.current =
							bodies.find((b) => b.label === PONG_PADDLE_LABEL) ?? null;
					}
					break;
				}
				case "priorityAvalanche":
					cleanupRef.current = initPriorityAvalanche(
						issues,
						bounds.width,
						bounds.height,
						{
							addCard,
							setGravity,
							startTimer,
							addScore,
							addBodies,
						},
					);
					break;
				case "sprintTetris":
					cleanupRef.current = initSprintTetris(
						issues,
						bounds.width,
						bounds.height,
						{
							addCard,
							setGravity,
							startTimer,
							addScore,
							addBodies,
						},
					);
					break;
				case "burndownBowling":
					cleanupRef.current = initBurndownBowling(
						issues,
						bounds.width,
						bounds.height,
						{
							addCard,
							setGravity,
							addScore,
							addBodies,
						},
					);
					break;
			}
		}, 100);

		return () => {
			clearTimeout(timer);
			cleanupRef.current?.();
		};
	}, [
		canvasEl,
		issues,
		mode,
		bounds.width,
		bounds.height,
		dropCards,
		addCard,
		addBodies,
		setGravity,
		startTimer,
		addScore,
		setBins,
		engineRef,
	]);

	// Draw loop
	useAnimationFrame(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = bounds.width;
		canvas.height = bounds.height;

		const cards = cardsRef.current;

		// ---- Sort Challenge scoring ----
		if (mode === "sortChallenge" && score.isRunning && bins.length > 0) {
			const now = performance.now();
			const FADE_DURATION_MS = 800;

			for (const card of cards) {
				if (scoredCardsRef.current.has(card.issue.id)) continue;
				if (hasCardCrossedDeadline(card, bounds.height)) {
					const result = checkCardInBin(card, bins, bounds.height);
					const correct = result?.correct ?? false;
					scoredCardsRef.current.add(card.issue.id);
					scoredCardAnimRef.current.set(card.issue.id, {
						correct,
						timestamp: now,
					});
					addScore(
						result
							? correct
								? SORT_CORRECT_POINTS
								: SORT_WRONG_POINTS
							: SORT_MISS_POINTS,
					);
					// Freeze the card in place
					Matter.Body.setStatic(card.body, true);
				}
			}

			// Remove cards whose fade animation has completed
			for (const [id, anim] of scoredCardAnimRef.current) {
				if (now - anim.timestamp > FADE_DURATION_MS) {
					scoredCardAnimRef.current.delete(id);
					removeCard(id);
				}
			}
		}

		// ---- Stack Attack scoring ----
		if (mode === "stackAttack") {
			const h = measureStackHeight(cards, bounds.height);
			stackHeightRef.current = Math.max(stackHeightRef.current, h);
			setStackHeight(stackHeightRef.current);
			if (cards.length > 0 && checkGameOver(cards, bounds.height)) {
				addScore(stackHeightRef.current);
				stopGame();
			}
		}

		// ---- Whack-a-Bug: apply pop velocity + check escaped cards ----
		if (mode === "whackABug" && score.isRunning) {
			for (const card of cards) {
				if (scoredCardsRef.current.has(card.issue.id)) continue;
				// Apply upward velocity to newly spawned cards sitting at the bottom
				if (
					card.body.velocity.x === 0 &&
					card.body.velocity.y === 0 &&
					card.body.position.y > bounds.height
				) {
					applyPopVelocity(card);
				}
				if (hasCardEscaped(card)) {
					scoredCardsRef.current.add(card.issue.id);
					onCardEscaped(card, { addScore });
					removeCard(card.issue.id);
				}
			}
		}

		// ---- Estimate Pong: check card hits/misses ----
		if (mode === "estimatePong" && score.isRunning) {
			for (const card of cards) {
				if (pongScoredRef.current.has(card.issue.id)) continue;

				// Apply velocity to newly added cards (frictionAir=0 cards)
				if (
					card.body.velocity.x === 0 &&
					card.body.velocity.y === 0 &&
					card.body.position.x > bounds.width - 100
				) {
					applyPongCardVelocity(card.body);
				}

				if (paddleRef.current && hasCardHitPaddle(card, paddleRef.current)) {
					pongScoredRef.current.add(card.issue.id);
					addScore(isHighEstimate(card.issue) ? 1 : -1);
				} else if (hasCardPassedPaddle(card)) {
					pongScoredRef.current.add(card.issue.id);
					addScore(isHighEstimate(card.issue) ? -1 : 1);
					removeCard(card.issue.id);
				}
			}
		}

		// ---- Priority Avalanche: count saved cards ----
		if (mode === "priorityAvalanche") {
			const saved = countSavedCards(cards, bounds.width);
			onSavedCountChange?.(saved);
		}

		// ---- Sprint Tetris: check row clears and game over ----
		if (mode === "sprintTetris" && score.isRunning) {
			const cleared = checkRowClear(cards, bounds.width, bounds.height);
			if (cleared.length > 0) {
				addScore(scoreClear(cleared.length));
				for (const id of cleared) {
					removeCard(id);
				}
			}
			if (hasReachedTop(cards)) {
				stopGame();
			}
		}

		// Apply camera transform for free play
		if (mode === "freePlay") {
			const cam = cameraRef.current;
			ctx.save();
			ctx.translate(cam.x, cam.y);
			ctx.scale(cam.zoom, cam.zoom);
		}

		drawFrame(
			ctx,
			cards,
			avatarCache,
			bins.length > 0 ? bins : undefined,
			scoredCardAnimRef.current.size > 0
				? scoredCardAnimRef.current
				: undefined,
		);

		if (mode === "freePlay") {
			ctx.restore();
		}
	});

	return (
		<div
			ref={containerRef}
			style={{ width: "100%", height: "100%", position: "relative" }}
		>
			<canvas
				ref={setCanvas}
				style={{ display: "block", width: "100%", height: "100%" }}
			/>
		</div>
	);
}
