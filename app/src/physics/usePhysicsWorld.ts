import Matter from "matter-js";
import { useCallback, useEffect, useRef } from "react";
import { CARD_DROP_STAGGER_MS } from "../config/constants.js";
import type { LinearIssue } from "../types/linear.js";
import type { PhysicsCard, WorldBounds } from "../types/physics.js";
import { createCardBody } from "./cardBody.js";
import {
	createEngine,
	createMouseConstraint,
	createWalls,
	removeWalls,
} from "./engine.js";

export function usePhysicsWorld(
	canvas: HTMLCanvasElement | null,
	bounds: WorldBounds,
) {
	const engineRef = useRef<Matter.Engine | null>(null);
	const runnerRef = useRef<Matter.Runner | null>(null);
	const wallsRef = useRef<Matter.Body[]>([]);
	const cardsRef = useRef<PhysicsCard[]>([]);
	const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);

	// Initialize engine
	useEffect(() => {
		if (!canvas) return;

		const engine = createEngine();
		engineRef.current = engine;

		const walls = createWalls(engine.world, bounds);
		wallsRef.current = walls;

		const mc = createMouseConstraint(engine, canvas);
		mouseConstraintRef.current = mc;

		const runner = Matter.Runner.create();
		Matter.Runner.run(runner, engine);
		runnerRef.current = runner;

		return () => {
			Matter.Runner.stop(runner);
			Matter.World.clear(engine.world, false);
			Matter.Engine.clear(engine);
			runnerRef.current = null;
			engineRef.current = null;
			mouseConstraintRef.current = null;
			cardsRef.current = [];
			wallsRef.current = [];
		};
	}, [canvas, bounds]);

	// Update walls on resize
	useEffect(() => {
		const engine = engineRef.current;
		if (!engine) return;

		removeWalls(engine.world, wallsRef.current);
		const newWalls = createWalls(engine.world, bounds);
		wallsRef.current = newWalls;
	}, [bounds]);

	const dropCards = useCallback(
		(issues: LinearIssue[]) => {
			const engine = engineRef.current;
			if (!engine) return;

			// Clear existing cards
			for (const card of cardsRef.current) {
				Matter.Composite.remove(engine.world, card.body);
			}
			cardsRef.current = [];

			// Drop cards with stagger
			issues.forEach((issue, i) => {
				setTimeout(() => {
					if (!engineRef.current) return;
					const x = Math.random() * (bounds.width - 200) + 100;
					const y = -50 - Math.random() * 100;
					const card = createCardBody(issue, x, y);
					Matter.Composite.add(engineRef.current.world, card.body);
					cardsRef.current = [...cardsRef.current, card];
				}, i * CARD_DROP_STAGGER_MS);
			});
		},
		[bounds.width],
	);

	const addCard = useCallback(
		(issue: LinearIssue, x?: number, y?: number) => {
			const engine = engineRef.current;
			if (!engine) return;

			const posX = x ?? Math.random() * (bounds.width - 200) + 100;
			const posY = y ?? -50;
			const card = createCardBody(issue, posX, posY);
			Matter.Composite.add(engine.world, card.body);
			cardsRef.current = [...cardsRef.current, card];
		},
		[bounds.width],
	);

	const setGravity = useCallback((y: number) => {
		const engine = engineRef.current;
		if (!engine) return;
		engine.gravity.y = y;
	}, []);

	const addBodies = useCallback((bodies: Matter.Body[]) => {
		const engine = engineRef.current;
		if (!engine) return;
		Matter.Composite.add(engine.world, bodies);
	}, []);

	const removeCard = useCallback((cardId: string) => {
		const engine = engineRef.current;
		if (!engine) return;
		const idx = cardsRef.current.findIndex((c) => c.issue.id === cardId);
		if (idx !== -1) {
			Matter.Composite.remove(engine.world, cardsRef.current[idx].body);
			cardsRef.current = cardsRef.current.filter((_, i) => i !== idx);
		}
	}, []);

	return {
		engineRef,
		cardsRef,
		dropCards,
		addCard,
		addBodies,
		removeCard,
		setGravity,
	};
}
