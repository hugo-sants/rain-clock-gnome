#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/rainclock@hugo-sants.github.com"

rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

cp "$ROOT_DIR/metadata.json" "$INSTALL_DIR/"
cp "$ROOT_DIR/extension.js" "$INSTALL_DIR/"
cp "$ROOT_DIR/prefs.js" "$INSTALL_DIR/"
cp "$ROOT_DIR/stylesheet.css" "$INSTALL_DIR/"

cp -a "$ROOT_DIR/src" "$INSTALL_DIR/"
cp -a "$ROOT_DIR/fonts" "$INSTALL_DIR/"
cp -a "$ROOT_DIR/schemas" "$INSTALL_DIR/"

glib-compile-schemas "$INSTALL_DIR/schemas"

echo "Installed: $INSTALL_DIR"
echo "Enable with: gnome-extensions enable rainclock@hugo-sants.github.com"
