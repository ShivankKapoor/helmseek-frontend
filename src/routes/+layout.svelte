<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { configState } from '$lib/state/config.svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { toastState } from '$lib/state/toast.svelte';
	import { fetchConfig } from '$lib/api/config';
	import { ApiError, setUnauthorizedHandler } from '$lib/api/client';
	import { hexToRgb } from '$lib/utils/colors';
	import { FONT_OPTIONS } from '$lib/types/config';
	import Toast from '$lib/components/Toast.svelte';
	import AppContextMenu from '$lib/components/AppContextMenu.svelte';

	let { children } = $props();

	// Apply theme, color, and font CSS vars whenever config changes
	$effect(() => {
		const [primary, secondary] = configState.config.selectedColor.split(',');
		document.documentElement.style.setProperty('--button-bg', primary);
		document.documentElement.style.setProperty('--button-hover', secondary ?? primary);
		document.documentElement.style.setProperty('--button-bg-rgb', hexToRgb(primary));
		document.body.classList.toggle('dark', configState.config.themeMode === 'dark');

		const match = FONT_OPTIONS.find((f) => f.name === (configState.config.fontFamily ?? 'Fira Code'));
		const font = match?.name ?? 'Fira Code';
		const fallback = match?.fallback ?? 'monospace';
		let link = document.getElementById('google-fonts') as HTMLLinkElement | null;
		if (!link) {
			link = document.createElement('link');
			link.id = 'google-fonts';
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		}
		link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600&display=swap`;
		document.documentElement.style.setProperty('--font-family', `"${font}", ${fallback}`);
	});

	onMount(() => {
		configState.load();
		checkSession();
		setUnauthorizedHandler(() => {
			const wasLoggedIn = localStorage.getItem('helm_was_authenticated') !== null;
			localStorage.removeItem('helm_was_authenticated');
			authState.setUnauthenticated();
			configState.reset();
			configState.load();
			if (wasLoggedIn) {
				toastState.show('Session expired — please sign in again', 'error');
			}
		});
	});

	async function checkSession() {
		try {
			const config = await fetchConfig();
			configState.replace(config);
			authState.setAuthenticated(config.username);
		} catch (e) {
			authState.setUnauthenticated();
		}
	}
</script>

{@render children()}
<Toast />
<AppContextMenu />
