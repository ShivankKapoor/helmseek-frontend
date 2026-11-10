import { useEffect, useMemo, useState } from 'preact/hooks';
import { fetchQuote } from '@/lib/api/quote';
import { authenticated } from '@/lib/state/auth';
import { config } from '@/lib/state/config';
import styles from './QuoteWidget.module.css';

// The quote "inks in" one character at a time, capped so long quotes don't take forever.
const CHAR_STEP_MS = 8;
const MAX_STAGGER_MS = 400;
const AUTHOR_GAP_MS = 120;

/** What the quote service returns when it has no quote to give. */
const NO_QUOTE = 'UNKNOWN';

interface QuoteToken {
	text: string;
	chars: string[];
	startIndex: number;
	isSpace: boolean;
}

/**
 * Splits the quote into word and whitespace tokens. Each word's characters are wrapped in a
 * no-wrap box so lines can only break at spaces, not between any two animated characters.
 */
function tokenize(quote: string): QuoteToken[] {
	let index = 0;
	return `“${quote}”`
		.split(/(\s+)/)
		.filter((part) => part.length > 0)
		.map((text) => {
			const chars = Array.from(text);
			const token = { text, chars, startIndex: index, isSpace: /^\s+$/.test(text) };
			index += chars.length;
			return token;
		});
}

const staggerDelay = (charIndex: number) => Math.min(charIndex * CHAR_STEP_MS, MAX_STAGGER_MS);

function useQuote(shouldLoad: boolean) {
	const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (!shouldLoad) return;
		setLoading(true);
		setFailed(false);
		fetchQuote()
			.then((result) => {
				if (result.quote === NO_QUOTE) setFailed(true);
				else setQuote({ text: result.quote, author: result.author });
			})
			.catch(() => setFailed(true))
			.finally(() => setLoading(false));
	}, [shouldLoad]);

	return { quote, loading, failed };
}

export function QuoteWidget() {
	const { motdEnabled, hideQuote } = config.value;
	const isVisible = motdEnabled && authenticated.value && !hideQuote;
	const { quote, loading, failed } = useQuote(isVisible);
	const tokens = useMemo(() => (quote ? tokenize(quote.text) : []), [quote]);

	if (!isVisible || loading || failed || !quote) return null;

	const totalChars = tokens.reduce((sum, token) => sum + token.chars.length, 0);
	const authorDelay = staggerDelay(totalChars) + AUTHOR_GAP_MS;

	return (
		<div class={styles.quoteWidget} data-context-menu="quote">
			<span class={styles.quoteText}>
				{tokens.map((token, i) =>
					token.isSpace ? (
						token.text
					) : (
						<span key={i} class={styles.quoteWord}>
							{token.chars.map((char, j) => (
								<span
									key={j}
									class={styles.inkChar}
									style={{ animationDelay: `${staggerDelay(token.startIndex + j)}ms` }}
								>
									{char}
								</span>
							))}
						</span>
					)
				)}
			</span>
			<span class={styles.quoteAuthor} style={{ animationDelay: `${authorDelay}ms` }}>
				— {quote.author}
			</span>
		</div>
	);
}
