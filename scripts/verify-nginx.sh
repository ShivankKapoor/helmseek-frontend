#!/usr/bin/env bash
# Builds the production image, runs it, and checks what nginx actually sends:
# security headers on every kind of response, cache rules, and the redirect for unknown paths.
#
#   npm run test:nginx        (needs Docker)
set -uo pipefail

IMAGE=helmseek-frontend-nginx-check
CONTAINER=helmseek-nginx-check
PORT=3098
BASE="http://localhost:$PORT"
failures=0

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1; }
trap cleanup EXIT

pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

# Prints the response headers (without the body) for a request, one per line.
headers() { curl -s -o /dev/null -D - "$@" | tr -d '\r'; }

# check "description" <headers> "regex that must match exactly N times" [N=1]
expect_header() {
	local description=$1 response=$2 pattern=$3 times=${4:-1}
	local count
	count=$(grep -ciE "$pattern" <<<"$response")
	[ "$count" -eq "$times" ] && pass "$description" || fail "$description (found $count, expected $times)"
}

echo "Building and starting the production image..."
docker build -q -t "$IMAGE" . >/dev/null || { echo "image build failed"; exit 1; }
cleanup
docker run -d --name "$CONTAINER" -p "$PORT:3003" "$IMAGE" >/dev/null || exit 1
for _ in $(seq 1 30); do curl -s -o /dev/null "$BASE/" && break; sleep 0.2; done

echo; echo "nginx config is valid"
docker exec "$CONTAINER" nginx -t >/dev/null 2>&1 && pass "nginx -t" || fail "nginx -t"

page=$(curl -s "$BASE/")
js=$(grep -oE '/assets/[^"]+\.js' <<<"$page" | head -1)
css=$(grep -oE '/assets/[^"]+\.css' <<<"$page" | head -1)

echo; echo "Security headers are sent exactly once on every kind of response"
for path in / "$js" "$css" /robots.txt /manifest.json /favicon.ico /does-not-exist; do
	response=$(headers "$BASE$path")
	expect_header "X-Content-Type-Options on $path" "$response" '^x-content-type-options: nosniff$'
	expect_header "X-Frame-Options on $path"        "$response" '^x-frame-options: DENY$'
	expect_header "Referrer-Policy on $path"        "$response" '^referrer-policy: strict-origin-when-cross-origin$'
done

echo; echo "Caching"
expect_header "index.html is never cached"       "$(headers "$BASE/")"   '^cache-control: no-cache, no-store, must-revalidate$'
expect_header "hashed JS is cached for a year"   "$(headers "$BASE$js")" '^cache-control: public, immutable$'
expect_header "hashed JS has a one-year max-age" "$(headers "$BASE$js")" '^cache-control: max-age=31536000$'

echo; echo "Unknown paths redirect to the home page without leaking the internal port or the Host header"
redirect=$(headers "$BASE/does-not-exist")
expect_header "unknown path answers 302"                 "$redirect" '^HTTP/[0-9.]+ 302'
expect_header "Location is the relative path /"          "$redirect" '^location: /$'
hostile=$(headers -H 'Host: evil.example' "$BASE/does-not-exist")
expect_header "a forged Host header is not reflected"    "$hostile"  'evil\.example' 0

echo; echo "Only the built app is served: config, secrets and source files are not reachable"
for path in /.env /nginx.conf /security-headers.conf /package.json /src/main.tsx /.git/HEAD /Dockerfile; do
	status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")
	[ "$status" = 302 ] && pass "$path is not served" || fail "$path answered $status (expected 302)"
done
# curl normalizes "../", so send the traversal raw to make sure nginx does not walk out of the web root.
status=$(curl -s --path-as-is -o /dev/null -w '%{http_code}' "$BASE/../../etc/passwd")
[ "$status" != 200 ] && pass "path traversal does not read /etc/passwd" || fail "path traversal returned 200"

echo
if [ "$failures" -eq 0 ]; then echo "All nginx checks passed."; else echo "$failures check(s) failed."; exit 1; fi
