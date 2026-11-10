import { useState } from 'preact/hooks';

const MESSAGE_VISIBLE_MS = 3000;

interface SyncMessage {
	text: string;
	type: 'success' | 'error';
}

/** Tracks a sync action's progress and shows its outcome briefly. */
export function useSyncStatus() {
	const [isSyncing, setIsSyncing] = useState(false);
	const [message, setMessage] = useState<SyncMessage | null>(null);

	async function runSync(action: () => Promise<void>, successText: string, failureText: string) {
		setIsSyncing(true);
		setMessage(null);
		try {
			await action();
			setMessage({ text: successText, type: 'success' });
		} catch {
			setMessage({ text: failureText, type: 'error' });
		} finally {
			setIsSyncing(false);
			setTimeout(() => setMessage(null), MESSAGE_VISIBLE_MS);
		}
	}

	return { isSyncing, message, runSync };
}
