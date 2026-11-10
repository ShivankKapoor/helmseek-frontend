import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { hideQuote } from '@/lib/api/quote';
import { updateConfig } from '@/lib/state/config';
import { openSettings } from '@/lib/state/settingsUi';
import styles from './AppContextMenu.module.css';

interface MenuState {
	/** Where the pointer was when the menu was requested. The menu is nudged on screen if it needs room. */
	x: number;
	y: number;
	/** Value of the clicked element's closest `data-context-menu` attribute, if any. */
	context: string | null;
}

/** Replaces the browser's right-click menu. Shift+right-click still opens the native one. */
export function AppContextMenu() {
	const [menu, setMenu] = useState<MenuState | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const close = () => setMenu(null);
		const open = (event: MouseEvent) => {
			if (event.shiftKey) return;
			event.preventDefault();
			const target = event.target as HTMLElement;
			setMenu({
				x: event.clientX,
				y: event.clientY,
				context: target.closest<HTMLElement>('[data-context-menu]')?.dataset.contextMenu ?? null
			});
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close();
		};

		window.addEventListener('contextmenu', open);
		window.addEventListener('click', close);
		window.addEventListener('keydown', closeOnEscape);
		return () => {
			window.removeEventListener('contextmenu', open);
			window.removeEventListener('click', close);
			window.removeEventListener('keydown', closeOnEscape);
		};
	}, []);

	// The menu's size depends on its items (it is taller with "Hide until tomorrow"), so measure it
	// and pull it back inside the window. This runs before the browser paints, so it never flickers.
	useLayoutEffect(() => {
		const element = menuRef.current;
		if (!element || !menu) return;
		const left = Math.max(0, Math.min(menu.x, window.innerWidth - element.offsetWidth));
		const top = Math.max(0, Math.min(menu.y, window.innerHeight - element.offsetHeight));
		element.style.left = `${left}px`;
		element.style.top = `${top}px`;
	}, [menu]);

	if (!menu) return null;

	function hideQuoteUntilTomorrow() {
		updateConfig({ hideQuote: true });
		// Best effort: the quote stays hidden in this browser even if the request fails.
		hideQuote().catch(() => {});
	}

	return (
		// The unit is written out: Preact does not add "px" to a bare number in a style.
		<div ref={menuRef} class={styles.appContextMenu} style={`top: ${menu.y}px; left: ${menu.x}px`} role="menu">
			{menu.context === 'quote' && (
				<button class={styles.appContextMenuItem} role="menuitem" onClick={hideQuoteUntilTomorrow}>
					<i class="bi bi-eye-slash-fill" aria-hidden="true" /> Hide until tomorrow
				</button>
			)}
			<button class={styles.appContextMenuItem} role="menuitem" onClick={openSettings}>
				<i class="bi bi-gear-fill" aria-hidden="true" /> Settings
			</button>
		</div>
	);
}
