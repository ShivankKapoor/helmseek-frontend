import { FONT_OPTIONS, type UserConfig } from '@/lib/types/config';
import { hexToRgb } from '@/lib/utils/colors';

const DEFAULT_FONT = FONT_OPTIONS[0];
const FONT_LINK_ID = 'google-fonts';

/** The Google Fonts stylesheet for one font. */
export function fontStylesheetUrl(fontName: string): string {
	return `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600&display=swap`;
}

function applyColors(selectedColor: string) {
	const [primary, secondary] = selectedColor.split(',');
	const style = document.documentElement.style;
	style.setProperty('--button-bg', primary);
	style.setProperty('--button-hover', secondary ?? primary);
	style.setProperty('--button-bg-rgb', hexToRgb(primary));
}

export function applyFont(fontFamily: string) {
	const font = FONT_OPTIONS.find((option) => option.name === fontFamily) ?? DEFAULT_FONT;
	const url = fontStylesheetUrl(font.name);

	// Reuse one <link> and only change it when the font does, so the stylesheet isn't reloaded.
	let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
	if (!link) {
		link = document.createElement('link');
		link.id = FONT_LINK_ID;
		link.rel = 'stylesheet';
		document.head.appendChild(link);
	}
	if (link.getAttribute('href') !== url) link.href = url;

	document.documentElement.style.setProperty('--font-family', `"${font.name}", ${font.fallback}`);
}

/** Applies the color scheme and dark mode. Cheap, and safe to do before the app renders. */
export function applyAppearance({ selectedColor, themeMode }: Pick<UserConfig, 'selectedColor' | 'themeMode'>) {
	applyColors(selectedColor);
	document.body.classList.toggle('dark', themeMode === 'dark');
}

/** Applies the colors, dark mode and font from the config to the page. */
export function applyTheme(config: Pick<UserConfig, 'selectedColor' | 'themeMode' | 'fontFamily'>) {
	applyAppearance(config);
	applyFont(config.fontFamily);
}
