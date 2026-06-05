<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { configState } from '$lib/state/config.svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { toastState } from '$lib/state/toast.svelte';
	import { fetchConfig } from '$lib/api/config';
	import { ApiError, setUnauthorizedHandler } from '$lib/api/client';
	import { hexToRgb } from '$lib/utils/colors';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();

	// Apply theme class and color CSS vars whenever config changes
	$effect(() => {
		const [primary, secondary] = configState.config.selectedColor.split(',');
		document.documentElement.style.setProperty('--button-bg', primary);
		document.documentElement.style.setProperty('--button-hover', secondary ?? primary);
		document.documentElement.style.setProperty('--button-bg-rgb', hexToRgb(primary));
		document.body.classList.toggle('dark', configState.config.themeMode === 'dark');
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
			authState.setAuthenticated();
		} catch (e) {
			authState.setUnauthenticated();
		}
	}
</script>

{@render children()}
<Toast />
