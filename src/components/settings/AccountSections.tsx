import { useState } from 'preact/hooks';
import { hideQuote, unhideQuote } from '@/lib/api/quote';
import { saveConfig } from '@/lib/api/config';
import { config, updateAndSave, updateConfig } from '@/lib/state/config';
import { signOut } from '@/lib/state/session';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { cx } from '@/lib/utils/cx';
import { SettingSection, ToggleRow } from './SettingControls';
import styles from './Settings.module.css';

// The sections below only make sense with a server session, so Settings shows them when signed in.

export function QuoteSection() {
	const { motdEnabled, hideQuote: isHidden } = config.value;

	// Hiding goes through its own endpoint: POST /user/config ignores `hideQuote`.
	async function toggleHidden(hidden: boolean) {
		updateConfig({ hideQuote: hidden });
		try {
			await (hidden ? hideQuote() : unhideQuote());
		} catch {
			// Best effort: the local setting still reflects the user's choice.
		}
	}

	return (
		<SettingSection title="Quote of the Day">
			<div class={styles.widgetManager}>
				<ToggleRow
					label="Enable Quote of the Day"
					checked={motdEnabled}
					onChange={(enabled) => updateAndSave({ motdEnabled: enabled })}
				/>
				<ToggleRow label="Hide today's quote" checked={isHidden} onChange={toggleHidden} />
			</div>
		</SettingSection>
	);
}

export function SyncSection() {
	const { isSyncing, message, runSync } = useSyncStatus();

	const syncToServer = () =>
		runSync(
			() => saveConfig(config.value),
			'Configuration synced to server successfully!',
			'Failed to sync configuration to server.'
		);

	return (
		<SettingSection title="Configuration Sync">
			<div class={styles.widgetManager}>
				<p class={styles.syncDescription}>
					Sync your configuration with the server to access it across devices.
				</p>
				<div class={styles.syncActions}>
					<button class={cx(styles.syncBtn, styles.syncToServer)} onClick={syncToServer} disabled={isSyncing}>
						<i
							class={cx('bi', isSyncing ? `bi-arrow-clockwise ${styles.syncSpinning}` : 'bi-cloud-upload')}
							aria-hidden="true"
						/>
						{isSyncing ? 'Syncing...' : 'Sync to Server'}
					</button>
				</div>
				{message && <div class={cx(styles.syncMessage, styles[message.type])}>{message.text}</div>}
			</div>
		</SettingSection>
	);
}

export function AccountSection({ onSignedOut }: { onSignedOut: () => void }) {
	const [isSigningOut, setIsSigningOut] = useState(false);

	async function handleSignOut() {
		setIsSigningOut(true);
		await signOut();
		onSignedOut();
	}

	return (
		<SettingSection title="Account">
			<div class={styles.widgetManager}>
				<div class={styles.syncActions}>
					<button class={styles.logoutBtn} onClick={handleSignOut} disabled={isSigningOut}>
						<i
							class={cx('bi', isSigningOut ? `bi-arrow-clockwise ${styles.syncSpinning}` : 'bi-box-arrow-right')}
							aria-hidden="true"
						/>
						{isSigningOut ? 'Signing out...' : 'Sign Out'}
					</button>
				</div>
			</div>
		</SettingSection>
	);
}
