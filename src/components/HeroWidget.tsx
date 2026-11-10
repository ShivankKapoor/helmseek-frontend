import { config } from '@/lib/state/config';
import { useNow } from '@/hooks/useNow';
import { formatClock, formatDate, getGreeting } from '@/lib/utils/time';
import styles from './HeroWidget.module.css';

const SECONDS_TICK_MS = 1000;
const MINUTES_TICK_MS = 30_000;

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
