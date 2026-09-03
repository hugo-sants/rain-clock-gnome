import Clutter from 'gi://Clutter';

import Pango from 'gi://Pango';

import St from 'gi://St';

export class BaseStyle {
    constructor(defaults) {
        this._defaults = defaults;
        this._root = null;
        this._monitorHeight = defaults.scaling.baseHeight;
        this._textColor = '#282828';
    }

    create(monitorHeight, textColor) {
        throw new Error('Style must implement create()');
    }

    update(data) {}

    updateColor(textColor) {
        this._textColor = textColor;
    }

    destroy() {
        this._root?.destroy();
        this._root = null;
    }

    _buildStyles(monitorHeight, textColor) {
        const scale = monitorHeight / this._defaults.scaling.baseHeight;
        const daySize = Math.round(this._defaults.day.baseSize * scale);
        const dayLetterSpacing = Math.round(this._defaults.day.baseLetterSpacing * scale);
        const subSize = Math.round(this._defaults.secondary.baseSize * scale);
        const subLetterSpacing = Math.round(this._defaults.secondary.baseLetterSpacing * scale);
        const datePadding = Math.round(this._defaults.secondary.datePaddingTop * scale);
        const timePadding = Math.round(this._defaults.secondary.timePaddingTop * scale);

        return {
            day:
                `font-family: ${this._defaults.day.fontFamily}, sans-serif; ` +
                `font-size: ${daySize}px; ` +
                `color: ${textColor}; ` +
                `letter-spacing: ${dayLetterSpacing}px; ` +
                `text-align: center;`,

            date:
                `font-family: ${this._defaults.secondary.fontFamily}, sans-serif; ` +
                `font-size: ${subSize}px; ` +
                `color: ${textColor}; ` +
                `letter-spacing: ${subLetterSpacing}px; ` +
                `text-align: center; ` +
                `padding-top: ${datePadding}px;`,

            time:
                `font-family: ${this._defaults.secondary.fontFamily}, sans-serif; ` +
                `font-size: ${subSize}px; ` +
                `color: ${textColor}; ` +
                `letter-spacing: ${subLetterSpacing}px; ` +
                `text-align: center; ` +
                `padding-top: ${timePadding}px;`,
        };
    }

    _createLabel(style) {
        const label = new St.Label({
            style,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });

        label.style_class = 'rain-clock-label';

        if (label.clutter_text)
            label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

        return label;
    }
}