import { useSignalEffect } from '@preact/signals';
import { config } from '@/lib/state/config';
import { FONT_OPTIONS } from '@/lib/types/config';
import { hexToRgb } from '@/lib/utils/colors';

const DEFAULT_FONT = FONT_OPTIONS[0];
const FONT_LINK_ID = 'google-fonts';

function applyColors(selectedColor: string) {
	const [primary, secondary] = selectedColor.split(',');
	const style = document.documentElement.style;
	style.setProperty('--button-bg', primary);
	style.setProperty('--button-hover', secondary ?? primary);
	style.setProperty('--button-bg-rgb', hexToRgb(primary));
}

function applyFont(fontFamily: string) {
	const font = FONT_OPTIONS.find((option) => option.name === fontFamily) ?? DEFAULT_FONT;

	let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
	if (!link) {
		link = document.createElement('link');
		link.id = FONT_LINK_ID;
		link.rel = 'stylesheet';
		document.head.appendChild(link);
	}
	link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, '+')}:wght@400;500;600&display=swap`;
	document.documentElement.style.setProperty('--font-family', `"${font.name}", ${font.fallback}`);
}

/** Keeps the page's CSS variables, dark-mode class and web font in sync with the config. */
export function useApplyTheme() {
	useSignalEffect(() => {
		const { selectedColor, themeMode, fontFamily } = config.value;
		applyColors(selectedColor);
		document.body.classList.toggle('dark', themeMode === 'dark');
		applyFont(fontFamily);
	});
}
