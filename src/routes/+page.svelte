<script lang="ts">
	import { onMount } from "svelte";
	import { createCanvas, drawFrame } from "./Painter/main";
	import { createGame } from "./Simulator/create";
	import { stepGame } from "./Simulator/step";

	let container: HTMLDivElement;
	let error: string = "";

	onMount(() => {
		let stop = false;
		const frame = createGame([
			{
				name: "Octova",
				skin: 0,
			},
		]);
		const canvas = createCanvas(container);
		if (canvas) {
			const drawLoop = () => {
				drawFrame(canvas, frame);
				stepGame(frame);
				if (!stop) requestAnimationFrame(drawLoop);
			};
			drawLoop();
		} else {
			error = "Your browser is limited";
		}

		return () => (stop = true);
	});
</script>

<div class="container" bind:this={container}>{error}</div>

<style>
	:global(body, html),
	.container {
		width: 100%;
		height: 100%;
		margin: 0;
		overflow: hidden;
		font-family: "Courier New", Courier, monospace;
	}

	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #0a1115;
		color: #fff;
	}
</style>
