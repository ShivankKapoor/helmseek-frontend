import type { QuickLink } from '@/lib/types/config';
import { cx } from '@/lib/utils/cx';
import styles from './Settings.module.css';

type Corner = QuickLink['corner'];

const CORNERS: Array<{ value: Corner; label: string; short: string; icon: string }> = [
	{ value: 'top-left', label: 'Top Left', short: 'TL', icon: 'bi bi-arrow-up-left' },
	{ value: 'top-right', label: 'Top Right', short: 'TR', icon: 'bi bi-arrow-up-right' },
	{ value: 'bottom-left', label: 'Bottom Left', short: 'BL', icon: 'bi bi-arrow-down-left' }
];

/** The same picker is used in two places with slightly different spacing. */
const VARIANTS = {
	compact: {
		grid: styles.weatherPositionGrid,
		button: styles.weatherPositionBtn,
		reserved: styles.weatherReservedPosition
	},
	roomy: {
		grid: styles.positionGrid,
		button: styles.positionBtn,
		reserved: styles.reservedPosition
	}
};

interface CornerPickerProps {
	value: Corner;
	onChange: (corner: Corner) => void;
	variant: keyof typeof VARIANTS;
}

/** Choose a screen corner. The fourth corner is always taken by the settings button. */
export function CornerPicker({ value, onChange, variant }: CornerPickerProps) {
	const classes = VARIANTS[variant];

	return (
		<div class={classes.grid}>
			{CORNERS.map((corner) => (
				<button
					key={corner.value}
					type="button"
					class={cx(classes.button, value === corner.value && styles.active)}
					onClick={() => onChange(corner.value)}
					title={corner.label}
					aria-pressed={value === corner.value}
				>
					<i class={corner.icon} aria-hidden="true" />
					<span>{corner.short}</span>
				</button>
			))}
			<div class={classes.reserved}>
				<i class="bi bi-gear-fill" aria-hidden="true" />
				<span>Reserved</span>
				<small>Settings</small>
			</div>
		</div>
	);
}
