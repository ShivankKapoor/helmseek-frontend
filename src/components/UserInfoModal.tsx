import { fetchConfig, saveConfig } from '@/lib/api/config';
import { username } from '@/lib/state/auth';
import { config, replaceConfig } from '@/lib/state/config';
import { signOut } from '@/lib/state/session';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { cx } from '@/lib/utils/cx';
import styles from './UserInfoModal.module.css';

interface UserInfoModalProps {
	open: boolean;
	onClose: () => void;
}

export function UserInfoModal({ open, onClose }: UserInfoModalProps) {
	const { isSyncing, message, runSync } = useSyncStatus();

	useEscapeKey(open, onClose);

	if (!open) return null;

	const syncToServer = () =>
		runSync(
			() => saveConfig(config.value),
			'Configuration synced to server successfully!',
			'Failed to sync configuration to server.'
		);

	const syncFromServer = () =>
		runSync(
			async () => replaceConfig(await fetchConfig()),
			'Configuration synced from server successfully!',
			'No configuration found on server or sync failed.'
		);

	async function handleSignOut() {
		await signOut();
		onClose();
	}

	return (
		<div class={styles.overlay} onClick={onClose}>
			<div
				class={styles.popup}
				role="dialog"
				aria-modal="true"
				aria-labelledby="account-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div class={styles.popupHeader}>
					<h3 id="account-title">Account Info</h3>
					<button class={styles.closeButton} onClick={onClose} aria-label="Close">
						<i class="bi-x-lg" aria-hidden="true" />
					</button>
				</div>

				<div class={styles.popupContent}>
					<div class={styles.userInfo}>
						<div class={styles.userAvatar}>
							<i class="bi-person-circle" aria-hidden="true" />
						</div>
						<div class={styles.username}>{username.value || 'Signed In'}</div>
					</div>

					<div class={styles.syncSection}>
						<h4>Configuration Sync</h4>
						<p class={styles.syncDescription}>
							Sync your configuration with the server to access it across devices.
						</p>
						<div class={styles.syncActions}>
							<SyncButton
								className={styles.syncToServer}
								icon="bi-cloud-upload"
								label="Sync to Server"
								isSyncing={isSyncing}
								onClick={syncToServer}
							/>
							<SyncButton
								className={styles.syncFromServer}
								icon="bi-cloud-download"
								label="Sync from Server"
								isSyncing={isSyncing}
								onClick={syncFromServer}
							/>
						</div>
						{message && <div class={cx(styles.syncMessage, styles[message.type])}>{message.text}</div>}
					</div>

					<button class={styles.logoutButton} onClick={handleSignOut}>
						<i class="bi-box-arrow-right" aria-hidden="true" />
						Logout
					</button>
				</div>
			</div>
		</div>
	);
}

interface SyncButtonProps {
	className: string;
	icon: string;
	label: string;
	isSyncing: boolean;
	onClick: () => void;
}

function SyncButton({ className, icon, label, isSyncing, onClick }: SyncButtonProps) {
	return (
		<button class={cx(styles.syncBtn, className)} onClick={onClick} disabled={isSyncing}>
			<i class={`bi ${isSyncing ? 'bi-arrow-clockwise ' + styles.syncSpinning : icon}`} aria-hidden="true" />
			{isSyncing ? 'Syncing...' : label}
		</button>
	);
}
