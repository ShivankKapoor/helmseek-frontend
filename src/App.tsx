import { useState } from 'preact/hooks';
import { authenticated, checking } from '@/lib/state/auth';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';
import { AppContextMenu } from '@/components/AppContextMenu';
import { HeroWidget } from '@/components/HeroWidget';
import { QuickLinks } from '@/components/QuickLinks';
import { QuoteWidget } from '@/components/QuoteWidget';
import { SearchBar } from '@/components/SearchBar';
import { SignInModal } from '@/components/SignInModal';
import { Toast } from '@/components/Toast';
import { UserInfoModal } from '@/components/UserInfoModal';
import { WeatherWidget } from '@/components/WeatherWidget';
import { Settings } from '@/components/settings/Settings';

function accountIcon(): string {
	if (checking.value) return 'bi-arrow-clockwise spin';
	return authenticated.value ? 'bi-person-check-fill' : 'bi-person-circle';
}

export function App() {
	const [accountOpen, setAccountOpen] = useState(false);
	const closeAccount = () => setAccountOpen(false);

	useApplyTheme();
	useSessionBootstrap();

	return (
		<>
			<HeroWidget />
			<WeatherWidget />

			<main>
				<h1 class="visually-hidden">Helm Seek - Advanced Search Dashboard</h1>
				<SearchBar />
				<QuoteWidget />
			</main>

			<Settings />

			<button
				class="account-button"
				title="Account"
				aria-label="Account"
				onClick={() => setAccountOpen(true)}
			>
				<i class={accountIcon()} aria-hidden="true" />
			</button>

			<QuickLinks />

			{authenticated.value ? (
				<UserInfoModal open={accountOpen} onClose={closeAccount} />
			) : (
				<SignInModal open={accountOpen} onClose={closeAccount} />
			)}

			<Footer />
			<Toast />
			<AppContextMenu />
		</>
	);
}

function Footer() {
	const year = new Date().getFullYear();
	return (
		<div class="footer">
			<span class="desktop-footer">
				Powered by Google | © {year}{' '}
				<a href="https://shivankkapoor.com" target="_blank" rel="noopener noreferrer">
					Shivank Kapoor
				</a>
				. All rights reserved.
			</span>
			<span class="mobile-footer">
				Powered by Google | © {year}{' '}
				<a href="https://shivankkapoor.com" target="_blank" rel="noopener noreferrer">
					S. Kapoor
				</a>
			</span>
		</div>
	);
}
