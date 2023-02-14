export function mod(n: number, base: number) {
	return (n % base + base) % base;
}

export function random(min = 0, max = 1) {
	return Math.random() * (max - min) + min;
}

export const atan2 = Math.atan2;
export const sin = Math.sin;
export const cos = Math.cos;

export const PI = Math.PI;
export const PI2 = Math.PI * 2;