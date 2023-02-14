import type { Action, Frame, PlayerId } from "./Simulator/main";

export interface ClientBridge {
	getReceivedFrame: () => null | Frame,
	timeWhenReceivedFrame: () => number,
	sendAction: (action: Action) => void,
}

export interface ActionMetadata {
	action: Action,
	playerId: PlayerId,
}

export interface ServerBridge {
	getReceivedActions: () => ActionMetadata[],
	sendFrame: (frame: Frame) => void,
	clients: Client[],
}

export interface Client {
	id: string,
}

export function createLocalBridge(): [ServerBridge, ClientBridge] {

	let frame: Frame | null = null;
	let timeWhenReceivedFrame = 0;

	let actions: ActionMetadata[] = [];

	const serverBridge = {
		sendFrame: (f: Frame) => {
			frame = JSON.parse(JSON.stringify(f, replacer), reviver);
		},
		getReceivedActions: () => {
			const a = actions;
			actions = [];
			return a;
		},
		clients: [{ id: "local" }],
	};

	const clientBridge = {
		getReceivedFrame: () => {
			const f = frame;
			if (f) {
				timeWhenReceivedFrame = performance.now() / 1000;
				frame = null;
			}
			return f;
		},
		timeWhenReceivedFrame: () => timeWhenReceivedFrame,
		sendAction: (action: Action) => {
			actions.push({ action, playerId: "local" })
		},
	};

	return [serverBridge, clientBridge];
}

function replacer(key: string, value: any) {
	if (value instanceof Map) {
		return {
			dataType: 'Map',
			value: Array.from(value.entries()),
		};
	} else if (value instanceof Set) {
		return {
			dataType: 'Set',
			value: Array.from(value.values()),
		};
	} else {
		return value;
	}
}

function reviver(key: string, value: any) {
	if (typeof value === 'object' && value !== null) {
		if (Array.isArray(value.value)) {
			if (value.dataType === 'Map') {
				return new Map(value.value);
			} else if (value.dataType === 'Set') {
				return new Set(value.value);
			}
		}
	}
	return value;
}