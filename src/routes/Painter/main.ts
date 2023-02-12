import { createNoise2D } from "simplex-noise";
import type { Frame } from "../Simulator/main";

const noise = createNoise2D();

export function createCanvas(container: HTMLDivElement): CanvasRenderingContext2D | null {
	const canvas = document.createElement("canvas");
	canvas.width = container.offsetWidth;
	canvas.height = container.offsetHeight;
	const ctx = canvas.getContext("2d");

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

interface Cache {
	lakes: {
		img: null | HTMLImageElement,
	}
}

const cache: Cache = {
	lakes: {
		img: null
	}
};

export function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame) {
	const t = performance.now() / 1000;
	const canvas = ctx.canvas;
	const arenaWidth = frame.camera.size[0], arenaHeight = frame.camera.size[1];

	ctx.resetTransform();

	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.translate(canvas.width / 2, canvas.height / 2);
	const scale = Math.max(canvas.width / arenaWidth, canvas.height / arenaHeight);
	ctx.scale(scale, scale);


	// Camera frame
	// ctx.strokeStyle = colors.gray[0];
	// ctx.strokeRect(arenaWidth / -2, arenaHeight / -2, arenaWidth, arenaHeight,);

	// --------------  Draw Lakes  -------------------------------------

	// ctx.filter = "blur(1px)";
	// ctx.fillStyle = colors.water;
	// for (let j = 0; j < frame.lakes.length; ++j) {
	// 	const lake = frame.lakes[j];
	// 	for (let i = 0; i < 3; ++i) {
	// 		const x = 0.0003 * noise(10 * (j + i), t / 3);
	// 		const y = 0.0003 * noise(10 * (j + i), t / 3);

	// 		ctx.beginPath();
	// 		const last = lake.length - 1;
	// 		ctx.moveTo(lake[0][0] + x, lake[0][1] + y);
	// 		// for (let i = 1; i < last - 1; ++i) {
	// 		// 	var xc = x + (lake[i][0] + lake[i + 1][0]) / 2;
	// 		// 	var yc = y + (lake[i][1] + lake[i + 1][1]) / 2;
	// 		// 	ctx.quadraticCurveTo(lake[i][0] + x, lake[i][1] + y, xc, yc);
	// 		// }
	// 		// ctx.quadraticCurveTo(lake[last - 1][0] + x, lake[last - 1][1] + y, lake[last][0] + x, lake[last][1] + y);
	// 		for (let i = 1; i <= last; ++i) {
	// 			ctx.lineTo(lake[i][0] + x, lake[i][1] + y);
	// 		}

	// 		ctx.closePath();
	// 		ctx.fill();
	// 	}
	// }
	// ctx.filter = "none";

	// idata.data.set();
	
	{
		if (cache.lakes.img == null) {
			const canvas = document.createElement('canvas');
			canvas.width = frame.lakes.size[0] * frame.lakes.resolution;
			canvas.height = frame.lakes.size[1] * frame.lakes.resolution;
			const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

			var idata = ctx.createImageData(canvas.width, canvas.height);

			for (let y = 0; y < idata.height; ++y) {
				for (let x = 0; x < idata.width; ++x) {
					idata.data[(x + y * idata.width) * 4] = 4 * 12;
					idata.data[(x + y * idata.width) * 4 + 1] = 4 * 21;
					idata.data[(x + y * idata.width) * 4 + 2] = 4 * 36;
					idata.data[(x + y * idata.width) * 4 + 3] = frame.lakes.bitmap[x + y * canvas.width];
				}
			}

			ctx.putImageData(idata, 0, 0);

			cache.lakes.img = new Image();
			cache.lakes.img.src = canvas.toDataURL();
		}

		const size = frame.lakes.size;
		ctx.drawImage(cache.lakes.img, -size[0] / 2, -size[1] / 2, size[0], size[1]);
	}

	// --------------  Draw Players  -------------------------------------


	for (let i = 0; i < frame.players.length; ++i) {
		const player = frame.players[i];
		const transform = ctx.getTransform();

		ctx.translate(...player.pos);

		ctx.rotate(3 * noise(i, t / 10));

		ctx.fillStyle = colors.white;
		ctx.fillRect(- 0.5, - 0.5, 1, 1);
		ctx.fillStyle = colors.black;

		const s = 0.4;
		const d = noise(10 * i, t / 20) * 0.3 + 0.1;
		ctx.rotate(noise(i, t / 10));
		ctx.fillRect(d - s / 2, d - s / 2, s, s);

		ctx.setTransform(transform);
	}
}
