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
		authenticated: authState.authenticated,
		hidden: configState.config.hideQuote
	});

	$effect(() => {
		if (trigger.enabled && trigger.authenticated && !trigger.hidden) {
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

	const CHAR_STEP_MS = 8;
	const MAX_STAGGER_MS = 400;
	const AUTHOR_GAP_MS = 120;

	// Split into word/space tokens (rather than a flat char array) so each word's
	// character spans can be wrapped in a no-wrap box — keeps the line-wrap opportunities
	// at spaces only, instead of letting the browser break between any two inline-block chars.
	let quoteTokens = $derived.by(() => {
		if (!quote) return [];
		const full = `“${quote}”`;
		let index = 0;
		return full.split(/(\s+)/).filter((part) => part.length > 0).map((part) => {
			const chars = Array.from(part);
			const token = { chars, startIndex: index, isSpace: /^\s+$/.test(part) };
			index += chars.length;
			return token;
		});
	});
	let totalChars = $derived(quote ? Array.from(`“${quote}”`).length : 0);
	let authorDelay = $derived(Math.min(totalChars * CHAR_STEP_MS, MAX_STAGGER_MS) + AUTHOR_GAP_MS);

	function charDelay(i: number) {
		return Math.min(i * CHAR_STEP_MS, MAX_STAGGER_MS);
	}
</script>

{#if configState.config.motdEnabled && authState.authenticated && !configState.config.hideQuote && !loading && !error && quote}
	<div class="quote-widget" data-context-menu="quote">
		<span class="quote-text"
			>{#each quoteTokens as token, ti (ti)}{#if token.isSpace}{token.chars.join('')}{:else}<span
						class="quote-word"
						>{#each token.chars as char, ci (ci)}<span
									class="ink-char"
									style="animation-delay: {charDelay(token.startIndex + ci)}ms">{char}</span
								>{/each}</span
					>{/if}{/each}</span
		>
		<span class="quote-author" style="animation-delay: {authorDelay}ms">— {author}</span>
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
	}

	.quote-text { display: block; }

	.quote-word {
		display: inline-block;
		white-space: nowrap;
	}

	.ink-char {
		display: inline-block;
		white-space: pre;
		opacity: 0;
		animation: ink-in 0.25s ease-out forwards;
	}

	@keyframes ink-in {
		from {
			opacity: 0;
			filter: blur(3px);
			transform: translateY(2px);
		}
		to {
			opacity: 1;
			filter: blur(0);
			transform: translateY(0);
		}
	}

	@keyframes ink-in-author {
		from {
			opacity: 0;
			filter: blur(3px);
			transform: translateY(2px);
		}
		to {
			opacity: 0.8;
			filter: blur(0);
			transform: translateY(0);
		}
	}

	.quote-author {
		display: block;
		margin-top: 4px;
		font-size: 0.85rem;
		opacity: 0;
		font-style: normal;
		font-weight: 500;
		animation: ink-in-author 0.25s ease-out forwards;
	}

	@media (max-width: 480px) {
		.quote-widget { font-size: 0.85rem; margin-top: 14px; }
		.quote-author { font-size: 0.75rem; }
	}

	@media (prefers-reduced-motion: reduce) {
		.ink-char,
		.quote-author {
			animation: none;
			opacity: 1;
			filter: none;
			transform: none;
		}
		.quote-author { opacity: 0.8; }
	}
</style>
