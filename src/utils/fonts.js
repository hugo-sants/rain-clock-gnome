import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import PangoCairo from 'gi://PangoCairo';

const FONT_FILES = ['Anurati.otf', 'Poppins.ttf'];

export function installFonts(extension) {
    let extensionPath;

    try {
        extensionPath = extension.dir?.get_path() ?? extension.path;
    } catch (error) {
        extensionPath = GLib.build_filenamev([
            GLib.get_home_dir(),
            '.local',
            'share',
            'gnome-shell',
            'extensions',
            extension.uuid,
        ]);
    }

    const sourceDir = Gio.File.new_for_path(
        GLib.build_filenamev([extensionPath, 'fonts'])
    );

    const targetPath = GLib.build_filenamev([
        GLib.get_home_dir(),
        '.local',
        'share',
        'fonts',
        'rain-clock',
    ]);

    const targetDir = Gio.File.new_for_path(targetPath);

    try {
        if (!targetDir.query_exists(null))
            targetDir.make_directory_with_parents(null);
    } catch (error) {
        console.error(`[RainClock] Could not create font directory: ${error.message}`);
        return;
    }

    let changed = false;

    for (const filename of FONT_FILES) {
        const source = sourceDir.get_child(filename);
        const target = targetDir.get_child(filename);

        if (!source.query_exists(null))
            continue;

        if (target.query_exists(null))
            continue;

        try {
            source.copy(target, Gio.FileCopyFlags.NONE, null, null);
            changed = true;
        } catch (error) {
            console.error(`[RainClock] Could not install ${filename}: ${error.message}`);
        }
    }

    if (!changed)
        return;

    try {
        GLib.spawn_command_line_async('fc-cache -f');
        PangoCairo.FontMap.get_default().config_changed();
    } catch (error) {
        console.error(`[RainClock] Font cache refresh failed: ${error.message}`);
    }
}
