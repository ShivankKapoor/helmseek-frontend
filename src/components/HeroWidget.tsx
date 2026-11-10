import { config } from '@/lib/state/config';
import { useNow } from '@/hooks/useNow';
import styles from './HeroWidget.module.css';

type ClockFormat = '12h' | '24h';

const SECONDS_TICK_MS = 1000;
const MINUTES_TICK_MS = 30_000;

const pad = (n: number) => String(n).padStart(2, '0');

function getGreeting(date: Date): string {
	const hour = date.getHours();
	if (hour < 5 || hour >= 22) return 'Good Night';
	if (hour < 12) return 'Good Morning';
	if (hour < 17) return 'Good Afternoon';
	return 'Good Evening';
}

function formatClock(date: Date, format: ClockFormat, showSeconds: boolean): string {
	const hours = date.getHours();
	const minutes = pad(date.getMinutes());
	const seconds = showSeconds ? `:${pad(date.getSeconds())}` : '';

	if (format === '24h') return `${pad(hours)}:${minutes}${seconds}`;
	const period = hours < 12 ? 'AM' : 'PM';
	return `${hours % 12 || 12}:${minutes}${seconds} ${period}`;
}

function formatDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function HeroWidget() {
	const { heroEnabled, heroMode, heroClockFormat, heroShowSeconds, heroGreetingName } = config.value;
	const now = useNow(heroShowSeconds ? SECONDS_TICK_MS : MINUTES_TICK_MS);

	if (!heroEnabled || heroMode === 'none') return null;

	const showGreeting = heroMode === 'greeting' || heroMode === 'both';
	const showClock = heroMode === 'clock' || heroMode === 'both';
	const name = heroGreetingName.trim();

	const layoutClass = { clock: styles.heroClock, greeting: styles.heroGreeting, both: styles.heroBoth }[heroMode];

	return (
		<div class={styles.heroWidget}>
			<div class={layoutClass}>
				{showGreeting && <span class={styles.greetingText}>{getGreeting(now)}</span>}
				{showGreeting && name && <span class={styles.greetingName}>{name}</span>}
				{showClock && <span class={styles.time}>{formatClock(now, heroClockFormat, heroShowSeconds)}</span>}
				<span class={styles.date}>{formatDate(now)}</span>
			</div>
		</div>
	);
}
