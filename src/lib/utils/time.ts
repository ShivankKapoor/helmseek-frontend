export type ClockFormat = '12h' | '24h';

const pad = (n: number) => String(n).padStart(2, '0');

export function getGreeting(date: Date): string {
	const hour = date.getHours();
	if (hour < 5 || hour >= 22) return 'Good Night';
	if (hour < 12) return 'Good Morning';
	if (hour < 17) return 'Good Afternoon';
	return 'Good Evening';
}

export function formatClock(date: Date, format: ClockFormat, showSeconds: boolean): string {
	const hours = date.getHours();
	const minutes = pad(date.getMinutes());
	const seconds = showSeconds ? `:${pad(date.getSeconds())}` : '';

	if (format === '24h') return `${pad(hours)}:${minutes}${seconds}`;
	const period = hours < 12 ? 'AM' : 'PM';
	return `${hours % 12 || 12}:${minutes}${seconds} ${period}`;
}

export function formatDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}
