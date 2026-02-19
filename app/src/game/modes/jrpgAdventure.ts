/**
 * Backward-compatibility re-exports.
 * All JRPG logic now lives in game/jrpg/*.
 */
export { createEnemy } from "../jrpg/enemy.js";
export { createParty } from "../jrpg/party.js";
export type {
	EnemyStats,
	PartyMember,
	BattleState,
	BattleAction,
} from "../../types/jrpg.js";
