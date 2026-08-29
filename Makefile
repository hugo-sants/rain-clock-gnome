.PHONY: install uninstall dist

UUID = rainclock@hugo-sants.github.com
EXT_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

install:
	@gnome-extensions disable $(UUID) 2>/dev/null || true
	@rm -rf $(EXT_DIR)
	@mkdir -p $(EXT_DIR)
	@cp -r extension.js metadata.json stylesheet.css prefs.js src fonts schemas $(EXT_DIR)/
	@glib-compile-schemas $(EXT_DIR)/schemas/
	@gnome-extensions enable $(UUID) 2>/dev/null || true
	@echo ""
	@echo "Rain Clock installed."
	@echo "Restart or reload the extension if necessary."

uninstall:
	@gnome-extensions disable $(UUID) 2>/dev/null || true
	@rm -rf $(EXT_DIR)
	@echo "Rain Clock uninstalled."

dist:
	@mkdir -p dist
	@rm -f dist/$(UUID).zip
	@glib-compile-schemas schemas/
	@rm -f schemas/gschemas.compiled
	@zip -r dist/$(UUID).zip \
		extension.js \
		metadata.json \
		stylesheet.css \
		prefs.js \
		src/ \
		fonts/ \
		schemas/ \
		-x "schemas/gschemas.compiled"
	@echo "Archive: dist/$(UUID).zip"