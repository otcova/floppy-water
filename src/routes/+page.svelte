<script lang="ts">
	import { onMount } from "svelte";
    import { createLocalBridge } from "./bridge";
    import { startClient } from "./client";
    import { startServer } from "./server";

	let container: HTMLDivElement;

	onMount(() => {
		const [serverBridge, clientBridge] = createLocalBridge();
		
		const stopRenderer = startClient(container, clientBridge);
		const stopServer = startServer(serverBridge);

		return () => {
			stopRenderer();
			stopServer();
		};
	});
</script>

<div class="container" bind:this={container}></div>

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
