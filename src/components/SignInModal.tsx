import { useState } from 'preact/hooks';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchConfig } from '@/lib/api/config';
import { setAuthenticated } from '@/lib/state/auth';
import { isBackdropClick } from '@/lib/utils/dom';
import { replaceConfig } from '@/lib/state/config';
import { rememberSignedIn } from '@/lib/state/session';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import styles from './SignInModal.module.css';

interface SignInModalProps {
	open: boolean;
	onClose: () => void;
}

export function SignInModal({ open, onClose }: SignInModalProps) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	function close() {
		setUsername('');
		setPassword('');
		setErrorMessage('');
		onClose();
	}

	useEscapeKey(open, close);

	if (!open) return null;

	// Preact's input typings accept one literal `type` per element, so widen the toggled value.
	const passwordInputType = (showPassword ? 'text' : 'password') as 'text';

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!username || !password || isLoading) return;

		setIsLoading(true);
		setErrorMessage('');

		try {
			await login(username, password);
		} catch (error) {
			setErrorMessage(
				error instanceof ApiError && error.status === 401
					? 'Invalid username or password.'
					: 'Something went wrong. Please try again.'
			);
			setIsLoading(false);
			return;
		}

		rememberSignedIn();
		try {
			const serverConfig = await fetchConfig();
			replaceConfig(serverConfig);
			setAuthenticated(serverConfig.username);
		} catch {
			// Logged in, but couldn't load the saved config — keep the local one.
			setAuthenticated();
		}
		setIsLoading(false);
		close();
	}

	return (
		<div class={styles.signinBackdrop} onClick={(event) => isBackdropClick(event) && close()}>
			<div class={styles.signinModal} role="dialog" aria-modal="true" aria-labelledby="signin-title">
				<div class={styles.signinHeader}>
					<h3 id="signin-title">Sign In</h3>
					<button class={styles.closeBtn} onClick={close} aria-label="Close">
						<i class="bi bi-x" aria-hidden="true" />
					</button>
				</div>

				<div class={styles.signinContent}>
					<form onSubmit={handleSubmit}>
						<div class={styles.formGroup}>
							<label for="si-username">Username</label>
							<input
								id="si-username"
								type="text"
								value={username}
								onInput={(e) => setUsername(e.currentTarget.value)}
								placeholder="Enter your username"
								autocomplete="username"
								maxLength={50}
								disabled={isLoading}
							/>
						</div>

						<div class={styles.formGroup}>
							<label for="si-password">Password</label>
							<div class={styles.passwordInputWrapper}>
								<input
									id="si-password"
									type={passwordInputType}
									value={password}
									onInput={(e) => setPassword(e.currentTarget.value)}
									placeholder="Enter your password"
									autocomplete="current-password"
									disabled={isLoading}
								/>
								<button
									type="button"
									class={styles.passwordToggle}
									onClick={() => setShowPassword(!showPassword)}
									aria-label="Toggle password visibility"
								>
									<i class={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true" />
								</button>
							</div>
						</div>

						<div class={styles.formActions}>
							<button type="submit" class={styles.signinBtn} disabled={!username || !password || isLoading}>
								{isLoading ? (
									<span class={styles.loadingSpinner}>
										<i class="bi bi-arrow-clockwise" aria-hidden="true" /> Signing in...
									</span>
								) : (
									'Sign In'
								)}
							</button>
						</div>

						{errorMessage && (
							<div class={styles.generalError} role="alert">
								{errorMessage}
							</div>
						)}
					</form>

					<div class={styles.signinFooter}>
						<p>Account Creation is currently disabled.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
