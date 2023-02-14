import { browser } from "$app/environment";
import { atan2, cos, normalize, PI, sin } from "../utils";
import { createLakeFn } from "./lake";
import { blockSize, isDiagonal, isZero, type Dir2, type Frame, type Vec2 } from "./main";

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

	const arenaSize = frame.lake.size;

	// ----- Create Blocks --------
	for (const block of frame.blocks) {
		const size = blockSize(block.type);
		for (let y = -1; y <= 1; ++y) {
			for (let x = -1; x <= 1; ++x) {
				const bodyDef = track(new b2BodyDef());
				bodyDef.position.Set(block.pos[0] + x * arenaSize[0], block.pos[1] + y * arenaSize[1]);
				const body = world.CreateBody(bodyDef);

				const box = track(new b2PolygonShape());
				box.SetAsBox(size[0] / 2, size[1] / 2);

				body.CreateFixture(box, 0);
			}
		}
	}

	// ----- Create Players --------
	const playersBody = [];

	for (const [_, player] of frame.players) {
		const bodyDef = track(new b2BodyDef());
		bodyDef.type = b2_dynamicBody;
		bodyDef.position.Set(...player.pos);
		bodyDef.linearVelocity.Set(...player.vel);
		bodyDef.angle = player.angle + PI / 4;
		bodyDef.angularVelocity = player.angleVel;
		bodyDef.angularDamping = 30;
		bodyDef.linearDamping = 0;
		bodyDef.allowSleep = false;
		const body = world.CreateBody(bodyDef);

		const dynamicBox = track(new b2PolygonShape());
		dynamicBox.SetAsBox(0.5, 0.5);

		const fixtureDef = track(new b2FixtureDef());
		fixtureDef.shape = dynamicBox;
		fixtureDef.density = .2;
		fixtureDef.friction = 0;
		fixtureDef.restitution = 0.9;

		body.CreateFixture(fixtureDef);

		playersBody.push(body);
	}



	// ---------------- Start simulation------------------------
	const timeStep = 1 / frame.tps;
	const velocityIterations = 6;
	const positionIterations = 2;

	for (let step = 0; step < steps; ++step) {


		let i = 0;
		for (const [_, player] of frame.players) {
			const body = playersBody[i];

			const position = body.GetPosition();
			player.pos = [position.x, position.y];
			const velocity = body.GetLinearVelocity();
			player.vel = [velocity.x, velocity.y];
			player.angle = body.GetAngle() - PI / 4;

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

			// -------- Player Actions ---------


			const rotate = (direction: Dir2) => {
				if (isZero(direction)) return;
				const targetAngle = atan2(direction[1], direction[0]);
				const angleDiference = atan2(sin(targetAngle - player.angle), cos(targetAngle - player.angle));
				body.ApplyTorque(angleDiference * 12, true);
			}

			// Move
			if (!isZero(player.move)) {
				const moveForce = 20;
				const [x, y] = normalize(player.move);
				if (inWater) {
					let fx = 0, fy = 0;
					if (player.move[0] != 0 && Math.sign(player.vel[0]) != Math.sign(x)) {
						fx = - 5 * player.vel[0];
					}
					if (player.move[1] != 0 && Math.sign(player.vel[1]) != Math.sign(y)) {
						fy = - 5 * player.vel[1];
					}
					body.ApplyForceToCenter(track(new b2Vec2(fx + x * moveForce, fy + y * moveForce)), true);
				}
				rotate(player.move);
			}

			// Dash

			const dash = (dir: Dir2) => {
				const [dashX, dashY] = normalize(dir);

				if (dir[0] != 0 && Math.sign(player.vel[0]) != Math.sign(dashX)) {
					body.SetLinearVelocity(track(new b2Vec2(0, player.vel[1])));
				}
				if (dir[1] != 0 && Math.sign(player.vel[1]) != Math.sign(dashY)) {
					body.SetLinearVelocity(track(new b2Vec2(player.vel[0], 0)));
				}

				const dashForce = 900;
				body.ApplyForceToCenter(track(new b2Vec2(dashX * dashForce, dashY * dashForce)), true);
				--player.dashCharge;
			};

			if (player.dashDelayed) {
				if (!isZero(player.move) && player.dashDelayed.frames > 0) {
					--player.dashDelayed.frames;
				} else {
					dash(player.dashDelayed.dir);
					player.dashDelayed = null;
				}
			}

			if (!isZero(player.dash)) {
				if (!inWater && player.dashCharge > 0) {
					if (isDiagonal(player.dash)) {
						dash(player.dash);
						player.dashDelayed = null;
					} else {
						if (player.dashDelayed) dash(player.dashDelayed.dir);
						const dashCooldownSeconds = 0.1;
						player.dashDelayed = {
							frames: frame.tps * dashCooldownSeconds,
							dir: player.dash,
						};
					}
				}

				player.move = player.dash;
				player.dash = [0, 0];
			};

			++i;
		}


		world.Step(timeStep, velocityIterations, positionIterations);

		// frame.camera.pos[0] -= .1;
		// frame.camera.pos[1] -= .1;
	}

	// -------------- Record simulation results ----------------

	frame.frameCount += steps;

	let i = 0;
	for (const [_, player] of frame.players) {
		const position = playersBody[i].GetPosition();
		const velocity = playersBody[i].GetLinearVelocity();
		player.pos = [position.x, position.y];
		player.vel = [velocity.x, velocity.y];
		player.angle = playersBody[i].GetAngle() - PI / 4;
		player.angleVel = playersBody[i].GetAngularVelocity();

		++i;
	}

	for (const obj of objects) {
		obj.__destroy__();
	}
}
