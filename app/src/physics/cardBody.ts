import Matter from "matter-js";
import { PHYSICS, cardSize } from "../config/constants.js";
import type { LinearIssue } from "../types/linear.js";
import type { PhysicsCard } from "../types/physics.js";

export function createCardBody(
	issue: LinearIssue,
	x: number,
	y: number,
): PhysicsCard {
	const { width, height } = cardSize(issue.estimate);

	const body = Matter.Bodies.rectangle(x, y, width, height, {
		restitution: PHYSICS.restitution,
		friction: PHYSICS.friction,
		frictionAir: PHYSICS.frictionAir,
		density: PHYSICS.density,
		chamfer: { radius: 6 },
		label: `card-${issue.id}`,
	});

	return { body, issue, width, height };
}
