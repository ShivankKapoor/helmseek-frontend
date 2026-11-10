import type { ComponentChildren } from 'preact';
import styles from './Settings.module.css';

/** A titled block in the settings modal. Section layout styles live in app.css. */
export function SettingSection({ title, children }: { title: string; children: ComponentChildren }) {
	return (
		<div class="setting-section">
			<label>{title}</label>
			{children}
		</div>
	);
}

interface ToggleRowProps {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
	return (
		<label class={styles.toggleRow}>
			<input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
			<span>{label}</span>
		</label>
	);
}
