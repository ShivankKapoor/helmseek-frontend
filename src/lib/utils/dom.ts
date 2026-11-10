/** True when the click landed on the backdrop itself, not on something inside the modal. */
export function isBackdropClick(event: MouseEvent): boolean {
	return event.target === event.currentTarget;
}
