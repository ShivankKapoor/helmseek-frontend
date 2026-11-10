import { signal } from '@preact/signals';

export const settingsOpen = signal(false);
export const openSettings = () => { settingsOpen.value = true; };
export const closeSettings = () => { settingsOpen.value = false; };
