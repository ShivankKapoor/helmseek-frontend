<script lang="ts">
	import { configState } from '$lib/state/config.svelte';

	let now = $state(new Date());

	$effect(() => {
		const ms = configState.config.heroShowSeconds ? 1000 : 30000;
		const id = setInterval(() => { now = new Date(); }, ms);
		return () => clearInterval(id);
	});

	function pad(n: number) { return String(n).padStart(2, '0'); }

	function getGreeting(d: Date) {
		const h = d.getHours();
		if (h < 5 || h >= 22) return 'Good Night';
		if (h < 12) return 'Good Morning';
		if (h < 17) return 'Good Afternoon';
		return 'Good Evening';
	}

	function getClock(d: Date, fmt: '12h' | '24h', secs: boolean) {
		const h = d.getHours(), m = pad(d.getMinutes()), s = pad(d.getSeconds());
		if (fmt === '24h') return secs ? `${pad(h)}:${m}:${s}` : `${pad(h)}:${m}`;
		const h12 = h % 12 || 12;
		const p = h < 12 ? 'AM' : 'PM';
		return secs ? `${h12}:${m}:${s} ${p}` : `${h12}:${m} ${p}`;
	}

	function getDate(d: Date) {
		return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	}

	let cfg = $derived(configState.config);
	let mode = $derived(cfg.heroMode);
	let name = $derived(cfg.heroGreetingName.trim());
</script>

{#if cfg.heroEnabled && mode !== 'none'}
	<div class="hero-widget">
		{#if mode === 'clock'}
			<div class="hero-clock">
				<span class="time">{getClock(now, cfg.heroClockFormat, cfg.heroShowSeconds)}</span>
				<span class="date">{getDate(now)}</span>
			</div>
		{:else if mode === 'greeting'}
			<div class="hero-greeting">
				<span class="greeting-text">{getGreeting(now)}</span>
				{#if name}<span class="greeting-name">{name}</span>{/if}
				<span class="date">{getDate(now)}</span>
			</div>
		{:else if mode === 'both'}
			<div class="hero-both">
				<span class="greeting-text">{getGreeting(now)}</span>
				{#if name}<span class="greeting-name">{name}</span>{/if}
				<span class="time">{getClock(now, cfg.heroClockFormat, cfg.heroShowSeconds)}</span>
				<span class="date">{getDate(now)}</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.hero-widget {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		margin-top: -120px;
		z-index: 500;
		text-align: center;
		color: var(--text-color);
		font-family: "Fira Code", monospace;
		user-select: none;
		pointer-events: none;
		opacity: 0.9;
		transition: opacity 0.3s ease;
		width: 100%;
		max-width: 600px;
		padding: 0 20px;
	}

	.hero-widget:hover { opacity: 1; }

	.hero-clock, .hero-greeting, .hero-both {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.hero-greeting { gap: 8px; }
	.hero-both     { gap: 6px; }

	.time {
		font-size: 2.5rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.greeting-text {
		font-size: 1.8rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		line-height: 1.2;
	}

	.greeting-name {
		font-size: 2.2rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--button-bg);
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		line-height: 1.1;
	}

	.date {
		font-size: 0.9rem;
		opacity: 0.8;
		font-weight: 400;
		letter-spacing: 0.02em;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.hero-widget  { margin-top: -100px; padding: 0 15px; }
		.hero-both    { margin-top: -130px; }
		.time         { font-size: 2rem; }
		.greeting-text{ font-size: 1.4rem; }
		.greeting-name{ font-size: 1.8rem; }
		.hero-both :global(.time) { font-size: 1.8rem; }
		.date         { font-size: 0.8rem; }
	}

	@media (max-width: 480px) {
		.hero-widget  { margin-top: -80px; padding: 0 10px; }
		.hero-both    { margin-top: -110px; }
		.time         { font-size: 1.6rem; }
		.greeting-text{ font-size: 1.2rem; }
		.greeting-name{ font-size: 1.5rem; }
		.date         { font-size: 0.75rem; }
	}

	@media (max-width: 360px) {
		.hero-widget  { margin-top: -70px; }
		.hero-both    { margin-top: -95px; }
		.time         { font-size: 1.4rem; }
		.greeting-text{ font-size: 1.1rem; }
		.greeting-name{ font-size: 1.3rem; }
		.date         { font-size: 0.7rem; }
	}

	@media (max-height: 500px) and (orientation: landscape) {
		.hero-widget   { margin-top: -60px; transform: translate(-50%, -50%) scale(0.9); }
		.hero-both     { margin-top: -75px; }
		.time          { font-size: 1.4rem; }
		.greeting-text { font-size: 1.1rem; }
		.greeting-name { font-size: 1.4rem; }
		.date          { font-size: 0.7rem; }
		.hero-clock, .hero-greeting, .hero-both { gap: 4px; }
	}
</style>
