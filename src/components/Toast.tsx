import { toasts, type ToastType } from '@/lib/state/toast';
import { cx } from '@/lib/utils/cx';
import styles from './Toast.module.css';

const ICONS: Record<ToastType, string> = {
	error: 'bi-exclamation-circle-fill',
	success: 'bi-check-circle-fill',
	info: 'bi-info-circle-fill'
};

export function Toast() {
	return (
		<div class={styles.toastContainer} aria-live="polite">
			{toasts.value.map((toast) => (
				<div key={toast.id} class={cx(styles.toast, styles[toast.type])}>
					<div class={styles.popupContent}>
						<i class={ICONS[toast.type]} aria-hidden="true" />
						<span>{toast.message}</span>
					</div>
				</div>
			))}
		</div>
	);
}
