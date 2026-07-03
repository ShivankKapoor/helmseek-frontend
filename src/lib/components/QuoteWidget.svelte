<script lang="ts">
	import { configState } from '$lib/state/config.svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { fetchQuote } from '$lib/api/quote';

	let quote = $state<string | null>(null);
	let author = $state<string | null>(null);
	let loading = $state(false);
	let error = $state(false);

	let trigger = $derived({
		enabled: configState.config.motdEnabled,
		authenticated: authState.authenticated
	});

	$effect(() => {
		if (trigger.enabled && trigger.authenticated) {
			loadQuote();
		}
	});

	async function loadQuote() {
		loading = true;
		error = false;
		try {
			const result = await fetchQuote();
			if (result.quote === 'UNKNOWN') {
				error = true;
			} else {
				quote = result.quote;
				author = result.author;
			}
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}
</script>

{#if configState.config.motdEnabled && authState.authenticated && !loading && !error && quote}
	<div class="quote-widget">
		<span class="quote-text">&ldquo;{quote}&rdquo;</span>
		<span class="quote-author">— {author}</span>
	</div>
{/if}

<style>
	.quote-widget {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 20px;
		width: max-content;
		max-width: min(500px, 90vw);
		text-align: center;
		color: var(--footer-color);
		font-family: var(--font-family);
		font-style: italic;
		font-size: 0.95rem;
		line-height: 1.4;
		user-select: none;
		pointer-events: none;
	}

	.quote-text { display: block; }

	.quote-author {
		display: block;
		margin-top: 4px;
		font-size: 0.85rem;
		opacity: 0.8;
		font-style: normal;
		font-weight: 500;
	}

	@media (max-width: 480px) {
		.quote-widget { font-size: 0.85rem; margin-top: 14px; }
		.quote-author { font-size: 0.75rem; }
	}
</style>
