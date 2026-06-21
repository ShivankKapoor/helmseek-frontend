<script lang="ts">
	import { toastState } from '$lib/state/toast.svelte';
</script>

<div class="toast-container">
	{#each toastState.toasts as toast (toast.id)}
		<div class="toast {toast.type}">
			<div class="popup-content">
				{#if toast.type === 'error'}
					<i class="bi-exclamation-circle-fill"></i>
				{:else if toast.type === 'success'}
					<i class="bi-check-circle-fill"></i>
				{:else}
					<i class="bi-info-circle-fill"></i>
				{/if}
				<span class="popup-message">{toast.message}</span>
			</div>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 60px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10000;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		pointer-events: none;
	}

	.toast {
		background: var(--input-bg);
		border: 1px solid var(--button-bg);
		border-radius: 8px;
		padding: 12px 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		animation: popup-bounce-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.toast.error  { border-color: #ea4335; }
	.toast.success { border-color: #34a853; }

	.popup-content {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text-color);
		font-family: var(--font-family);
		font-size: clamp(12px, 2.5vw, 14px);
		white-space: nowrap;
	}

	.popup-content i {
		font-size: clamp(14px, 3vw, 16px);
		flex-shrink: 0;
		color: var(--button-bg);
	}

	.toast.error  .popup-content i { color: #ea4335; }
	.toast.success .popup-content i { color: #34a853; }

	@keyframes popup-bounce-bottom {
		0%   { transform: translateY(20px) scale(0.9); opacity: 0; }
		60%  { transform: translateY(-2px) scale(1.02); }
		100% { transform: translateY(0) scale(1); opacity: 1; }
	}

	@media (max-width: 480px) {
		.toast-container { bottom: 50px; max-width: 95vw; }
		.popup-content { font-size: clamp(10px, 3vw, 12px); white-space: normal; }
	}
</style>
