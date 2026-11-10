import { useEffect, useState } from 'preact/hooks';
import { hideQuote } from '@/lib/api/quote';
import { updateConfig } from '@/lib/state/config';
import { openSettings } from '@/lib/state/settingsUi';
import styles from './AppContextMenu.module.css';

const MENU_WIDTH = 180;
const MENU_HEIGHT = 44;

interface MenuState {
	x: number;
	y: number;
	/** Value of the clicked element's closest `data-context-menu` attribute, if any. */
	context: string | null;
}

/** Replaces the browser's right-click menu. Shift+right-click still opens the native one. */
export function AppContextMenu() {
	const [menu, setMenu] = useState<MenuState | null>(null);

	useEffect(() => {
		const close = () => setMenu(null);
		const open = (event: MouseEvent) => {
			if (event.shiftKey) return;
			event.preventDefault();
			const target = event.target as HTMLElement;
			setMenu({
				// Keep the menu inside the viewport.
				x: Math.min(event.clientX, window.innerWidth - MENU_WIDTH),
				y: Math.min(event.clientY, window.innerHeight - MENU_HEIGHT),
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

	if (!menu) return null;

	function hideQuoteUntilTomorrow() {
		updateConfig({ hideQuote: true });
		// Best effort: the quote stays hidden in this browser even if the request fails.
		hideQuote().catch(() => {});
	}

	return (
		<div class={styles.appContextMenu} style={{ top: menu.y, left: menu.x }} role="menu">
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
