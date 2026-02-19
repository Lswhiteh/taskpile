import type Matter from "matter-js";
import type { LinearIssue } from "./linear.js";

export interface PhysicsCard {
	body: Matter.Body;
	issue: LinearIssue;
	width: number;
	height: number;
}

export interface WorldBounds {
	width: number;
	height: number;
}
