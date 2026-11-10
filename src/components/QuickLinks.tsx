import { useRef } from 'preact/hooks';
import { config } from '@/lib/state/config';
import type { QuickLink } from '@/lib/types/config';
import { cx } from '@/lib/utils/cx';
import styles from './QuickLinks.module.css';

const CORNERS = ['top-left', 'top-right', 'bottom-left'] as const;

function linksForCorner(links: QuickLink[], corner: QuickLink['corner']): QuickLink[] {
	return links
		.filter((link) => link.enabled && link.corner === corner)
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function QuickLinks() {
	const { quickLinksEnabled, quickLinks } = config.value;
	if (!quickLinksEnabled) return null;

	return (
		<>
			{CORNERS.map((corner) => {
				const links = linksForCorner(quickLinks, corner);
				if (links.length === 0) return null;
				return (
					<div key={corner} class={cx(styles.quickLinksCorner, styles[corner])}>
						{links.map((link) => (
							<QuickLinkItem key={link.id} link={link} />
						))}
					</div>
				);
			})}
		</>
	);
}

/** A link with a spotlight that follows the cursor. */
function QuickLinkItem({ link }: { link: QuickLink }) {
	const shineRef = useRef<HTMLDivElement>(null);

	function handleMouseMove(event: MouseEvent) {
		const shine = shineRef.current;
		if (!shine) return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		shine.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
		shine.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
		shine.style.opacity = '1';
	}

	function handleMouseLeave() {
		if (shineRef.current) shineRef.current.style.opacity = '0';
	}

	return (
		<a
			href={link.url}
			class={styles.quickLink}
			title={link.url}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<span class={styles.linkText}>{link.text}</span>
			<div ref={shineRef} class={styles.shineEffect} />
		</a>
	);
}
