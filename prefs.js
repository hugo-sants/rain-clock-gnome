import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class RainClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const generalPage = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(generalPage);

        const layoutGroup = new Adw.PreferencesGroup({
            title: 'Layout',
        });
        generalPage.add(layoutGroup);

        const positionRow = new Adw.ComboRow({
            title: 'Position',
            subtitle: 'Position of the clock on the desktop.',
            model: Gtk.StringList.new([
                'Top left',
                'Top',
                'Top right',
                'Left',
                'Center',
                'Right',
                'Bottom left',
                'Bottom',
                'Bottom right',
            ]),
        });

        const positions = [
            'top-left',
            'top',
            'top-right',
            'left',
            'center',
            'right',
            'bottom-left',
            'bottom',
            'bottom-right',
        ];

        positionRow.set_selected(
            Math.max(0, positions.indexOf(settings.get_string('position')))
        );

        positionRow.connect('notify::selected', () => {
            settings.set_string(
                'position',
                positions[positionRow.get_selected()]
            );
        });

        layoutGroup.add(positionRow);

        const marginXRow = new Adw.SpinRow({
            title: 'Horizontal margin',
            subtitle: 'Margin used by edge positions.',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1000,
                step_increment: 1,
                value: settings.get_int('margin-x'),
            }),
        });

        settings.bind(
            'margin-x',
            marginXRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        layoutGroup.add(marginXRow);

        const marginYRow = new Adw.SpinRow({
            title: 'Vertical margin',
            subtitle: 'Margin used by edge positions.',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1000,
                step_increment: 1,
                value: settings.get_int('margin-y'),
            }),
        });

        settings.bind(
            'margin-y',
            marginYRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        layoutGroup.add(marginYRow);

        const timeGroup = new Adw.PreferencesGroup({
            title: 'Time and date',
        });
        generalPage.add(timeGroup);

        const use24hRow = new Adw.SwitchRow({
            title: '24-hour format',
            subtitle: 'Use 24-hour time instead of AM/PM.',
        });
        settings.bind(
            'use-24h',
            use24hRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        timeGroup.add(use24hRow);

        const dateFormatRow = new Adw.ComboRow({
            title: 'Date format',
            subtitle: 'Choose how the date is displayed.',
            model: Gtk.StringList.new([
                '01 MAY 2026',
                '01.05.2026',
            ]),
        });

        dateFormatRow.set_selected(
            settings.get_string('date-format') === 'numeric' ? 1 : 0
        );

        dateFormatRow.connect('notify::selected', () => {
            settings.set_string(
                'date-format',
                dateFormatRow.get_selected() === 1 ? 'numeric' : 'text'
            );
        });

        timeGroup.add(dateFormatRow);

        const colorPage = new Adw.PreferencesPage({
            title: 'Appearance',
            icon_name: 'applications-graphics-symbolic',
        });
        window.add(colorPage);

        const colorGroup = new Adw.PreferencesGroup({
            title: 'Automatic color',
            description: 'Rain Clock analyzes the center of the current wallpaper.',
        });
        colorPage.add(colorGroup);

        const autoColorRow = new Adw.SwitchRow({
            title: 'Automatic text color',
            subtitle: 'Switch between your dark, mid and light colors.',
        });
        settings.bind(
            'auto-color',
            autoColorRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        colorGroup.add(autoColorRow);

        const regionRow = new Adw.SpinRow({
            title: 'Center region (%)',
            subtitle: 'Percentage of the wallpaper width and height analyzed around the center.',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 100,
                step_increment: 1,
                value: settings.get_double('center-region-size') * 100,
            }),
        });

        regionRow.connect('notify::value', () => {
            settings.set_double(
                'center-region-size',
                regionRow.get_value() / 100
            );
        });

        colorGroup.add(regionRow);

        const thresholdGroup = new Adw.PreferencesGroup({
            title: 'Luminance thresholds',
        });
        colorPage.add(thresholdGroup);

        const darkThresholdRow = new Adw.SpinRow({
            title: 'Dark threshold',
            subtitle: 'Below this value the light text color is used.',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1,
                step_increment: 0.01,
                value: settings.get_double('dark-threshold'),
            }),
            digits: 2,
        });
        darkThresholdRow.connect('notify::value', () => {
            settings.set_double(
                'dark-threshold',
                darkThresholdRow.get_value()
            );
        });
        thresholdGroup.add(darkThresholdRow);

        const lightThresholdRow = new Adw.SpinRow({
            title: 'Light threshold',
            subtitle: 'Above this value the dark text color is used.',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1,
                step_increment: 0.01,
                value: settings.get_double('light-threshold'),
            }),
            digits: 2,
        });
        lightThresholdRow.connect('notify::value', () => {
            settings.set_double(
                'light-threshold',
                lightThresholdRow.get_value()
            );
        });
        thresholdGroup.add(lightThresholdRow);

        const colorsGroup = new Adw.PreferencesGroup({
            title: 'Color palette',
        });
        colorPage.add(colorsGroup);

        const colorDialog = new Gtk.ColorDialog({
            with_alpha: false,
        });

        this._addColorEntry(
            colorsGroup,
            settings,
            colorDialog,
            'dark-text-color',
            'Dark text',
            'Used on bright wallpapers.'
        );

        this._addColorEntry(
            colorsGroup,
            settings,
            colorDialog,
            'mid-text-color',
            'Mid text',
            'Used on medium-brightness wallpapers.'
        );

        this._addColorEntry(
            colorsGroup,
            settings,
            colorDialog,
            'light-text-color',
            'Light text',
            'Used on dark wallpapers.'
        );
    }

    _addColorEntry(
        group,
        settings,
        colorDialog,
        key,
        title,
        subtitle
    ) {
        const row = new Adw.ActionRow({
            title,
            subtitle,
        });

        const button = new Gtk.ColorDialogButton({
            dialog: colorDialog,
        });
        
        button.set_valign(Gtk.Align.CENTER);
        button.set_hexpand(false);
        button.set_vexpand(false);

        button.set_rgba(
            this._hexToRgba(settings.get_string(key))
        );

        button.connect('notify::rgba', () => {
            const rgba = button.get_rgba();
            const value = this._rgbaToHex(rgba);

            settings.set_string(key, value);
        });
        row.add_suffix(button);

        group.add(row);
    }

    _hexToRgba(hex) {
        const rgba = new Gdk.RGBA();

        if (!rgba.parse(hex))
            rgba.parse('#282828');

        rgba.alpha = 1.0;

        return rgba;
    }

    _rgbaToHex(rgba) {
        const r = Math.round(rgba.red * 255);
        const g = Math.round(rgba.green * 255);
        const b = Math.round(rgba.blue * 255);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}