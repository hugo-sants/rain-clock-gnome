#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGING_DIR="$(mktemp -d)"

cleanup() {
    rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

mkdir -p "$DIST_DIR"

cp "$ROOT_DIR/metadata.json" "$STAGING_DIR/"
cp "$ROOT_DIR/extension.js" "$STAGING_DIR/"
cp "$ROOT_DIR/prefs.js" "$STAGING_DIR/"
cp "$ROOT_DIR/stylesheet.css" "$STAGING_DIR/"

cp -a "$ROOT_DIR/src" "$STAGING_DIR/"
cp -a "$ROOT_DIR/fonts" "$STAGING_DIR/"
cp -a "$ROOT_DIR/schemas" "$STAGING_DIR/"

glib-compile-schemas "$STAGING_DIR/schemas"
rm -f "$STAGING_DIR/schemas/gschemas.compiled"

rm -f "$DIST_DIR/rainclock@hugo-sants.github.com.zip"
(
    cd "$STAGING_DIR"
    zip -qr "$DIST_DIR/rainclock@hugo-sants.github.com.zip" .
)

echo "Built: $DIST_DIR/rainclock@hugo-sants.github.com.zip"
