import type { Element, ElementMatchup } from "../../types/jrpg.js";

/** Map Linear priority (0-4) to an element. */
export function priorityToElement(priority: number): Element {
	switch (priority) {
		case 1:
			return "fire"; // Urgent
		case 2:
			return "ice"; // High
		case 3:
			return "thunder"; // Normal
		case 4:
			return "water"; // Low
		default:
			return "void"; // None (0)
	}
}

/** Weakness cycle: Fire<Water, Water<Thunder, Thunder<Ice, Ice<Fire */
const WEAKNESS_MAP: Record<Element, Element | null> = {
	fire: "water",
	water: "thunder",
	thunder: "ice",
	ice: "fire",
	void: null,
};

/** Resistance: each element resists the one it's weak to in reverse. */
const RESISTANCE_MAP: Record<Element, Element | null> = {
	fire: "ice",
	ice: "thunder",
	thunder: "water",
	water: "fire",
	void: null,
};

export function getWeakness(element: Element): Element | null {
	return WEAKNESS_MAP[element];
}

export function getResistance(element: Element): Element | null {
	return RESISTANCE_MAP[element];
}

/** Check how an attacking element fares against a defending element. */
export function checkElementMatchup(
	attackElement: Element | null,
	defenderElement: Element,
): ElementMatchup {
	if (
		!attackElement ||
		attackElement === "void" ||
		defenderElement === "void"
	) {
		return "neutral";
	}
	if (WEAKNESS_MAP[defenderElement] === attackElement) {
		return "weak";
	}
	if (RESISTANCE_MAP[defenderElement] === attackElement) {
		return "resist";
	}
	return "neutral";
}

/** Colors for rendering element indicators. */
export const ELEMENT_COLORS: Record<Element, string> = {
	fire: "#ef4444",
	ice: "#60a5fa",
	thunder: "#facc15",
	water: "#3b82f6",
	void: "#a78bfa",
};

/** Display labels for elements. */
export const ELEMENT_LABELS: Record<Element, string> = {
	fire: "Fire",
	ice: "Ice",
	thunder: "Thunder",
	water: "Water",
	void: "Void",
};

/** Unicode symbols for elements. */
export const ELEMENT_SYMBOLS: Record<Element, string> = {
	fire: "\u2668", // hot springs / flame
	ice: "\u2744", // snowflake
	thunder: "\u26A1", // lightning
	water: "\u2248", // waves
	void: "\u2734", // star
};
