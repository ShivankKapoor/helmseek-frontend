import { useEffect, useRef, useState } from 'preact/hooks';
import { config, updateAndSave } from '@/lib/state/config';
import { FONT_OPTIONS } from '@/lib/types/config';
import { cx } from '@/lib/utils/cx';
import styles from './Settings.module.css';

const ALL_FONTS_LINK_ID = 'google-fonts-all';

/** Loads every font once, so each option in the list can be previewed in its own typeface. */
function loadAllFonts() {
	if (document.getElementById(ALL_FONTS_LINK_ID)) return;
	const families = FONT_OPTIONS.map((font) => `family=${font.name.replace(/ /g, '+')}`).join('&');
	const link = document.createElement('link');
	link.id = ALL_FONTS_LINK_ID;
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
	document.head.appendChild(link);
}

export function FontPicker() {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const selected = config.value.fontFamily;

	useEffect(loadAllFonts, []);

	// Close when clicking anywhere outside the picker.
	useEffect(() => {
		if (!open) return;
		const closeOnOutsideClick = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener('click', closeOnOutsideClick);
		return () => document.removeEventListener('click', closeOnOutsideClick);
	}, [open]);

	return (
		<div ref={containerRef} class={cx(styles.fontDropdown, open && styles.open)}>
			<button
				type="button"
				class={styles.fontDropdownTrigger}
				style={{ fontFamily: `'${selected}', sans-serif` }}
				onClick={() => setOpen(!open)}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				{selected}
				<i class={cx('bi bi-chevron-down', styles.fontChevron)} aria-hidden="true" />
			</button>

			{open && (
				<ul class={styles.fontDropdownList} role="listbox">
					{FONT_OPTIONS.map((font) => (
						<li key={font.name} role="option" aria-selected={selected === font.name}>
							<button
								type="button"
								class={cx(styles.fontDropdownOption, selected === font.name && styles.selected)}
								style={{ fontFamily: `'${font.name}', ${font.fallback}` }}
								onClick={() => {
									updateAndSave({ fontFamily: font.name });
									setOpen(false);
								}}
							>
								{font.name}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
