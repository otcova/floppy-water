import { PI2, random, randomInt, setRandomSeed } from "../utils";
import { sizeOfBlock, BlockType, type Block, type Camera, type Frame, type PlayerMetadata, type Vec2 } from "./main";

export function createFrame(playersMetadata: PlayerMetadata[]): Frame {
	const arenaSize: Vec2 = [100, 55];
	const seed = randomInt(46656);
	console.log("Map Name:", seed.toString(36).toUpperCase());
	setRandomSeed(seed);

	return {
		tps: 120,
		frameCount: 1,
		camera: {
			pos: [0, 0],
			size: [arenaSize[0] * 1.0, arenaSize[1] * 1.0],
		},
		lake: {
			size: arenaSize,
			seed,
		},
		players: new Map(playersMetadata.map(metadata => {
			return [metadata.id, {
				metadata,
				pos: [0, -20],
				vel: [0, 0],
				angle: random(PI2),
				angleVel: random(),
				dashCharge: 2,
				dashDelayed: null,
				dash: [0, 0],
				move: [0, 0],
			}];
		})),
		blocks: createBlocks(arenaSize),
	};
}

function createBlocks(arenaSize: Vec2): Block[] {
	const blocks: Block[] = [];

	let trys = randomInt(5, 3);
	if (random() < 0.1) trys *= 5;

	CREATE_BLOCK: for (let i = 0; i < trys; ++i) {
		const block: Block = {
			pos: [random(arenaSize[0]), random(arenaSize[1])],
			type: randomInt(0, BlockType.length),
			angle: random(PI2),
		};

		// Check if 'block' can colide with other blocks
		const blockRadius = Math.hypot(...sizeOfBlock(block.type)) / 2;
		for (const { pos, type } of blocks) {
			const minDist = blockRadius + Math.hypot(...sizeOfBlock(type)) / 2;
			for (let y = -1; y <= 1; ++y) {
				for (let x = -1; x <= 1; ++x) {
					const dx = x * arenaSize[0] + block.pos[0] - pos[0];
					const dy = y * arenaSize[1] + block.pos[1] - pos[1];
					if (minDist ** 2 > dx ** 2 + dy ** 2) {
						continue CREATE_BLOCK;
					}
				}
			}
		}

		blocks.push(block);
	}

	return blocks;
}