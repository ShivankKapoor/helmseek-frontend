<script lang="ts">
	import { settingsUiState } from '$lib/state/settings.svelte';

	const MENU_WIDTH = 180;
	const MENU_HEIGHT = 44;

	let menuPos = $state<{ x: number; y: number } | null>(null);

	function openMenu(e: MouseEvent) {
		if (e.shiftKey) return; // Shift+right-click bypasses our menu for the browser's native one
		e.preventDefault();
		menuPos = {
			x: Math.min(e.clientX, window.innerWidth - MENU_WIDTH),
			y: Math.min(e.clientY, window.innerHeight - MENU_HEIGHT)
		};
	}

	function openSettingsFromMenu() {
		settingsUiState.show();
		menuPos = null;
	}
</script>

<svelte:window
	oncontextmenu={openMenu}
	onclick={() => (menuPos = null)}
	onkeydown={(e) => e.key === 'Escape' && (menuPos = null)}
/>

{#if menuPos}
	<div class="app-context-menu" style="top:{menuPos.y}px; left:{menuPos.x}px" role="menu">
		<button class="app-context-menu-item" onclick={openSettingsFromMenu}>
			<i class="bi bi-gear-fill"></i> Settings
		</button>
	</div>
{/if}

<style>
	.app-context-menu {
		position: fixed;
		background: var(--input-bg);
		color: var(--text-color);
		border: 1px solid rgba(128, 128, 128, 0.3);
		border-radius: 6px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		padding: 4px 0;
		min-width: 160px;
		font-family: var(--font-family);
		transform-origin: top left;
		animation: context-menu-in 0.12s ease-out;
	}

	@keyframes context-menu-in {
		from { opacity: 0; transform: scale(0.92); }
		to   { opacity: 1; transform: scale(1); }
	}

	@media (prefers-reduced-motion: reduce) {
		.app-context-menu { animation: none; }
	}

	.app-context-menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 9px 12px;
		border: none;
		background: none;
		color: var(--text-color);
		font-size: 14px;
		font-style: normal;
		text-align: left;
		cursor: pointer;
	}

	.app-context-menu-item:hover {
		background: var(--button-bg);
		color: white;
	}
</style>
