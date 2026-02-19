import type { InventoryItem, Item } from "../../types/jrpg.js";

export const ITEMS: Record<string, Item> = {
	potion: {
		id: "potion",
		name: "Potion",
		description: "Restores 30 HP to one ally.",
		effect: "healHp",
		amount: 30,
	},
	ether: {
		id: "ether",
		name: "Ether",
		description: "Restores 20 MP to one ally.",
		effect: "restoreMp",
		amount: 20,
	},
};

export function getItem(id: string): Item {
	const item = ITEMS[id];
	if (!item) throw new Error(`Unknown item: ${id}`);
	return item;
}

/** Default starting inventory. */
export function createInventory(): InventoryItem[] {
	return [
		{ item: ITEMS.potion, count: 3 },
		{ item: ITEMS.ether, count: 2 },
	];
}
