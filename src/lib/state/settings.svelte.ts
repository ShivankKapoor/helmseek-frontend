function createSettingsUiState() {
	let open = $state(false);

	return {
		get open() { return open; },
		show() { open = true; },
		hide() { open = false; }
	};
}

export const settingsUiState = createSettingsUiState();
