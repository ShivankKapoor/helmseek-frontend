<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { configState } from '$lib/state/config.svelte';
	import { logout } from '$lib/api/auth';
	import { saveConfig, fetchConfig } from '$lib/api/config';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let isSyncing = $state(false);
	let syncMessage = $state('');
	let syncMessageType = $state<'success' | 'error'>('success');

	function close() { open = false; }

	async function syncToServer() {
		isSyncing = true; syncMessage = '';
		try {
			await saveConfig(configState.config);
			syncMessage = 'Configuration synced to server successfully!';
			syncMessageType = 'success';
		} catch {
			syncMessage = 'Failed to sync configuration to server.';
			syncMessageType = 'error';
		} finally {
			isSyncing = false;
			setTimeout(() => { syncMessage = ''; }, 3000);
		}
	}

	async function syncFromServer() {
		isSyncing = true; syncMessage = '';
		try {
			const config = await fetchConfig();
			configState.replace(config);
			syncMessage = 'Configuration synced from server successfully!';
			syncMessageType = 'success';
		} catch {
			syncMessage = 'No configuration found on server or sync failed.';
			syncMessageType = 'error';
		} finally {
			isSyncing = false;
			setTimeout(() => { syncMessage = ''; }, 3000);
		}
	}

	async function onLogout() {
		try { await logout(); } catch { /* ignore */ }
		localStorage.removeItem('helm_was_authenticated');
		configState.reset();
		authState.setUnauthenticated();
		configState.load();
		close();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="overlay" onclick={close} onkeydown={(e) => e.key === 'Escape' && close()}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="popup" onclick={(e) => e.stopPropagation()}>
			<div class="popup-header">
				<h3>Account Info</h3>
				<button class="close-button" onclick={close} aria-label="Close">
					<i class="bi-x-lg"></i>
				</button>
			</div>

			<div class="popup-content">
				<div class="user-info">
					<div class="user-avatar"><i class="bi-person-circle"></i></div>
					<div class="user-details">
						<div class="username">{authState.username || 'Signed In'}</div>
					</div>
				</div>

				<div class="sync-section">
					<h4>Configuration Sync</h4>
					<p class="sync-description">Sync your configuration with the server to access it across devices.</p>
					<div class="sync-actions">
						<button class="sync-btn sync-to-server" onclick={syncToServer} disabled={isSyncing}>
							<i class="bi {isSyncing ? 'bi-arrow-clockwise sync-spinning' : 'bi-cloud-upload'}"></i>
							{isSyncing ? 'Syncing...' : 'Sync to Server'}
						</button>
						<button class="sync-btn sync-from-server" onclick={syncFromServer} disabled={isSyncing}>
							<i class="bi {isSyncing ? 'bi-arrow-clockwise sync-spinning' : 'bi-cloud-download'}"></i>
							{isSyncing ? 'Syncing...' : 'Sync from Server'}
						</button>
					</div>
					{#if syncMessage}
						<div class="sync-message {syncMessageType}">{syncMessage}</div>
					{/if}
				</div>

				<button class="logout-button" onclick={onLogout}>
					<i class="bi-box-arrow-right"></i>
					Logout
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.popup {
		background: var(--bg-color);
		border: 1px solid rgba(128,128,128,0.2);
		border-radius: 12px;
		width: 320px;
		max-width: 90vw;
		box-shadow: 0 20px 40px rgba(0,0,0,0.15);
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
	}

	:global(body.dark) .popup {
		background: #2d2d2d;
		border-color: #404040;
	}

	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(128,128,128,0.2);
	}

	.popup-header h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--text-color);
		flex: 1;
	}

	.close-button {
		background: none;
		border: none;
		color: var(--text-color);
		font-size: 16px;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.close-button:hover { background: rgba(128,128,128,0.15); }

	.popup-content { padding: 20px; }

	.user-info {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 24px;
	}

	.user-avatar { font-size: 48px; color: var(--button-bg); }

	.username {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-color);
	}

	.sync-section {
		margin-bottom: 24px;
		padding: 16px;
		border: 1px solid rgba(128,128,128,0.2);
		border-radius: 8px;
		background: rgba(128,128,128,0.04);
	}

	.sync-section h4 {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-color);
	}

	.sync-description {
		margin: 0 0 16px 0;
		color: var(--footer-color);
		font-size: 13px;
		line-height: 1.4;
	}

	.sync-actions {
		display: flex;
		gap: 8px;
		flex-direction: column;
		margin-bottom: 12px;
	}

	.sync-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border: 1px solid rgba(128,128,128,0.3);
		border-radius: 6px;
		background: var(--bg-color);
		color: var(--text-color);
		cursor: pointer;
		font-size: 13px;
		font-family: "Fira Code", monospace;
		transition: all 0.2s ease;
		justify-content: center;
		font-weight: 500;
	}

	.sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }

	.sync-to-server   { border-color: #28a745; }
	.sync-from-server { border-color: #17a2b8; }
	.sync-to-server:hover:not(:disabled)   { background: #28a745; color: white; }
	.sync-from-server:hover:not(:disabled) { background: #17a2b8; color: white; }

	.sync-spinning { animation: spin 1s linear infinite; }

	.sync-message { padding: 8px 12px; border-radius: 4px; font-size: 12px; text-align: center; }
	.sync-message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.sync-message.error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

	.logout-button {
		width: 100%;
		padding: 12px 16px;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		font-family: "Fira Code", monospace;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: background 0.2s;
	}

	.logout-button:hover { background: #c82333; }

	@keyframes slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
	@keyframes spin    { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
