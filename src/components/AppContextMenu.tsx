import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { hideQuote } from '@/lib/api/quote';
import { authenticated } from '@/lib/state/auth';
import { updateConfig } from '@/lib/state/config';
import { openSettings } from '@/lib/state/settingsUi';
import { syncWeather } from '@/lib/state/weather';
import { isHttpUrl } from '@/lib/utils/url';
import styles from './AppContextMenu.module.css';

interface MenuState {
	/** Where the pointer was when the menu was requested. The menu is nudged on screen if it needs room. */
	x: number;
	y: number;
	/** Value of the clicked element's closest `data-context-menu` attribute, if any. */
	context: string | null;
	/** For a quick link, the address it points to (from `data-link-url`). */
	linkUrl: string | null;
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
			const source = (event.target as HTMLElement).closest<HTMLElement>('[data-context-menu]');
			setMenu({
				x: event.clientX,
				y: event.clientY,
				context: source?.dataset.contextMenu ?? null,
				linkUrl: source?.dataset.linkUrl ?? null
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

	// Only offer to open addresses that are safe to launch (never `javascript:` and the like).
	const linkUrl = menu.context === 'link' && menu.linkUrl && isHttpUrl(menu.linkUrl) ? menu.linkUrl : null;

	return (
		// The unit is written out: Preact does not add "px" to a bare number in a style.
		<div ref={menuRef} class={styles.appContextMenu} style={`top: ${menu.y}px; left: ${menu.x}px`} role="menu">
			{linkUrl && (
				<>
					<a class={styles.appContextMenuItem} role="menuitem" href={linkUrl} target="_blank" rel="noopener noreferrer">
						<i class="bi bi-box-arrow-up-right" aria-hidden="true" /> Open in new tab
					</a>
					<a class={styles.appContextMenuItem} role="menuitem" href={linkUrl}>
						<i class="bi bi-window" aria-hidden="true" /> Open in current tab
					</a>
				</>
			)}
			{menu.context === 'quote' && (
				<button class={styles.appContextMenuItem} role="menuitem" onClick={hideQuoteUntilTomorrow}>
					<i class="bi bi-eye-slash-fill" aria-hidden="true" /> Hide until tomorrow
				</button>
			)}
			{menu.context === 'weather' && authenticated.value && (
				<button class={styles.appContextMenuItem} role="menuitem" onClick={() => syncWeather()}>
					<i class="bi bi-arrow-repeat" aria-hidden="true" /> Sync
				</button>
			)}
			<button class={styles.appContextMenuItem} role="menuitem" onClick={openSettings}>
				<i class="bi bi-gear-fill" aria-hidden="true" /> Settings
			</button>
		</div>
	);
}
