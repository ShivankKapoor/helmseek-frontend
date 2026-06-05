<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { configState } from '$lib/state/config.svelte';
	import { login } from '$lib/api/auth';
	import { fetchConfig } from '$lib/api/config';
	import { ApiError } from '$lib/api/client';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let username = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isLoading = $state(false);
	let errorMessage = $state('');

	function close() { open = false; username = ''; password = ''; errorMessage = ''; }

	async function onSubmit() {
		if (!username || !password || isLoading) return;
		isLoading = true;
		errorMessage = '';
		try {
			await login(username, password);
			const config = await fetchConfig();
			configState.replace(config);
			authState.setAuthenticated();
			localStorage.setItem('helm_was_authenticated', '1');
			close();
		} catch (e) {
			if (e instanceof ApiError && e.status === 401) {
				errorMessage = 'Invalid username or password.';
			} else {
				errorMessage = 'Something went wrong. Please try again.';
			}
		} finally {
			isLoading = false;
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="signin-backdrop" onclick={(e) => { if (e.target === e.currentTarget) close(); }}
		onkeydown={(e) => e.key === 'Escape' && close()}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="signin-modal" onclick={(e) => e.stopPropagation()}>
			<div class="signin-header">
				<h3>Sign In</h3>
				<button class="close-btn" onclick={close} aria-label="Close">
					<i class="bi bi-x"></i>
				</button>
			</div>

			<div class="signin-content">
				<form onsubmit={(e) => { e.preventDefault(); onSubmit(); }}>
					<div class="form-group">
						<label for="si-username">Username</label>
						<input id="si-username" type="text" bind:value={username}
							placeholder="Enter your username"
							autocomplete="username"
							maxlength="50"
							disabled={isLoading} />
					</div>

					<div class="form-group">
						<label for="si-password">Password</label>
						<div class="password-input-wrapper">
							<input id="si-password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="Enter your password"
								autocomplete="current-password"
								disabled={isLoading} />
							<button type="button" class="password-toggle"
								onclick={() => { showPassword = !showPassword; }}
								aria-label="Toggle password visibility">
								<i class={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
							</button>
						</div>
					</div>

					<div class="form-actions">
						<button type="submit" class="signin-btn" disabled={!username || !password || isLoading}>
							{#if isLoading}
								<span class="loading-spinner"><i class="bi bi-arrow-clockwise"></i> Signing in...</span>
							{:else}
								Sign In
							{/if}
						</button>
					</div>

					{#if errorMessage}
						<div class="general-error">{errorMessage}</div>
					{/if}
				</form>

				<div class="signin-footer">
					<p>Account Creation is currently disabled.</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.signin-backdrop {
		position: fixed;
		top: 0; left: 0;
		width: 100%; height: 100%;
		background: rgba(0,0,0,0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		animation: fadeIn 0.2s ease-out;
	}

	.signin-modal {
		background: var(--input-bg);
		border-radius: 12px;
		min-width: 400px;
		max-width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 25px rgba(0,0,0,0.3);
		color: var(--text-color);
		animation: slideIn 0.3s ease-out;
	}

	.signin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid rgba(128,128,128,0.2);
	}

	.signin-header h3 {
		margin: 0;
		font-family: "Fira Code", monospace;
		font-size: 20px;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-color);
		font-size: 20px;
		cursor: pointer;
		padding: 8px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		transition: background 0.2s;
	}

	.close-btn:hover { background: rgba(128,128,128,0.15); }

	.signin-content { padding: 24px; }
	.signin-content form { margin-bottom: 20px; }

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-family: "Fira Code", monospace;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-color);
	}

	.form-group input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid rgba(128,128,128,0.3);
		border-radius: 8px;
		background: var(--input-bg);
		color: var(--input-text);
		font-family: "Fira Code", monospace;
		font-size: 14px;
		transition: border-color 0.3s, box-shadow 0.3s;
		box-sizing: border-box;
		outline: none;
	}

	.form-group input:focus {
		border-color: var(--button-bg);
		box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
	}

	.form-group input::placeholder { color: var(--footer-color); }
	.form-group input:disabled { opacity: 0.7; }

	.password-input-wrapper { position: relative; }
	.password-input-wrapper input { padding-right: 48px; }

	.password-toggle {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: var(--footer-color);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: color 0.2s;
		font-size: 16px;
	}

	.password-toggle:hover { color: var(--text-color); }

	.form-actions { margin-top: 24px; }

	.signin-btn {
		width: 100%;
		padding: 14px 20px;
		border: none;
		border-radius: 8px;
		background: var(--button-bg);
		color: #fff;
		font-family: "Fira Code", monospace;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.3s, transform 0.1s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.signin-btn:hover:not(:disabled) { background: var(--button-hover); transform: translateY(-1px); }
	.signin-btn:active:not(:disabled) { transform: translateY(0); }
	.signin-btn:disabled { background: var(--footer-color); cursor: not-allowed; }

	.loading-spinner {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.loading-spinner i { animation: spin 1s linear infinite; }

	.general-error {
		margin-top: 16px;
		padding: 12px;
		background: rgba(234, 67, 53, 0.1);
		border: 1px solid rgba(234, 67, 53, 0.3);
		border-radius: 6px;
		color: #ea4335;
		font-size: 14px;
		font-family: "Fira Code", monospace;
		text-align: center;
		word-wrap: break-word;
	}

	.signin-footer {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid rgba(128,128,128,0.2);
		text-align: center;
	}

	.signin-footer p {
		margin: 8px 0;
		font-family: "Fira Code", monospace;
		font-size: 14px;
		color: var(--footer-color);
	}

	@keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
	@keyframes slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
	@keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

	@media (max-width: 480px) {
		.signin-modal { min-width: auto; width: 95vw; }
		.signin-header { padding: 16px; }
		.signin-header h3 { font-size: 18px; }
		.signin-content { padding: 20px; }
		.form-group input { font-size: 16px; }
	}
</style>
