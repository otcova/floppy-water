import type { ClientBridge } from "./bridge";
import { createCanvas, drawFrame } from "./Painter/main";
import { Action, type Frame } from "./Simulator/main";
import { stepGame } from "./Simulator/step";

type StopClient = () => void;

export function startClient(canvasContainer: HTMLElement, bridge: ClientBridge): StopClient {
	const stopRender = startRender(canvasContainer, bridge);
	const stopActionManager = startActionManager(bridge);

	return () => {
		stopRender();
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
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.repeat) return;
		switch (event.key.toLowerCase()) {
			case 'w': bridge.sendAction(Action.DASH_W); break;
			case 'a': bridge.sendAction(Action.DASH_A); break;
			case 's': bridge.sendAction(Action.DASH_S); break;
			case 'd': bridge.sendAction(Action.DASH_D); break;
		}
	}

	const onKeyUp = (event: KeyboardEvent) => {
		switch (event.key.toLowerCase()) {
			case 'w': bridge.sendAction(Action.STOP_W); break;
			case 'a': bridge.sendAction(Action.STOP_A); break;
			case 's': bridge.sendAction(Action.STOP_S); break;
			case 'd': bridge.sendAction(Action.STOP_D); break;
		}
	}

	addEventListener("keydown", onKeyDown);
	addEventListener("keyup", onKeyUp);
	return () => {
		removeEventListener("keydown", onKeyDown);
		removeEventListener("keyup", onKeyUp);
	};
}