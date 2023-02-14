import { PI2, random } from "../utils";
import { BlockType, type Block, type Camera, type Frame, type PlayerMetadata, type Vec2 } from "./main";

export function createFrame(playersMetadata: PlayerMetadata[]): Frame {
	const arenaSize: Vec2 = [100, 55];
	return {
		tps: 120,
		frameCount: 1,
		camera: {
			pos: [0, 0],
			size: [arenaSize[0] * 1.0, arenaSize[1] * 1.0],
		},
		lake: {
			size: arenaSize,
			seed: 1, //Math.floor(random() * 1e9),
		},
		players: new Map(playersMetadata.map(metadata => {
			return [metadata.id, {
				pos: [0, -20],
				vel: [0, 0],
				dashCharge: 2,
				angle: PI2 * random(),
				angleVel: random(),
				actions: new Set(),
				metadata,
			}];
		})),
		blocks: createBlocks(arenaSize),
	};
}

function createBlocks(arenaSize: Vec2): Block[] {
	const blocks: Block[] = [];

	const block: Block = {
		pos: [random() * arenaSize[0], random() * arenaSize[1]],
		type: Math.trunc(random() * BlockType.length),
	};

	blocks.push(block);

	return blocks;
}