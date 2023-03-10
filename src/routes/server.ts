import type { ServerBridge } from "./bridge";
import { createFrame } from "./Simulator/create";
import { stepGame } from "./Simulator/step";

// needs to be smaller or equal to tps
const reportsPerSecond = 30;

type StopServer = () => void;

export function startServer(bridge: ServerBridge): StopServer {
	const frame = createFrame(
		bridge.clients.map(client => ({ id: client.id, name: client.id, skin: 0 }))
	);

	// bridge.sendFrame(frame);

	const updateLoop = setInterval(async () => {
		for (const actionMeta of bridge.getReceivedActions()) {
			const player = frame.players.get(actionMeta.playerId);
			if (player) {
				if ("dash" in actionMeta.action) player.dash = actionMeta.action.dash;
				else if ("move" in actionMeta.action) player.move = actionMeta.action.move;
			}
		}
		await stepGame(frame, frame.tps / reportsPerSecond);
		bridge.sendFrame(frame);
	}, 1000 / reportsPerSecond);

	return () => {
		clearInterval(updateLoop);
	};
}
