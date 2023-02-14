import { createNoise2D, createNoise3D, createNoise4D, type RandomFn } from "simplex-noise";
import alea from "alea";
import type { Vec2 } from "./main";

export function createLakeFn(size: Vec2, seed: number): (pos: Vec2) => number {
	const noise = createTilableNoise(size, seed);

	let sum = 0, count = 0;

	for (let y = 0; y <= 1; y += 0.1) {
		for (let x = 0; x <= 1; x += 0.1) {
			sum += noise([size[0] * x, size[1] * y]);
			++count;
		}
	}

	const step = (sum / count) + 0.3;

	return (pos: Vec2) => Math.max(0, noise(pos) - step) / (1 - step);
}

function createTilableNoise(size: Vec2, seed: number): (pos: Vec2) => number {
	seed = Math.abs(Math.floor(seed));
	return tilableNoise[seed % tilableNoise.length](size, alea(seed));
}

const noiseScale = 0.03;

const tilableNoise = [
	function (size: Vec2, randomFn?: RandomFn) {
		const noise = createNoise2D(randomFn);
		return (pos: Vec2) => {
			const x = (pos[0] % size[0] + size[0]) % size[0];
			const y = (pos[1] % size[1] + size[1]) % size[1];

			return noise(
				(x > size[0] / 2 ? x : size[0] - x) * noiseScale,
				(y > size[1] / 2 ? y : size[1] - y) * noiseScale,
			);
		};
	},
	function (size: Vec2, randomFn?: RandomFn) {
		const noise = createNoise3D(randomFn);

		return (pos: Vec2) => {
			const a = 2 * Math.PI * pos[0] / size[0];
			const b = 2 * Math.PI * pos[1] / size[1];

			return noise(
				0.12 * noiseScale * size[0] * (1 + Math.cos(a)),
				0.12 * noiseScale * (size[0] * (1 + Math.sin(a)) + size[1] * (1 + Math.cos(b))),
				0.12 * noiseScale * size[1] * (1 + Math.sin(b)),
			);
		}
	},

	function (size: Vec2, randomFn?: RandomFn) {
		const noise = createNoise4D(randomFn);

		return (pos: Vec2) => {
			const a = 2 * Math.PI * pos[0] / size[0];
			const b = 2 * Math.PI * pos[1] / size[1];

			return noise(
				0.2 * noiseScale * size[0] * (1 + Math.cos(a)),
				0.2 * noiseScale * size[0] * (1 + Math.sin(a)),
				0.2 * noiseScale * size[1] * (1 + Math.cos(b)),
				0.2 * noiseScale * size[1] * (1 + Math.sin(b)),
			);
		}
	},

	function (size: Vec2, randomFn?: RandomFn) {
		const noise = createNoise3D(randomFn);
		
		return (pos: Vec2) => {
			const a = 2 * Math.PI * pos[0] / size[0];
			const b = 2 * Math.PI * pos[1] / size[1];

			return 0.7 * noise(
				0.3 * noiseScale * size[0] * (1 + Math.cos(a)),
				0.3 * noiseScale * (size[0] * (1 + Math.sin(a)) + size[1] * (1 + Math.cos(b))),
				0.3 * noiseScale * size[1] * (1 + Math.sin(b)),
			);
		}
	},

	function (size: Vec2, randomFn?: RandomFn) {
		const noise = createNoise4D(randomFn);
		return (pos: Vec2) => {
			const a = 2 * Math.PI * pos[0] / size[0];
			const b = 2 * Math.PI * pos[1] / size[1];

			return 1.3 * noise(
				0.08 * noiseScale * size[0] * (1 + Math.cos(a)),
				0.08 * noiseScale * size[0] * (1 + Math.sin(a)),
				0.08 * noiseScale * size[1] * (1 + Math.cos(b)),
				0.08 * noiseScale * size[1] * (1 + Math.sin(b)),
			);
		}
	},
];