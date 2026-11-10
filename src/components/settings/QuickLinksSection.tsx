import { useState } from 'preact/hooks';
import { config, updateAndSave } from '@/lib/state/config';
import { isBackdropClick } from '@/lib/utils/dom';
import type { QuickLink } from '@/lib/types/config';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { CornerPicker } from './CornerPicker';
import { SettingSection, ToggleRow } from './SettingControls';
import styles from './Settings.module.css';

const MAX_QUICK_LINKS = 10;
const MAX_LINK_TEXT_LENGTH = 20;

type LinkDraft = Pick<QuickLink, 'text' | 'url' | 'corner'>;

const EMPTY_DRAFT: LinkDraft = { text: '', url: '', corner: 'top-right' };

/** Which link the modal is editing; `'new'` means adding one, `null` means closed. */
type EditTarget = QuickLink | 'new' | null;

const formatCorner = (corner: string) =>
	corner
		.split('-')
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(' ');

export function QuickLinksSection() {
	const { quickLinksEnabled, quickLinks } = config.value;
	const [editTarget, setEditTarget] = useState<EditTarget>(null);

	function saveLink(draft: LinkDraft) {
		if (editTarget === 'new') {
			const link: QuickLink = {
				...draft,
				id: `ql_${crypto.randomUUID()}`,
				enabled: true,
				order: quickLinks.length
			};
			updateAndSave({ quickLinks: [...quickLinks, link] });
		} else if (editTarget) {
			const { id } = editTarget;
			updateAndSave({ quickLinks: quickLinks.map((link) => (link.id === id ? { ...link, ...draft } : link)) });
		}
		setEditTarget(null);
	}

	function removeLink(id: string) {
		updateAndSave({ quickLinks: quickLinks.filter((link) => link.id !== id) });
	}

	return (
		<SettingSection title="Quick Links">
			<div class={styles.widgetManager}>
				<ToggleRow
					label="Enable Quick Links"
					checked={quickLinksEnabled}
					onChange={(enabled) => updateAndSave({ quickLinksEnabled: enabled })}
				/>

				{quickLinksEnabled && (
					<div class={styles.quickLinksList}>
						{quickLinks.length === 0 && (
							<div class={styles.noLinksMessage}>
								<span>No quick links configured</span>
							</div>
						)}

						{quickLinks.map((link) => (
							<div key={link.id} class={styles.quickLinkItem}>
								<div class={styles.linkInfo}>
									<span class={styles.linkText}>{link.text}</span>
									<span class={styles.linkCorner}>{formatCorner(link.corner)}</span>
								</div>
								<div class={styles.linkActions}>
									<button
										class={`${styles.actionBtn} ${styles.editBtn}`}
										onClick={() => setEditTarget(link)}
										title="Edit"
										aria-label={`Edit ${link.text}`}
									>
										<i class="bi bi-pencil" aria-hidden="true" />
									</button>
									<button
										class={`${styles.actionBtn} ${styles.deleteBtn}`}
										onClick={() => removeLink(link.id)}
										title="Delete"
										aria-label={`Delete ${link.text}`}
									>
										<i class="bi bi-trash" aria-hidden="true" />
									</button>
								</div>
							</div>
						))}

						{quickLinks.length < MAX_QUICK_LINKS ? (
							<button class={styles.addLinkBtn} onClick={() => setEditTarget('new')}>
								<i class="bi bi-plus" aria-hidden="true" /> Add Quick Link
							</button>
						) : (
							<div class={styles.maxLinksMessage}>Maximum {MAX_QUICK_LINKS} quick links reached</div>
						)}
					</div>
				)}
			</div>

			{editTarget && (
				<LinkFormModal
					link={editTarget === 'new' ? null : editTarget}
					onSave={saveLink}
					onClose={() => setEditTarget(null)}
				/>
			)}
		</SettingSection>
	);
}

interface LinkFormModalProps {
	/** The link being edited, or null when adding a new one. */
	link: QuickLink | null;
	onSave: (draft: LinkDraft) => void;
	onClose: () => void;
}

function LinkFormModal({ link, onSave, onClose }: LinkFormModalProps) {
	const [draft, setDraft] = useState<LinkDraft>(
		link ? { text: link.text, url: link.url, corner: link.corner } : EMPTY_DRAFT
	);

	useEscapeKey(true, onClose);

	const canSave = draft.text !== '' && draft.url !== '';

	return (
		<div class={styles.quickLinkSettingsBackdrop} onClick={(event) => isBackdropClick(event) && onClose()}>
			<div class={styles.quickLinkSettingsModal} role="dialog" aria-modal="true" aria-labelledby="link-modal-title">
				<div class={styles.modalHeader}>
					<h3 id="link-modal-title">{link ? 'Edit Quick Link' : 'Add Quick Link'}</h3>
					<button class="close-btn" onClick={onClose} aria-label="Close">
						<i class="bi bi-x-lg" aria-hidden="true" />
					</button>
				</div>

				<div class={styles.modalContent}>
					<div class={styles.settingItem}>
						<label for="link-text">Link Text</label>
						<input
							id="link-text"
							type="text"
							value={draft.text}
							onInput={(e) => setDraft({ ...draft, text: e.currentTarget.value })}
							placeholder="e.g., Documentation, GitHub"
							maxLength={MAX_LINK_TEXT_LENGTH}
						/>
						<small>Maximum {MAX_LINK_TEXT_LENGTH} characters</small>
					</div>

					<div class={styles.settingItem}>
						<label for="link-url">URL</label>
						<input
							id="link-url"
							type="url"
							value={draft.url}
							onInput={(e) => setDraft({ ...draft, url: e.currentTarget.value })}
							placeholder="https://example.com"
						/>
						<small>Must start with http:// or https://</small>
					</div>

					<div class={styles.settingItem}>
						<label>Position</label>
						<CornerPicker variant="roomy" value={draft.corner} onChange={(corner) => setDraft({ ...draft, corner })} />
					</div>
				</div>

				<div class={styles.modalFooter}>
					<button class={styles.btnSecondary} onClick={onClose}>
						Cancel
					</button>
					<button class={styles.btnPrimary} onClick={() => onSave(draft)} disabled={!canSave}>
						{link ? 'Update' : 'Add'}
					</button>
				</div>
			</div>
		</div>
	);
}
