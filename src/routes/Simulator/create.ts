import type { Camera, Frame, Lakes, PlayerMetadata, Vec2 } from "./main";
import { createNoise2D, createNoise3D, createNoise4D } from "simplex-noise";
import concaveHull from "concaveman";
import earcut from "earcut";

export function createGame(playersMetadata: PlayerMetadata[]): Frame {
	const camera: Camera = {
		pos: [0, 0],
		size: [100, 55],
	};
	return {
		camera,
		lakes: createLakes(...camera.size),
		players: playersMetadata.map(metadata => {
			return {
				pos: [0, 0],
				vel: [0, 0],
				actions: [],
				metadata,
			};
		}),
	};
}

// function createLakes(arenaWidth: number, arenaHeight: number): Lake[] {
// 	const lakes: Lake[] = [];
// 	const noiseResolution = 10;
// 	const noiseSize = 0.04;

// 	const meshW = arenaWidth * noiseResolution;
// 	const meshH = arenaHeight * noiseResolution;

// 	const noiseFn = tilableNoise[Math.floor(Math.random() * tilableNoise.length)];
// 	const mesh = noiseFn(meshW, meshH, noiseSize / noiseResolution);

// 	let noiseSum = 0;
// 	for (let i = 0; i < mesh.length; ++i) noiseSum += mesh[i];
// 	const noiseStep = (noiseSum / mesh.length) * 1.8;

// 	for (let y = 0; y < meshH; ++y) {
// 		for (let x = 0; x < meshW; ++x) {
// 			let lake = selectLake(x, y);
// 			if (lake.length > 50 * noiseResolution) {
// 				lake = concaveHull(lake, 1, 2) as Vec2[];
// 				mergeVeritices(lake);
// 				if (lake.length > 3) {
// 					const indices = earcut(lake.flat())
// 					for (let i = 0; i < indices.length; i += 3) {
// 						lakes.push([lake[indices[i]], lake[indices[i + 1]], lake[indices[i + 2]]]);
// 					}
// 				}
// 			}
// 		}
// 	}

// 	if (lakes.length < 0) return createLakes(arenaWidth, arenaHeight);
// 	return lakes;

// 	function selectLake(x: number, y: number) {
// 		const island: Vec2[] = [];

// 		const toVisit: Vec2[] = [[x, y]]


// 		while (toVisit.length > 0) {
// 			const [x, y] = toVisit.pop() as Vec2;
// 			if (mesh[x + y * meshW] <= noiseStep || x < 0 || meshW <= x || y < 0 || meshH <= y) continue;
// 			mesh[x + y * meshW] = 0;
// 			island.push([x / noiseResolution - arenaWidth / 2, y / noiseResolution - arenaHeight / 2]);

// 			for (let dx = -1; dx <= 1; ++dx) {
// 				for (let dy = -1; dy <= 1; ++dy) {
// 					toVisit.push([x + dx, y + dy]);
// 				}
// 			}
// 		}

// 		return island;
// 	}

// 	function mergeVeritices(vertices: Vec2[]) {
// 		for (let i = 1; i < vertices.length; ++i) {
// 			const a = vertices[i - 1];
// 			const b = vertices[i];

// 			if ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 < .5 ** 2) {
// 				vertices.splice(i, 1);
// 				--i;
// 			}
// 		}
// 	}
// }

function createLakes(width: number, height: number): Lakes {
	const resolution = 20;
	const noiseScale = 0.02 / resolution;

	const noiseFn = tilableNoise[Math.floor(Math.random() * tilableNoise.length)];
	
	const bitmap = noiseFn(width * resolution, height * resolution, noiseScale);
	
	let noiseSum = 0;
	for (let i = 0; i < bitmap.length; ++i) noiseSum += bitmap[i];
	const noiseStep = (noiseSum / bitmap.length) * 1.2;
	
	
	for (let i = 0; i < bitmap.length; ++i) {
		if (bitmap[i] < noiseStep) bitmap[i] = 0;
		// bitmap[i] = bitmap[i] > noiseStep ? 255 : 0;
	}

	return {
		size: [width, height],
		resolution,
		bitmap,
	}
}

const tilableNoise = [
	function (width: number, height: number, noiseScale: number) {
		const noise = createNoise2D();
		const mesh = new Uint8ClampedArray(width * height);

		for (let y = 0; y < height; ++y) {
			for (let x = 0; x < width; ++x) {
				const n = 255 * noise(
					(x > width / 2 ? x : width - x) * noiseScale,
					(y > height / 2 ? y : height - y) * noiseScale,
				);

				mesh[x + y * width] = n;
			}
		}
		return mesh;
	},
	function (width: number, height: number, noiseScale: number) {
		const noise = createNoise3D();
		const mesh = new Uint8ClampedArray(width * height);

		for (let y = 0; y < height; ++y) {
			for (let x = 0; x < width; ++x) {
				const a = 2 * Math.PI * x / width;
				const b = 2 * Math.PI * y / height;
				const n = 255 * noise(
					0.12 * noiseScale * width * (1 + Math.cos(a)),
					0.12 * noiseScale * (width * (1 + Math.sin(a)) + height * (1 + Math.cos(b))),
					0.12 * noiseScale * height * (1 + Math.sin(b)),
				);

				mesh[x + y * width] = n;
			}
		}

		return mesh;
	},

	function (width: number, height: number, noiseScale: number) {
		const noise = createNoise4D();
		const mesh = new Uint8ClampedArray(width * height);

		for (let y = 0; y < height; ++y) {
			for (let x = 0; x < width; ++x) {
				const a = 2 * Math.PI * x / width;
				const b = 2 * Math.PI * y / height;
				const n = 255 * noise(
					0.2 * noiseScale * width * (1 + Math.cos(a)),
					0.2 * noiseScale * width * (1 + Math.sin(a)),
					0.2 * noiseScale * height * (1 + Math.cos(b)),
					0.2 * noiseScale * height * (1 + Math.sin(b)),
				);

				mesh[x + y * width] = n;
			}
		}

		return mesh;
	},

];