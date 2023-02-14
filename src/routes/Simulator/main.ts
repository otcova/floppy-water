export { createFrame as createGame } from "./create";
export { stepGame as simulate } from "./step";

export type PlayerId = string;

export type Vec2 = [number, number];

export enum Action {
	MOVE_W = 0,
	MOVE_A,
	MOVE_S,
	MOVE_D,
	
	STOP_W,
	STOP_A,
	STOP_S,
	STOP_D,
	
	DASH_W,
	DASH_A,
	DASH_S,
	DASH_D,
};

export interface Lakes {
	size: Vec2,
	seed: number,
}

export interface PlayerMetadata {
	id: string,
	name: string,
	skin: number,
}

export interface Player {
	pos: Vec2,
	vel: Vec2,
	angle: number,
	angleVel: number,
	dashCharge: number,
	actions: Set<Action>,
	metadata: PlayerMetadata,
}

export interface Camera {
	pos: Vec2,
	size: Vec2,
}

export interface Frame {
	tps: number,
	frameCount: number,
	camera: Camera,
	lake: Lakes,
	players: Map<string, Player>,
}
