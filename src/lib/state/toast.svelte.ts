type ToastType = 'info' | 'success' | 'error';

interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

function createToastState() {
	let toasts = $state<Toast[]>([]);
	let nextId = 0;

	function show(message: string, type: ToastType = 'info', duration = 4000) {
		const id = nextId++;
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, duration);
	}

	return {
		get toasts() { return toasts; },
		show
	};
}

export const toastState = createToastState();
