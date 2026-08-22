#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/rainclock@hugo-sants.github.com"

if [[ -d "$INSTALL_DIR" ]]; then
    rm -rf "$INSTALL_DIR"
    echo "Removed: $INSTALL_DIR"
else
    echo "Rain Clock is not installed."
fi
