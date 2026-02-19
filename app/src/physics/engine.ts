import Matter from "matter-js";
import { PHYSICS } from "../config/constants.js";
import type { WorldBounds } from "../types/physics.js";

const WALL_THICKNESS = 60;

export function createEngine() {
	const engine = Matter.Engine.create({
		gravity: PHYSICS.gravity,
	});
	return engine;
}

export function createWalls(
	world: Matter.World,
	bounds: WorldBounds,
): Matter.Body[] {
	const { width, height } = bounds;

	const floor = Matter.Bodies.rectangle(
		width / 2,
		height + WALL_THICKNESS / 2,
		width + WALL_THICKNESS * 2,
		WALL_THICKNESS,
		{ isStatic: true, label: "wall-floor" },
	);

	const leftWall = Matter.Bodies.rectangle(
		-WALL_THICKNESS / 2,
		height / 2,
		WALL_THICKNESS,
		height * 2,
		{ isStatic: true, label: "wall-left" },
	);

	const rightWall = Matter.Bodies.rectangle(
		width + WALL_THICKNESS / 2,
		height / 2,
		WALL_THICKNESS,
		height * 2,
		{ isStatic: true, label: "wall-right" },
	);

	const walls = [floor, leftWall, rightWall];
	Matter.Composite.add(world, walls);
	return walls;
}

export function removeWalls(world: Matter.World, walls: Matter.Body[]): void {
	for (const wall of walls) {
		Matter.Composite.remove(world, wall);
	}
}

export function createMouseConstraint(
	engine: Matter.Engine,
	canvas: HTMLCanvasElement,
): Matter.MouseConstraint {
	const mouse = Matter.Mouse.create(canvas);
	const mouseConstraint = Matter.MouseConstraint.create(engine, {
		mouse,
		constraint: {
			stiffness: PHYSICS.mouse.stiffness,
			damping: PHYSICS.mouse.damping,
			render: { visible: false },
		},
	});

	Matter.Composite.add(engine.world, mouseConstraint);
	return mouseConstraint;
}
