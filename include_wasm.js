import { copyFile, mkdir } from "fs/promises";

await mkdir(
	"node_modules/.vite/deps",
	{ recursive: true }
);

await copyFile(
	"node_modules/box2d-wasm/dist/es/Box2D.simd.wasm",
	"node_modules/.vite/deps/Box2D.simd.wasm",
);
