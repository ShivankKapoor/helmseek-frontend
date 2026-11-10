import { useSignalEffect } from '@preact/signals';
import { config } from '@/lib/state/config';
import { applyTheme } from '@/lib/theme/applyTheme';

/** Keeps the page's colors, dark mode and font in sync with the config as it changes. */
export function useApplyTheme() {
	useSignalEffect(() => applyTheme(config.value));
}
