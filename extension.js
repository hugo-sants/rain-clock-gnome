import GLib from 'gi://GLib';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { DEFAULTS } from './src/config.js';
import { WallpaperColorAnalyzer } from './src/core/color-analyzer.js';
import { WallpaperMonitor } from './src/core/wallpaper-monitor.js';
import { ClockWidget } from './src/ui/clock-widget.js';

export default class RainClockExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        this._textColor = this._settings.get_string('mid-text-color');
        this._colorUpdateTimeoutId = null;

        this._stylesheetFile = this.dir.get_child('stylesheet.css');
        this._loadStylesheet();

        this._colorAnalyzer = new WallpaperColorAnalyzer(this._settings, DEFAULTS);

        this._wallpaperMonitor = new WallpaperMonitor().connect(() => {
            this._scheduleWallpaperColorUpdate();
        });

        this._clock = new ClockWidget(this._settings, DEFAULTS, container => {
            container.opacity = 0;

            this._fadeInTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
                if (container)
                    container.opacity = 255;

                this._fadeInTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        });

        this._clock.create(this._textColor);

        this._settingsChangedId = this._settings.connect('changed', (_settings, key) => {
            this._onSettingsChanged(key);
        });

        this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', () => {
            this._clock.refreshMonitors(this._textColor);
        });

        this._clockTimerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            if (!this._clock)
                return GLib.SOURCE_REMOVE;

            this._clock.update();
            return GLib.SOURCE_CONTINUE;
        });

        this._updateWallpaperColor();
    }

    disable() {
        if (this._colorUpdateTimeoutId) {
            GLib.source_remove(this._colorUpdateTimeoutId);
            this._colorUpdateTimeoutId = null;
        }

        if (this._fadeInTimeoutId) {
            GLib.source_remove(this._fadeInTimeoutId);
            this._fadeInTimeoutId = null;
        }

        if (this._clockTimerId) {
            GLib.source_remove(this._clockTimerId);
            this._clockTimerId = null;
        }

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        if (this._monitorsChangedId) {
            Main.layoutManager.disconnect(this._monitorsChangedId);
            this._monitorsChangedId = null;
        }

        this._wallpaperMonitor?.destroy();
        this._wallpaperMonitor = null;

        this._clock?.destroy();
        this._clock = null;

        this._unloadStylesheet();

        this._colorAnalyzer = null;
        this._settings = null;
    }

    _onSettingsChanged(key) {
        if (key === 'style') {
            this._clock?.setStyle(
                this._settings.get_string('style'),
                this._textColor
            );
        
            return;
        }

        if (
            key === 'auto-color' ||
            key === 'center-region-size' ||
            key === 'dark-threshold' ||
            key === 'light-threshold' ||
            key === 'dark-text-color' ||
            key === 'mid-text-color' ||
            key === 'light-text-color'
        ) {
            this._scheduleWallpaperColorUpdate();
        }

        if (
            key === 'position' ||
            key === 'margin-x' ||
            key === 'margin-y'
        ) {
            this._clock?.reposition();
        }

        if (
            key === 'use-24h' ||
            key === 'date-format'
        ) {
            this._clock?.update();
        }
    }

    _scheduleWallpaperColorUpdate(delay = 250) {
        if (!this._clock || !this._colorAnalyzer)
            return;

        if (this._colorUpdateTimeoutId) {
            GLib.source_remove(this._colorUpdateTimeoutId);
            this._colorUpdateTimeoutId = null;
        }

        this._colorUpdateTimeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            delay,
            () => {
                this._colorUpdateTimeoutId = null;

                if (!this._clock || !this._colorAnalyzer)
                    return GLib.SOURCE_REMOVE;

                this._updateWallpaperColor();

                return GLib.SOURCE_REMOVE;
            }
        );
    }

    _updateWallpaperColor() {
        if (!this._clock || !this._colorAnalyzer)
            return;

        if (!this._settings.get_boolean('auto-color')) {
            this._setTextColor(this._settings.get_string('mid-text-color'));
            return;
        }

        const path = this._wallpaperMonitor.getPath();

        if (!path)
            return;

        const result = this._colorAnalyzer.getTextColor(path);

        if (!result)
            return;

        this._setTextColor(result.textColor);

    }

    _setTextColor(color) {
        if (color === this._textColor)
            return;

        this._textColor = color;
        this._clock.updateColor(color);

    }

    _loadStylesheet() {
        try {
            const theme = St.ThemeContext.get_for_stage(global.stage).get_theme();
            theme.load_stylesheet(this._stylesheetFile);
        } catch (error) {
            log(`[RainClock] stylesheet load failed: ${error.message}`);
        }
    }

    _unloadStylesheet() {
        try {
            const theme = St.ThemeContext.get_for_stage(global.stage).get_theme();
            theme.unload_stylesheet(this._stylesheetFile);
        } catch {
            // Ignore stylesheet unload failures.
        }
    }
}