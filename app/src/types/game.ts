export type GameMode =
	| "freePlay"
	| "sortChallenge"
	| "stackAttack"
	| "whackABug"
	| "estimatePong"
	| "priorityAvalanche"
	| "sprintTetris"
	| "burndownBowling"
	| "jrpgAdventure";

export interface ScoreState {
	score: number;
	timeRemaining: number;
	isRunning: boolean;
}

export interface SortBin {
	label: string;
	priority: number;
	x: number;
	width: number;
	color: string;
}
