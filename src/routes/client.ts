import type { ClientBridge } from "./bridge";
import { createCanvas, drawFrame } from "./Painter/main";
import type { Dir2, Frame } from "./Simulator/main";
import { stepGame } from "./Simulator/step";

type StopClient = () => void;

export function startClient(canvasContainer: HTMLElement, bridge: ClientBridge): StopClient {
	const stopRender = startRender(canvasContainer, bridge);
	const stopActionManager = startActionManager(bridge);

	return () => {
		stopRender();
		stopActionManager();
	};
}

function startRender(container: HTMLElement, bridge: ClientBridge): StopClient {
	let stop = false;

	const canvas = createCanvas(container);

	let frame: Frame | null = null;
	let receivedFrameCount = 0;

	const drawLoop = async () => {
		if (stop) return;

		let receivedFrame = bridge.getReceivedFrame();
		if (receivedFrame) {
			receivedFrameCount = receivedFrame.frameCount;
			frame = receivedFrame;
		}


		if (frame) {
			const deltaTime = performance.now() / 1000 - bridge.timeWhenReceivedFrame();
			const stepsAhead = Math.round(deltaTime * frame.tps);

			const steps = stepsAhead - frame.frameCount + receivedFrameCount;
			await stepGame(frame, steps);

			drawFrame(canvas, frame);
		}

		requestAnimationFrame(drawLoop);
	};
	drawLoop();

	return () => {
		stop = true;
	};
}

function startActionManager(bridge: ClientBridge): StopClient {
	const keys: Set<string> = new Set();

	const keyboardDirection = () => {
		let dir: Dir2 = [0, 0];
		if (keys.has('w')) dir[1] -= 1;
		if (keys.has('a')) dir[0] -= 1;
		if (keys.has('s')) dir[1] += 1;
		if (keys.has('d')) dir[0] += 1;
		return dir;
	}

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.repeat) return;
		
		const key = event.key.toLowerCase();
		if ("wasd".includes(key)) {
			keys.add(key);
			bridge.sendAction({ dash: keyboardDirection() });
		}
	}

	const onKeyUp = (event: KeyboardEvent) => {
		const key = event.key.toLowerCase();
		if ("wasd".includes(key)) {
			keys.delete(key);
			bridge.sendAction({ move: keyboardDirection() });
		}
	}

	addEventListener("keydown", onKeyDown);
	addEventListener("keyup", onKeyUp);
	return () => {
		removeEventListener("keydown", onKeyDown);
		removeEventListener("keyup", onKeyUp);
	};
}