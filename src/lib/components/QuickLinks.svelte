<script lang="ts">
	import { configState } from '$lib/state/config.svelte';
	import type { QuickLink } from '$lib/types/config';

	const CORNERS = ['top-left', 'top-right', 'bottom-left'] as const;

	function linksFor(corner: QuickLink['corner']): QuickLink[] {
		return configState.config.quickLinks
			.filter((l) => l.enabled && l.corner === corner)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	}

	function onMouseMove(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const shine = target.querySelector('.shine-effect') as HTMLElement | null;
		if (shine) {
			shine.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
			shine.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
			shine.style.opacity = '1';
		}
	}

	function onMouseLeave(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const shine = target.querySelector('.shine-effect') as HTMLElement | null;
		if (shine) shine.style.opacity = '0';
	}
</script>

{#if configState.config.quickLinksEnabled}
	{#each CORNERS as corner}
		{@const links = linksFor(corner)}
		{#if links.length > 0}
			<div class="quick-links-corner {corner}">
				{#each links as link (link.id)}
					<a
						href={link.url}
						class="quick-link quick-link-{corner}"
						title={link.url}
						onmousemove={onMouseMove}
						onmouseleave={onMouseLeave}
					>
						<span class="link-text">{link.text}</span>
						<div class="shine-effect"></div>
					</a>
				{/each}
			</div>
		{/if}
	{/each}
{/if}

<style>
	.quick-links-corner {
		position: fixed;
		z-index: 1000;
		display: flex;
		flex-direction: row;
		gap: 8px;
		flex-wrap: wrap;
	}

	.top-left    { top: 20px; left: 20px; }
	.top-right   { top: 20px; right: 20px; }
	.bottom-left { bottom: 20px; left: 20px; }

	.quick-link {
		padding: 4px 6px;
		background: transparent;
		color: var(--text-color);
		text-decoration: none;
		font-size: 15px;
		font-weight: 400;
		font-family: var(--font-family);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 6px;
		display: block;
		position: relative;
		overflow: hidden;
		border: 1px solid transparent;
		transform: translateY(0) scale(1);
	}

	.link-text {
		position: relative;
		z-index: 2;
		display: block;
	}

	.shine-effect {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(
			circle 30px at var(--mouse-x, 50%) var(--mouse-y, 50%),
			rgba(var(--button-bg-rgb, 26, 115, 232), 0.4) 0%,
			rgba(var(--button-bg-rgb, 26, 115, 232), 0.2) 30%,
			transparent 70%
		);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
		z-index: 1;
	}

	.quick-link::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(var(--button-bg-rgb, 26, 115, 232), 0.1), transparent);
		opacity: 0;
		transition: all 0.6s ease;
		z-index: 0;
	}

	.quick-link:hover {
		color: var(--button-bg);
		text-decoration: none;
		background: rgba(var(--button-bg-rgb, 26, 115, 232), 0.1);
		border-color: var(--button-bg);
		transform: translateY(-2px) scale(1.05);
		box-shadow: 0 4px 12px rgba(var(--button-bg-rgb, 26, 115, 232), 0.25),
		            0 0 20px rgba(var(--button-bg-rgb, 26, 115, 232), 0.15);
		font-weight: 500;
	}

	.quick-link:hover::before { left: 100%; opacity: 0.8; }

	.quick-link:active {
		transform: translateY(0) scale(0.98);
		box-shadow: 0 2px 6px rgba(var(--button-bg-rgb, 26, 115, 232), 0.3),
		            0 0 10px rgba(var(--button-bg-rgb, 26, 115, 232), 0.2);
	}

	@media (max-width: 768px) {
		.top-left, .top-right   { top: 15px; }
		.top-left, .bottom-left { left: 15px; }
		.top-right              { right: 15px; }
		.bottom-left            { bottom: 15px; }
		.quick-link { font-size: 13px; padding: 3px 5px; }
	}
</style>
