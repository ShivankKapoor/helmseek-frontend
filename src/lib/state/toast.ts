import { signal } from '@preact/signals';

export type ToastType = 'info' | 'success' | 'error';

export interface ToastItem {
	id: number;
	message: string;
	type: ToastType;
}

export const toasts = signal<ToastItem[]>([]);
let nextId = 0;

export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
	const id = nextId++;
	toasts.value = [...toasts.value, { id, message, type }];
	setTimeout(() => {
		toasts.value = toasts.value.filter((t) => t.id !== id);
	}, duration);
}
