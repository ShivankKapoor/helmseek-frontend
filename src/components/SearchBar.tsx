import { useEffect, useRef, useState } from 'preact/hooks';
import { evaluateExpression } from '@/lib/utils/calculator';
import { cx } from '@/lib/utils/cx';
import styles from './SearchBar.module.css';

const SEARCH_URL = 'https://www.google.com/search';
const AUTOFOCUS_DELAY_MS = 100;
const POPUP_FADE_MS = 300;
const EMPTY_POPUP_VISIBLE_MS = 3000;
const COPY_SUCCESS_VISIBLE_MS = 2000;
const COPY_FAILURE_VISIBLE_MS = 3000;
const SHAKE_SETTLE_MS = 100;

const EMPTY_SEARCH_MESSAGES = [
	"I'm sure you meant to type something...",
	"The search box is working, whenever you're ready.",
	'Still waiting for your query. Take your time.',
	"Perhaps you'd like to actually search for something?",
	'The keyboard is there for a reason, you know.',
	'Searching requires words. Just a friendly reminder.',
	"The search box isn't going to fill itself..."
];

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

type Popup = { kind: 'empty'; message: string } | { kind: 'copy'; success: boolean };
type PopupPhase = 'show' | 'hide';

interface Calculation {
	expression: string;
	result: string;
}

interface Shake {
	intensityPx: number;
	durationSeconds: number;
}

/** One transient popup at a time: fades in, stays for `visibleMs`, fades out. A newer popup replaces the current one. */
function usePopup() {
	const [popup, setPopup] = useState<Popup | null>(null);
	const [phase, setPhase] = useState<PopupPhase>('show');
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimers = () => timers.current.forEach(clearTimeout);
	useEffect(() => clearTimers, []);

	function showPopup(next: Popup, visibleMs: number) {
		clearTimers(); // otherwise the old popup's timers would hide the new one early
		setPopup(next);
		setPhase('show');
		timers.current = [
			setTimeout(() => setPhase('hide'), visibleMs),
			setTimeout(() => setPopup(null), visibleMs + POPUP_FADE_MS)
		];
	}

	return { popup, phase, showPopup };
}

export function SearchBar() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [calculation, setCalculation] = useState<Calculation | null>(null);
	const [shake, setShake] = useState<Shake | null>(null);
	const { popup, phase, showPopup } = usePopup();

	useEffect(() => {
		const id = setTimeout(() => inputRef.current?.focus(), AUTOFOCUS_DELAY_MS);
		return () => clearTimeout(id);
	}, []);

	function handleInput(value: string) {
		// A leading "=" switches the search box into calculator mode.
		const expression = value.startsWith('=') ? value.slice(1) : '';
		const result = expression.trim() ? evaluateExpression(expression) : null;
		setCalculation(result ? { expression, result } : null);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && calculation) {
			event.preventDefault();
			copyResult(calculation.result);
		}
	}

	function handleSubmit(event: Event) {
		event.preventDefault();

		const query = (inputRef.current?.value ?? '').trim();
		if (!query) {
			nudgeToType();
			return;
		}
		// A real search is never held back by an animation or popup that is still on screen.
		if (calculation) {
			copyResult(calculation.result);
			return;
		}
		window.location.href = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
	}

	/** Shake the box and show a hint. Ignored while the last nudge is still playing, so pressing Enter repeatedly doesn't restart it. */
	function nudgeToType() {
		inputRef.current?.focus();
		if (shake || popup?.kind === 'empty') return;

		shakeSearchBox();
		showPopup(
			{ kind: 'empty', message: EMPTY_SEARCH_MESSAGES[Math.floor(Math.random() * EMPTY_SEARCH_MESSAGES.length)] },
			EMPTY_POPUP_VISIBLE_MS
		);
	}

	async function copyResult(result: string) {
		try {
			await navigator.clipboard.writeText(result);
			showPopup({ kind: 'copy', success: true }, COPY_SUCCESS_VISIBLE_MS);
		} catch {
			showPopup({ kind: 'copy', success: false }, COPY_FAILURE_VISIBLE_MS);
		}
	}

	function shakeSearchBox() {
		const next = { intensityPx: randomBetween(4, 12), durationSeconds: randomBetween(0.4, 0.8) };
		setShake(next);
		setTimeout(() => setShake(null), next.durationSeconds * 1000 + SHAKE_SETTLE_MS);
	}

	const shakeStyle = shake
		? `--shake-intensity: ${shake.intensityPx}px; --shake-duration: ${shake.durationSeconds}s`
		: undefined;

	const emptyPopup = popup?.kind === 'empty' ? popup : null;
	const copyPopup = popup?.kind === 'copy' ? popup : null;

	return (
		<>
			<div class={styles.searchWrapper}>
				<form
					class={cx('search-box', shake && 'shake')}
					style={shakeStyle}
					action={SEARCH_URL}
					method="GET"
					autocomplete="off"
					noValidate
					onSubmit={handleSubmit}
				>
					<div class="search-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<input
						ref={inputRef}
						type="text"
						name="q"
						placeholder="Search Google..."
						aria-label="Search Google"
						onInput={(event) => handleInput(event.currentTarget.value)}
						onKeyDown={handleKeyDown}
					/>
					<button type="submit">Search</button>
				</form>

				{calculation && (
					<div class={styles.calculatorDropdown}>
						<div class={styles.calculatorResult}>
							<div class={styles.calcIcon}>
								<i class="bi bi-calculator" aria-hidden="true" />
							</div>
							<div class={styles.calcContent}>
								<div class={styles.calcExpression}>{calculation.expression}</div>
								<div class={styles.calcAnswer}>= {calculation.result}</div>
							</div>
							<div class={styles.calcAction}>
								<small>Press Enter to copy</small>
							</div>
						</div>
					</div>
				)}
			</div>

			<div class={cx('empty-search-popup', emptyPopup && phase)} role="status">
				<div class="popup-content">
					<i class="bi-lightbulb-fill" aria-hidden="true" />
					<span>{emptyPopup?.message ?? EMPTY_SEARCH_MESSAGES[0]}</span>
				</div>
			</div>

			<div
				class={cx(styles.copySuccessPopup, copyPopup && styles[phase], copyPopup && !copyPopup.success && styles.error)}
				role="status"
			>
				<div class={styles.popupContent}>
					<i
						class={copyPopup?.success === false ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}
						aria-hidden="true"
					/>
					<span>{copyPopup?.success === false ? 'Failed to copy to clipboard' : 'Copied to clipboard!'}</span>
				</div>
			</div>
		</>
	);
}
