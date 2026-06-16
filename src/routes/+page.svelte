<script lang="ts">
	import HeroWidget from '$lib/components/HeroWidget.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import WeatherWidget from '$lib/components/WeatherWidget.svelte';
	import QuickLinks from '$lib/components/QuickLinks.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import SignInModal from '$lib/components/SignInModal.svelte';
	import UserInfoModal from '$lib/components/UserInfoModal.svelte';
	import { authState } from '$lib/state/auth.svelte';

	let accountOpen = $state(false);
</script>

<svelte:head>
	<title>Helm Seek</title>
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<!-- Hero widget (absolutely positioned above search) -->
<HeroWidget />

<!-- Weather widget (fixed corner) -->
<WeatherWidget />

<!-- Main search area (centered by body flex) -->
<main role="main">
	<h1 class="visually-hidden">Helm Seek - Advanced Search Dashboard</h1>
	<SearchBar />
</main>

<!-- Settings (renders its own trigger button + modal) -->
<Settings />

<!-- Account button -->
<button
	class="account-button"
	title="Account"
	aria-label="Account"
	onclick={() => { accountOpen = true; }}
>
	<i class={authState.checking ? 'bi-arrow-clockwise spin' : authState.authenticated ? 'bi-person-check-fill' : 'bi-person-circle'} aria-hidden="true"></i>
</button>

<!-- Quick links (fixed corners) -->
<QuickLinks />

<!-- Auth modals -->
{#if authState.authenticated}
	<UserInfoModal bind:open={accountOpen} />
{:else}
	<SignInModal bind:open={accountOpen} />
{/if}

<!-- Footer -->
<div class="footer">
	<span class="desktop-footer">
		Powered by Google | © {new Date().getFullYear()}
		<a href="https://shivankkapoor.com" target="_blank" rel="noopener noreferrer">Shivank Kapoor</a>.
		All rights reserved.
	</span>
	<span class="mobile-footer">
		Powered by Google | © {new Date().getFullYear()}
		<a href="https://shivankkapoor.com" target="_blank" rel="noopener noreferrer">S. Kapoor</a>
	</span>
</div>

<style>
	main {
		position: relative;
		width: 100%;
		display: flex;
		justify-content: center;
	}
</style>
