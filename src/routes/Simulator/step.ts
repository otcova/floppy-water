import { browser } from "$app/environment";
import type { Frame } from "./main";

let boxPromise: Promise<typeof Box2D & EmscriptenModule> = new Promise(async resolve => {
	if (browser) {
		const Box2DFactory = (await import("box2d-wasm")).default;
		resolve(await Box2DFactory());
	}	
});

interface Destroyable {
	__destroy__: () => void;
}

export async function stepGame(frame: Frame) {
	const {
		b2World,
		b2Vec2,
		b2BodyDef,
		b2PolygonShape,
		b2FixtureDef,
		b2_dynamicBody
	} = await boxPromise;
	
	const objects: Destroyable[] = [];
	const track = <T extends Destroyable>(obj: T): T => {
		objects.push(obj);
		return obj;
	}
	
	const gravity = track(new b2Vec2(0, 20));
	const world = track(new b2World(gravity));
	
	const playersBody = [];
	
	for (const player of frame.players) {
		const bodyDef = track(new b2BodyDef());
		bodyDef.type = b2_dynamicBody;
		bodyDef.position.Set(...player.pos);
		bodyDef.linearVelocity.Set(...player.vel);
		const body = world.CreateBody(bodyDef);
		
		const dynamicBox = track(new b2PolygonShape());
		dynamicBox.SetAsBox(1, 1);
		
		const fixtureDef = track(new b2FixtureDef());
		fixtureDef.shape = dynamicBox;
		fixtureDef.density = 1;
		fixtureDef.friction = 0;
		
		body.CreateFixture(fixtureDef);
		
		playersBody.push(body);
	}
	
	const timeStep = 1 / 120;
	const velocityIterations = 6;
	const positionIterations = 2;
	
	for (let i = 0; i < 2; ++i) {
		
		// Air friction
		const air_friction_k = 100;
		for (const body of playersBody) {
			const velocity = body.GetLinearVelocity();
			const drag = track(new b2Vec2(
				- air_friction_k * velocity.x ** 2,
				- air_friction_k * velocity.y ** 2,
			));
			body.ApplyForceToCenter(drag, false);
		}
		
		world.Step(timeStep, velocityIterations, positionIterations);
	}
	
	for (let i = 0; i < playersBody.length; ++i) {
		const position = playersBody[i].GetPosition();
		const velocity = playersBody[i].GetLinearVelocity();
		frame.players[i].pos = [position.x, position.y];
		frame.players[i].vel = [velocity.x, velocity.y];
	}
	
	for (const obj of objects) {
		obj.__destroy__();
	}
}