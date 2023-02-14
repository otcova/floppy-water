import { createNoise2D } from "simplex-noise";
import { createLakeFn } from "../Simulator/lake";
import type { Frame, Vec2 } from "../Simulator/main";

const noise = createNoise2D();

export function createCanvas(container: HTMLElement) {
	const canvas = document.createElement("canvas");
	canvas.width = container.offsetWidth;
	canvas.height = container.offsetHeight;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	container.appendChild(canvas);

	return ctx;
}

function color(r: number, g: number, b: number, a?: number) {
	const hex = (n: number) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, "0");
	let c = "#" + hex(r) + hex(g) + hex(b)
	if (a) c += hex(a);
	return c;
}

const colors = {
	background: color(6, 10, 15),
	// water: color(12, 21, 36, 255 / 2),
	water: color(4 * 12, 4 * 21, 4 * 36, 255 / 1),
	block: [color(38, 52, 66), color(17, 28, 41)],
	purple: [color(124, 120, 208), color(81, 77, 171), color(45, 45, 113)],
	red: color(221, 41, 92),
	blue: [color(57, 178, 182), color(22, 121, 139)],
	black: color(7, 9, 23),
	white: color(230, 230, 230),
	gray: [color(61, 74, 92), color(104, 117, 133)],
}

interface Particle {
	spawnTime: number,
	lifeSpan: number,
	pos: Vec2,
	vel: Vec2,
	angle: number,
	size: Vec2,
}


interface Cache {
	lake: {
		img: null | HTMLImageElement,
		fn: null | ((pos: Vec2) => number),
		seed: number,
	},
	waterParticles: Particle[],
	pastRenderedFrameTime: number,
}

const cache: Cache = {
	lake: {
		img: null,
		fn: null,
		seed: -1,
	},
	waterParticles: [],
	pastRenderedFrameTime: 0,
};

export function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame) {
	const time = performance.now() / 1000;
	const deltaTime = time - cache.pastRenderedFrameTime;
	cache.pastRenderedFrameTime = time;

	const canvas = ctx.canvas;
	const arenaWidth = frame.camera.size[0], arenaHeight = frame.camera.size[1];

	ctx.resetTransform();

	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.translate(canvas.width / 2, canvas.height / 2);
	const scale = Math.max(canvas.width / arenaWidth, canvas.height / arenaHeight);
	ctx.scale(scale, scale);

	// --------------  Draw Lakes  -------------------------------------

	const updateLake = cache.lake.seed != frame.lake.seed;
	if (updateLake) cache.lake.seed = frame.lake.seed;

	if (updateLake || cache.lake.fn == null) {
		cache.lake.fn = createLakeFn(frame.lake.size, frame.lake.seed);
	}

	if (updateLake || cache.lake.img == null) {
		const canvas = document.createElement('canvas');
		const resolution = Math.ceil(Math.max(
			innerWidth / frame.lake.size[0],
			innerHeight / frame.lake.size[1],
		));
		canvas.width = frame.lake.size[0] * resolution;
		canvas.height = frame.lake.size[1] * resolution;
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

		var idata = ctx.createImageData(canvas.width, canvas.height);

		for (let y = 0; y < idata.height; ++y) {
			for (let x = 0; x < idata.width; ++x) {
				let a = cache.lake.fn([x / resolution, y / resolution]);
				if (a != 0) a = 255 * (a + 0.1);

				idata.data[(x + y * idata.width) * 4] = 4 * 12;
				idata.data[(x + y * idata.width) * 4 + 1] = 4 * 21;
				idata.data[(x + y * idata.width) * 4 + 2] = 4 * 36;
				idata.data[(x + y * idata.width) * 4 + 3] = a;
			}
		}

		ctx.putImageData(idata, 0, 0);

		cache.lake.img = new Image();
		cache.lake.img.src = canvas.toDataURL();
	}


	const size = frame.lake.size;
	ctx.drawImage(cache.lake.img, 0, 0, size[0], size[1]);
	ctx.drawImage(cache.lake.img, -size[0], 0, size[0], size[1]);
	ctx.drawImage(cache.lake.img, 0, -size[1], size[0], size[1]);
	ctx.drawImage(cache.lake.img, -size[0], -size[1], size[0], size[1]);


	// --------------  Water Particles  -------------------------------------

	// Spawn particles
	for (const [id, player] of frame.players) {
		const particlesPerSecond = 20;

		const inWater = cache.lake.fn(player.pos) > 0;
		const speed = Math.hypot(...player.vel);

		const size = 0.5 + Math.random() * 0.6;

		if (inWater && Math.random() < deltaTime * particlesPerSecond * (1 + speed)) {
			cache.waterParticles.push({
				pos: [player.pos[0] + (Math.random() - 0.5) * 0.7, player.pos[1] + (Math.random() - 0.5) * 0.7],
				vel: [(Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05],
				size: [size, size],
				spawnTime: time,
				lifeSpan: 0.3 + Math.random() * 0.8,
				angle: 2 * Math.PI * Math.random(),
			});
		}
	}



	for (let i = 0; i < cache.waterParticles.length; ++i) {
		const { pos, vel, size, spawnTime, lifeSpan, angle } = cache.waterParticles[i];

		// Delete particles
		if (time - spawnTime > lifeSpan) {
			cache.waterParticles.splice(i, 1);
			--i;
			continue;
		}

		// Move particles
		pos[0] += vel[0];
		pos[1] += vel[1];

		size[0] -= 0.02;
		size[1] -= 0.02;

		// Draw particles
		const transform = ctx.getTransform();

		ctx.translate(...pos);
		ctx.rotate(angle);

		const alpha = 255 * (1 - (time - spawnTime) / lifeSpan);
		ctx.fillStyle = colors.blue[1] + Math.floor(alpha).toString(16).padStart(2, '0');
		ctx.fillRect(- size[0] / 2, - size[1] / 2, ...size);

		ctx.setTransform(transform);
	}


	// --------------  Draw Players  -------------------------------------


	for (const [id, player] of frame.players) {

		// const angle = Math.atan2(player.vel[1], player.vel[0]) || 0;
		const angle = player.angle;
		const b = 0;//noise(0, t/6);
		const c = 0;//noise(10, t/4);


		const transform = ctx.getTransform();

		ctx.translate(...player.pos);

		ctx.rotate(angle - Math.PI / 4);

		ctx.fillStyle = colors.white;
		ctx.fillRect(- 0.5, - 0.5, 1, 1);
		ctx.fillStyle = colors.black;

		const s = 0.4;
		const d = b * 0.1 + 0.2;
		ctx.rotate(c);
		ctx.fillRect(d - s / 2, d - s / 2, s, s);

		ctx.setTransform(transform);
	}

}
