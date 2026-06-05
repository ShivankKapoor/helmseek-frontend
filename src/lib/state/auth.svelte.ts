function createAuthState() {
	let authenticated = $state(false);
	let checking = $state(true); // true on startup until session check completes

	function setAuthenticated() {
		authenticated = true;
		checking = false;
	}

	function setUnauthenticated() {
		authenticated = false;
		checking = false;
	}

	return {
		get authenticated() { return authenticated; },
		get checking() { return checking; },
		setAuthenticated,
		setUnauthenticated
	};
}

export const authState = createAuthState();
