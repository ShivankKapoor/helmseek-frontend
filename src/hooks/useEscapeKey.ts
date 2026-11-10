import { useEffect } from 'preact/hooks';

/** Calls `onEscape` when Escape is pressed, while `active` is true. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
	useEffect(() => {
		if (!active) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onEscape();
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [active, onEscape]);
}
