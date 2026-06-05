function createAuthState() {
	let authenticated = $state(false);
	let checking = $state(true); // true on startup until session check completes
	let username = $state('');

	function setAuthenticated(name: string = '') {
		authenticated = true;
		checking = false;
		username = name;
	}

	function setUnauthenticated() {
		authenticated = false;
		checking = false;
		username = '';
	}

	return {
		get authenticated() { return authenticated; },
		get checking() { return checking; },
		get username() { return username; },
		setAuthenticated,
		setUnauthenticated
	};
}

export const authState = createAuthState();
