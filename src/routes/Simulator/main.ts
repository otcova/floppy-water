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
	SQUARE2,
	RECTANGLE,
	RECTANGLE2,
	length,
}

export interface Block {
	pos: Vec2,
	angle: number,
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

export function sizeOfBlock(blockType: BlockType): Vec2 {
	const size = 8;
	switch (blockType) {
		case BlockType.SQUARE: return [size, size];
		case BlockType.SQUARE2: return [size, size];
		case BlockType.RECTANGLE: return [size * 3 / 2, size];
		case BlockType.RECTANGLE2: return [size * 4 / 2, size];
		default: return [0, 0];
	}
}

export function isDiagonal(dir: Dir2): boolean {
	return dir[0] != 0 && dir[1] != 0;
}

export function isZero(dir: Dir2): boolean {
	return dir[0] == 0 && dir[1] == 0;
}
