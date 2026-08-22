import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const SCHEMA = 'org.gnome.desktop.background';

export class WallpaperMonitor {
    constructor() {
        this._settings = new Gio.Settings({ schema_id: SCHEMA });
        this._changedId = null;
        this._callback = null;
        this._timeoutId = null;
    }

    connect(callback) {
        this._callback = callback;
        this._changedId = this._settings.connect(
            'changed',
            (_settings, key) => {
                if (key !== 'picture-uri' && key !== 'picture-uri-dark')
                    return;

                this._schedule();
            }
        );

        return this;
    }

    getPath() {
        const uri = this._settings.get_string('picture-uri');
        if (!uri)
            return null;

        try {
            const [path] = GLib.filename_from_uri(uri);
            return path;
        } catch (error) {
            console.error(`[RainClock] Could not resolve wallpaper URI: ${error.message}`);
            return null;
        }
    }

    _schedule() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }

        this._timeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            100,
            () => {
                this._timeoutId = null;
                this._callback?.();
                return GLib.SOURCE_REMOVE;
            }
        );
    }

    destroy() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }

        if (this._changedId) {
            this._settings.disconnect(this._changedId);
            this._changedId = null;
        }

        this._settings = null;
        this._callback = null;
    }
}
