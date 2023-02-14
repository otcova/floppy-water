import Alea from "alea";

export function mod(n: number, base: number) {
	return (n % base + base) % base;
}

let aleaRandom = Alea();

export function setRandomSeed(seed: number) {
	aleaRandom = Alea(seed);
}

// max is not inclusive (min is inclusive)
export function random(max = 1, min = 0) {
	return aleaRandom() * (max - min) + min;
}

// max is not inclusive (min is inclusive)
export function randomInt(max = 1, min = 0) {
	return Math.trunc(random(max, min));
}

export function normalize([x, y]: [number, number]): [number, number] {
	const h = Math.hypot(x, y);
	return [x / h, y / h];
}

export const atan2 = Math.atan2;
export const sin = Math.sin;
export const cos = Math.cos;

export const PI = Math.PI;
export const PI2 = Math.PI * 2;