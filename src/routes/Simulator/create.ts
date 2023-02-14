import type { Camera, Frame, PlayerMetadata } from "./main";

export function createFrame(playersMetadata: PlayerMetadata[]): Frame {
	const camera: Camera = {
		pos: [0, 0],
		size: [100*1.0, 55*1.0],
	};
	return {
		tps: 120,
		frameCount: 1,
		camera,
		lake: {
			size: camera.size,
			seed: Math.floor(Math.random() * 1e9),
		},
		players: new Map(playersMetadata.map(metadata => {
			return [metadata.id, {
				pos: [0, -20],
				vel: [0, 0],
				dashCharge: 2,
				angle: 2 * Math.PI * Math.random(),
				angleVel: Math.random(),
				actions: new Set(),
				metadata,
			}];
		})),
	};
}