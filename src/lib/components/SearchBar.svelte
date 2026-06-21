<script lang="ts">
	import { onMount } from 'svelte';

	let inputEl = $state<HTMLInputElement>();
	let formEl = $state<HTMLFormElement>();
	let emptyPopupEl = $state<HTMLDivElement>();
	let copyPopupEl = $state<HTMLDivElement>();

	let query = $state('');
	let showCalculator = $state(false);
	let calcResult = $state<string | null>(null);
	let mathExpression = $state('');

	let isShaking = false;
	let isShowingPopup = false;

	const MESSAGES = [
		"I'm sure you meant to type something...",
		"The search box is working, whenever you're ready.",
		"Still waiting for your query. Take your time.",
		"Perhaps you'd like to actually search for something?",
		"The keyboard is there for a reason, you know.",
		"Searching requires words. Just a friendly reminder.",
		"The search box isn't going to fill itself..."
	];

	onMount(() => {
		setTimeout(() => { inputEl?.focus(); }, 100);
	});

	function onInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		query = val;
		if (val.startsWith('=') && val.length > 1) {
			handleCalc(val.slice(1));
		} else {
			hideCalc();
		}
	}

	function handleCalc(expr: string) {
		if (!expr.trim()) { hideCalc(); return; }
		mathExpression = expr;
		try {
			const clean = expr.replace(/\s/g, '');
			if (!/^[\d+\-*/.()]+$/.test(clean)) { hideCalc(); return; }
			if (clean.includes('**') || clean.includes('^')) { hideCalc(); return; }
			let depth = 0;
			for (const c of clean) {
				if (c === '(') depth++;
				if (c === ')') depth--;
				if (depth < 0) { hideCalc(); return; }
			}
			if (depth !== 0) { hideCalc(); return; }
			const result = new Function('return (' + clean + ')')();
			if (typeof result !== 'number' || !isFinite(result)) { hideCalc(); return; }
			calcResult = Number.isInteger(result) ? String(result) : String(parseFloat(result.toFixed(10)));
			showCalculator = true;
		} catch {
			hideCalc();
		}
	}

	function hideCalc() {
		showCalculator = false;
		calcResult = null;
		mathExpression = '';
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && showCalculator && calcResult) {
			e.preventDefault();
			copyResult();
		}
	}

	function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isShaking || isShowingPopup) return;
		const val = (inputEl?.value ?? '').trim();
		if (!val) { shake(); showEmptyPopup(); inputEl?.focus(); return; }
		if (showCalculator && calcResult) { copyResult(); return; }
		window.location.href = `https://www.google.com/search?q=${encodeURIComponent(val)}`;
	}

	async function copyResult() {
		if (!calcResult) return;
		try {
			await navigator.clipboard.writeText(calcResult);
			showCopyPopup(true);
		} catch {
			showCopyPopup(false);
		}
	}

	function shake() {
		if (!formEl) return;
		isShaking = true;
		const intensity = Math.random() * 8 + 4;
		const duration = Math.random() * 0.4 + 0.4;
		formEl.classList.remove('shake');
		formEl.style.setProperty('--shake-intensity', `${intensity}px`);
		formEl.style.setProperty('--shake-duration', `${duration}s`);
		void formEl.offsetHeight;
		formEl.classList.add('shake');
		setTimeout(() => {
			formEl?.classList.remove('shake');
			formEl?.style.removeProperty('--shake-intensity');
			formEl?.style.removeProperty('--shake-duration');
			isShaking = false;
		}, duration * 1000 + 100);
	}

	function showEmptyPopup() {
		if (!emptyPopupEl || isShowingPopup) return;
		isShowingPopup = true;
		const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
		const span = emptyPopupEl.querySelector('.popup-message');
		if (span) span.textContent = msg;
		emptyPopupEl.classList.remove('show', 'hide');
		void emptyPopupEl.offsetHeight;
		emptyPopupEl.classList.add('show');
		setTimeout(() => {
			emptyPopupEl?.classList.remove('show');
			emptyPopupEl?.classList.add('hide');
			setTimeout(() => {
				emptyPopupEl?.classList.remove('hide');
				isShowingPopup = false;
			}, 300);
		}, 3000);
	}

	function showCopyPopup(success: boolean) {
		if (!copyPopupEl || isShowingPopup) return;
		isShowingPopup = true;
		const span = copyPopupEl.querySelector('.popup-message');
		const icon = copyPopupEl.querySelector('i');
		if (span) span.textContent = success ? 'Copied to clipboard!' : 'Failed to copy to clipboard';
		if (icon) icon.className = success ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
		copyPopupEl.classList.remove('show', 'hide', 'error');
		if (!success) copyPopupEl.classList.add('error');
		void copyPopupEl.offsetHeight;
		copyPopupEl.classList.add('show');
		setTimeout(() => {
			copyPopupEl?.classList.remove('show');
			copyPopupEl?.classList.add('hide');
			setTimeout(() => {
				copyPopupEl?.classList.remove('hide', 'error');
				isShowingPopup = false;
			}, 300);
		}, success ? 2000 : 3000);
	}
</script>

<div class="search-wrapper">
	<form
		bind:this={formEl}
		class="search-box"
		action="https://www.google.com/search"
		method="GET"
		autocomplete="off"
		novalidate
		onsubmit={onSubmit}
	>
		<div class="search-icon">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</div>
		<input
			bind:this={inputEl}
			type="text"
			name="q"
			placeholder="Search Google..."
			oninput={onInput}
			onkeydown={onKeydown}
		/>
		<button type="submit">Search</button>
	</form>

	{#if showCalculator && calcResult}
		<div class="calculator-dropdown">
			<div class="calculator-result">
				<div class="calc-icon"><i class="bi bi-calculator"></i></div>
				<div class="calc-content">
					<div class="calc-expression">{mathExpression}</div>
					<div class="calc-answer">= {calcResult}</div>
				</div>
				<div class="calc-action"><small>Press Enter to copy</small></div>
			</div>
		</div>
	{/if}
</div>

<div bind:this={emptyPopupEl} class="empty-search-popup">
	<div class="popup-content">
		<i class="bi-lightbulb-fill"></i>
		<span class="popup-message">What would you like to search for?</span>
	</div>
</div>

<div bind:this={copyPopupEl} class="copy-success-popup">
	<div class="popup-content">
		<i class="bi-check-circle-fill"></i>
		<span class="popup-message">Copied to clipboard!</span>
	</div>
</div>

<style>
	.search-wrapper {
		position: relative;
		width: 100%;
		min-width: 45vw;
		max-width: 700px;
	}

	.calculator-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--input-bg);
		border: 1px solid rgba(128,128,128,0.2);
		border-radius: 0 0 12px 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		margin-top: -1px;
		overflow: hidden;
	}

	.calculator-result {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		gap: 12px;
		transition: background-color 0.2s ease;
		cursor: pointer;
	}

	.calculator-result:hover { background: rgba(128, 128, 128, 0.08); }

	.calc-icon { color: var(--button-bg); font-size: 18px; display: flex; align-items: center; }

	.calc-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }

	.calc-expression {
		font-family: var(--font-family);
		font-size: 14px;
		color: var(--footer-color);
	}

	.calc-answer {
		font-family: var(--font-family);
		font-size: 18px;
		font-weight: 600;
		color: var(--text-color);
	}

	.calc-action {
		color: var(--footer-color);
		font-size: 12px;
		font-family: var(--font-family);
	}

	.copy-success-popup {
		position: fixed;
		bottom: 30px;
		left: 50%;
		transform: translateX(-50%);
		background: #d4edda;
		color: #155724;
		border: 2px solid #c3e6cb;
		border-radius: 12px;
		padding: 16px 24px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		z-index: 2000;
		opacity: 0;
		visibility: hidden;
		transform: translateX(-50%) translateY(20px);
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.copy-success-popup.show {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(0);
	}

	.copy-success-popup.hide {
		opacity: 0;
		visibility: hidden;
		transform: translateX(-50%) translateY(20px);
		transition: all 0.3s ease-in;
	}

	.copy-success-popup.error {
		background: #f8d7da;
		color: #721c24;
		border-color: #f5c6cb;
	}

	.copy-success-popup .popup-content {
		display: flex;
		align-items: center;
		gap: 12px;
		font-family: var(--font-family);
		font-weight: 500;
	}

	.copy-success-popup i { font-size: 20px; }
	.copy-success-popup .popup-message { font-size: 16px; }

	:global(body.dark) .copy-success-popup {
		background: rgba(40, 167, 69, 0.2);
		color: #a7d4b4;
		border-color: rgba(40, 167, 69, 0.3);
	}

	:global(body.dark) .copy-success-popup.error {
		background: rgba(220, 53, 69, 0.2);
		color: #d4a7a7;
		border-color: rgba(220, 53, 69, 0.3);
	}
</style>
