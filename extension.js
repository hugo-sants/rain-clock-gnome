import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { DEFAULTS } from './src/config.js';
import { WallpaperColorAnalyzer } from './src/core/color-analyzer.js';
import { WallpaperMonitor } from './src/core/wallpaper-monitor.js';
import { ClockWidget } from './src/ui/clock-widget.js';
import { installFonts } from './src/utils/fonts.js';

export default class RainClockExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._textColor = this._settings.get_string('mid-text-color');

        this._stylesheetFile = this.dir.get_child('stylesheet.css');
        this._loadStylesheet();

        installFonts(this);

        this._colorAnalyzer = new WallpaperColorAnalyzer(
            this._settings,
            DEFAULTS
        );

        this._wallpaperMonitor = new WallpaperMonitor()
            .connect(() => this._updateWallpaperColor());

        this._clock = new ClockWidget(
            this._settings,
            DEFAULTS,
            container => {
                container.opacity = 0;

                GLib_timeout(() => {
                    if (container)
                        container.opacity = 255;
                }, 50);
            }
        );

        this._clock.create(this._textColor);

        this._settingsChangedId = this._settings.connect(
            'changed',
            (_settings, key) => this._onSettingsChanged(key)
        );

        this._monitorsChangedId = Main.layoutManager.connect(
            'monitors-changed',
            () => {
                this._clock.refreshMonitors(this._textColor);
            }
        );

        this._clockTimerId = GLib_timeout_seconds(() => {
            this._clock.update();
        }, 1);

        this._updateWallpaperColor();
    }

    disable() {
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
        if (key === 'auto-color' || key === 'center-region-size' ||
            key === 'dark-threshold' || key === 'light-threshold' ||
            key === 'dark-text-color' || key === 'mid-text-color' ||
            key === 'light-text-color') {

            this._updateWallpaperColor();
        }

        if (
            key === 'position' ||
            key === 'margin-x' ||
            key === 'margin-y'
        ) {
            this._clock.reposition();
        }

        if (key === 'use-24h' || key === 'date-format')
            this._clock.update();
    }

    _updateWallpaperColor() {
        if (!this._clock || !this._colorAnalyzer)
            return;

        if (!this._settings.get_boolean('auto-color')) {
            const fixedColor =
                this._settings.get_string('mid-text-color');

            this._setTextColor(fixedColor);
            return;
        }

        const path = this._wallpaperMonitor.getPath();

        if (!path)
            return;

        const result = this._colorAnalyzer.getTextColor(path);

        if (!result)
            return;

        this._setTextColor(result.textColor);

        log(
            `[RainClock] wallpaper center rgb(${result.r}, ${result.g}, ${result.b}) ` +
            `luminance=${result.luminance.toFixed(3)} ` +
            `-> ${result.textColor}`
        );
    }

    _setTextColor(color) {
        if (color === this._textColor)
            return;

        this._textColor = color;
        this._clock.updateColor(color);

        log(`[RainClock] applied color ${color}`);
    }

    _loadStylesheet() {
        try {
            const theme = St.ThemeContext
                .get_for_stage(global.stage)
                .get_theme();

            theme.load_stylesheet(this._stylesheetFile);
        } catch (error) {
            log(`[RainClock] stylesheet load failed: ${error.message}`);
        }
    }

    _unloadStylesheet() {
        try {
            const theme = St.ThemeContext
                .get_for_stage(global.stage)
                .get_theme();

            theme.unload_stylesheet(this._stylesheetFile);
        } catch (error) {}
    }
}

// Small wrappers keep timer lifecycle explicit and make future service timers easier to isolate.
function GLib_timeout(callback, intervalMs) {
    return GLib.timeout_add(
        GLib.PRIORITY_DEFAULT,
        intervalMs,
        () => {
            callback();
            return GLib.SOURCE_REMOVE;
        }
    );
}

function GLib_timeout_seconds(callback, seconds) {
    return GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        seconds,
        () => {
            callback();
            return GLib.SOURCE_CONTINUE;
        }
    );
}
