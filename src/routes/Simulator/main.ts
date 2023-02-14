export { createFrame as createGame } from "./create";
export { stepGame as simulate } from "./step";

export type PlayerId = string;

export type Vec2 = [number, number];
export type Dir2 = [-1 | 0 | 1, -1 | 0 | 1];

export interface Lakes {
	size: Vec2,
	seed: number,
}

// Player data that is independent of the current game. 
export interface PlayerMetadata {
	id: string,
	name: string,
	skin: number,
}

export interface Player {
	metadata: PlayerMetadata,
	pos: Vec2,
	vel: Vec2,
	angle: number,
	angleVel: number,
	dashCharge: number,
	dashDelayed: null | {
		dir: Dir2,
		frames: number,
	},
	dash: Dir2,
	move: Dir2,
}

export interface Camera {
	pos: Vec2,
	size: Vec2,
}

export enum BlockType {
	SQUARE = 0,
	length,
}

export interface Block {
	pos: Vec2,
	type: BlockType,
}

export interface Frame {
	tps: number,
	frameCount: number,
	camera: Camera,
	lake: Lakes,
	players: Map<string, Player>,
	blocks: Block[],
}

export function blockSize(blockType: BlockType): Vec2 {
	switch (blockType) {
		case BlockType.SQUARE: return [10, 10];
		default: return [0, 0];
	}
}

export function isDiagonal(dir: Dir2): boolean {
	return dir[0] != 0 && dir[1] != 0;
}

export function isZero(dir: Dir2): boolean {
	return dir[0] == 0 && dir[1] == 0;
}
