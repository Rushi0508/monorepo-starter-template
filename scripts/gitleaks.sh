#!/usr/bin/env sh
set -eu

VERSION="8.30.1"
ROOT="$(git rev-parse --show-toplevel)"
CACHE_DIR="$ROOT/node_modules/.cache/gitleaks/$VERSION"
BIN="$CACHE_DIR/gitleaks"

if [ ! -x "$BIN" ]; then
	case "$(uname -s)" in
		Darwin) os="darwin" ;;
		Linux) os="linux" ;;
		*) echo "gitleaks.sh: unsupported OS $(uname -s)" >&2; exit 1 ;;
	esac
	case "$(uname -m)" in
		x86_64 | amd64) arch="x64" ;;
		arm64 | aarch64) arch="arm64" ;;
		*) echo "gitleaks.sh: unsupported arch $(uname -m)" >&2; exit 1 ;;
	esac

	asset="gitleaks_${VERSION}_${os}_${arch}.tar.gz"
	base="https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}"
	tmp="$(mktemp -d)"
	trap 'rm -rf "$tmp"' EXIT

	curl -fsSL -o "$tmp/$asset" "$base/$asset"
	curl -fsSL -o "$tmp/checksums.txt" "$base/gitleaks_${VERSION}_checksums.txt"

	expected="$(grep " $asset\$" "$tmp/checksums.txt" | cut -d' ' -f1)"
	if command -v sha256sum >/dev/null 2>&1; then
		actual="$(sha256sum "$tmp/$asset" | cut -d' ' -f1)"
	else
		actual="$(shasum -a 256 "$tmp/$asset" | cut -d' ' -f1)"
	fi
	if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
		echo "gitleaks.sh: checksum mismatch for $asset" >&2
		exit 1
	fi

	tar -xzf "$tmp/$asset" -C "$tmp" gitleaks
	mkdir -p "$CACHE_DIR"
	mv "$tmp/gitleaks" "$BIN"
	chmod +x "$BIN"
fi

if [ $# -eq 0 ]; then
	set -- git --redact --no-banner --verbose
fi

exec "$BIN" "$@"
