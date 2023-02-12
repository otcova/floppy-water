export { createGame } from "./create";
export { stepGame as simulate } from "./step";

export type Vec2 = [number, number];

export enum Action {
	JUMP,
}

// export type Lake = [Vec2, Vec2, Vec2];
export interface Lakes {
	size: Vec2,
	resolution: number,
	bitmap: Uint8ClampedArray,
}

export interface PlayerMetadata {
	name: string,
	skin: number,
}

export interface Player {
	pos: Vec2,
	vel: Vec2,
	actions: Action[],
	metadata: PlayerMetadata,
}

export interface Camera {
	pos: Vec2,
	size: Vec2,
}

export interface Frame {
	camera: Camera,
	lakes: Lakes,
	players: Player[],
}
