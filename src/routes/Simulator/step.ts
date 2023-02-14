import { browser } from "$app/environment";
import { atan2, cos, sin } from "../utils";
import { createLakeFn } from "./lake";
import { Action, type Frame, type Vec2 } from "./main";

let boxPromise: Promise<typeof Box2D & EmscriptenModule> = new Promise(async resolve => {
	if (browser) {
		const Box2DFactory = (await import("box2d-wasm")).default;
		resolve(await Box2DFactory());
	}
});

interface Destroyable {
	__destroy__: () => void;
}


interface Cache {
	lake: {
		fn: null | ((pos: Vec2) => number),
		seed: number,
	}
}

const cache: Cache = {
	lake: {
		fn: null,
		seed: -1,
	}
};

function lakeFn(pos: Vec2, frame: Frame): boolean {
	if (cache.lake.fn == null || cache.lake.seed != frame.lake.seed) {
		cache.lake.fn = createLakeFn(frame.lake.size, frame.lake.seed);
		cache.lake.seed = frame.lake.seed;
	}
	return cache.lake.fn(pos) > 0;
}

export async function stepGame(frame: Frame, steps: number) {
	const {
		b2World,
		b2Vec2,
		b2BodyDef,
		b2PolygonShape,
		b2FixtureDef,
		b2_dynamicBody,
	} = await boxPromise;

	const objects: Destroyable[] = [];
	const track = <T extends Destroyable>(obj: T): T => {
		objects.push(obj);
		return obj;
	}

	const gravity = track(new b2Vec2(0, 50));
	const world = track(new b2World(gravity));


	// ----- Create Players --------
	const playersBody = [];

	for (const [_, player] of frame.players) {
		//  --- Body ---
		const bodyDef = track(new b2BodyDef());
		bodyDef.type = b2_dynamicBody;
		bodyDef.position.Set(...player.pos);
		bodyDef.linearVelocity.Set(...player.vel);
		bodyDef.angle = player.angle;
		bodyDef.angularVelocity = player.angleVel;
		bodyDef.angularDamping = 10;
		bodyDef.linearDamping = 50;
		bodyDef.allowSleep = false;
		const body = world.CreateBody(bodyDef);

		const dynamicBox = track(new b2PolygonShape());
		dynamicBox.SetAsBox(1, 1);

		const fixtureDef = track(new b2FixtureDef());
		fixtureDef.shape = dynamicBox;
		fixtureDef.density = .05;
		fixtureDef.friction = 0;

		body.CreateFixture(fixtureDef);

		playersBody.push(body);
	}



	// ---------------- Start simulation------------------------

	for (let step = 0; step < steps; ++step) {

		let i = 0;
		for (const [_, player] of frame.players) {
			const body = playersBody[i];

			const position = body.GetPosition();
			player.pos = [position.x, position.y];
			const velocity = body.GetLinearVelocity();
			player.vel = [velocity.x, velocity.y];
			player.angle = body.GetAngle();
			
			const inWater = lakeFn(player.pos, frame);

			if (inWater) {
				const water_friction = 3;
				body.SetLinearDamping(water_friction);
				body.SetGravityScale(0);
				player.dashCharge = 2;
			} else {
				const air_friction = 1;
				body.SetLinearDamping(air_friction);
				body.SetGravityScale(1);
			}
			
			// Set angle
			if (Math.abs(player.vel[0]) > 0.001 || Math.abs(player.vel[1]) > 0.001) {
				const targetAngle = atan2(player.vel[1], player.vel[0]);
				const angleDiference = atan2(sin(targetAngle-player.angle), cos(targetAngle-player.angle));
				body.ApplyTorque(angleDiference * 20, true);
			}

			// -------- Player Actions ---------
			
			const direction = [[0, -1], [-1, 0], [0, 1], [1, 0]];

			const move = (directionIndex: number) => {
				const moveForce = 20;
				const [x, y] = direction[directionIndex];
				if (inWater) {
					let fx = 0, fy = 0;
					if (x != 0 && Math.sign(player.vel[0]) != Math.sign(x)) {
						fx = - 5 * player.vel[0];
					}
					if (y != 0 && Math.sign(player.vel[1]) != Math.sign(y)) {
						fy = - 5 * player.vel[1];
					}
					body.ApplyForceToCenter(track(new b2Vec2(fx + x * moveForce, fy + y * moveForce)), true);
				}
			}

			const dash = (directionIndex: number) => {
				player.actions.add(Action.MOVE_W + directionIndex);
				player.actions.delete(Action.DASH_W + directionIndex);

				if (!inWater && player.dashCharge > 0) {
					const dashForce = 1000;
					const [x, y] = direction[directionIndex];
					
					if (x != 0 && Math.sign(player.vel[0]) != Math.sign(x)) {
						body.SetLinearVelocity(track(new b2Vec2(0, player.vel[1])));
					}
					if (y != 0 && Math.sign(player.vel[1]) != Math.sign(y)) {
						body.SetLinearVelocity(track(new b2Vec2(player.vel[0], 0)));
					}
					
					body.ApplyForceToCenter(track(new b2Vec2(x * dashForce, y * dashForce)), true);
					player.dashCharge -= 1;
				}
			};

			const stop = (directionIndex: number) => {
				player.actions.delete(Action.MOVE_W + directionIndex);
				player.actions.delete(Action.STOP_W + directionIndex);
			}

			for (const action of player.actions) {
				switch (action) {
					case Action.MOVE_W: move(0); break;
					case Action.MOVE_A: move(1); break;
					case Action.MOVE_S: move(2); break;
					case Action.MOVE_D: move(3); break;

					case Action.STOP_W: stop(0); break;
					case Action.STOP_A: stop(1); break;
					case Action.STOP_S: stop(2); break;
					case Action.STOP_D: stop(3); break;

					case Action.DASH_W: dash(0); break;
					case Action.DASH_A: dash(1); break;
					case Action.DASH_S: dash(2); break;
					case Action.DASH_D: dash(3); break;
				}
			}

			++i;
		}

		const timeStep = 1 / frame.tps;
		const velocityIterations = 6;
		const positionIterations = 2;
		world.Step(timeStep, velocityIterations, positionIterations);
		
		frame.camera.pos[0] -= .1;
		frame.camera.pos[1] -= .1;
	}

	// -------------- Record simulation results ----------------

	frame.frameCount += steps;

	let i = 0;
	for (const [_, player] of frame.players) {
		const position = playersBody[i].GetPosition();
		const velocity = playersBody[i].GetLinearVelocity();
		player.pos = [position.x, position.y];
		player.vel = [velocity.x, velocity.y];
		player.angle = playersBody[i].GetAngle();
		player.angleVel = playersBody[i].GetAngularVelocity();
		
		++i;
	}

	for (const obj of objects) {
		obj.__destroy__();
	}
}
