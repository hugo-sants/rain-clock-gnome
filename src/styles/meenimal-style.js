import Clutter from 'gi://Clutter';

import Pango from 'gi://Pango';

import St from 'gi://St';

import { BaseStyle } from './base-style.js';

const MONTHS = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER'
];

const WEEKDAYS = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
];

export class MeenimalStyle extends BaseStyle {

    create(monitorHeight, textColor) {
        this._monitorHeight = monitorHeight;
        this._textColor = textColor;

        const scale = (monitorHeight / this._defaults.scaling.baseHeight) * 1.2;

        this._numberSize = Math.round(130 * scale);

        this._weekdaySize = Math.round(14 * scale);

        this._dateSize = Math.round(13 * scale);

        this._numberSpacing = Math.round(-5 * scale);

        this._labelSpacing = Math.round(1 * scale);

        this._numberOffset = Math.round(-40 * scale);

        this._weekdayOffset = Math.round(-45 * scale);

        this._dateOffset = Math.round(-48 * scale);

        this._numberWidth = Math.round(300 * scale);

        this._hourLabel = this._createLabel(
            '',
            'Google Sans',
            this._numberSize,
            this._numberSpacing,
            textColor,
            700
        );

        this._minuteLabel = this._createLabel(
            '',
            'Google Sans',
            this._numberSize,
            this._numberSpacing,
            textColor,
            700
        );

        this._hourLabel.style_class = 'rain-clock-meenimal-number';

        this._minuteLabel.style_class = 'rain-clock-meenimal-number';

        this._weekdayLabel = this._createLabel(
            '',
            'Gilroy Bold',
            this._weekdaySize,
            this._labelSpacing,
            textColor,
            700
        );

        this._dateLabel = this._createLabel(
            '',
            'Gilroy SemiBold',
            this._dateSize,
            this._labelSpacing,
            textColor,
            600
        );

        this._weekdayLabel.style_class ='rain-clock-meenimal-weekday';

        this._dateLabel.style_class = 'rain-clock-meenimal-date';

        this._hourContainer = this._createNumberContainer(this._hourLabel);

        this._minuteContainer = this._createNumberContainer(this._minuteLabel);

        this._minuteContainer.translation_y = this._numberOffset;

        this._weekdayLabel.translation_y = this._weekdayOffset;

        this._dateLabel.translation_y = this._dateOffset;

        this._numbers = new St.BoxLayout({
            name: 'RainClockMeenimalNumbers',
            vertical: true,
            reactive: false,
            can_focus: false,
            track_hover: false,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });

        this._numbers.add_child(this._hourContainer);

        this._numbers.add_child(this._minuteContainer);

        this._root = new St.BoxLayout({
            name: 'RainClockMeenimal',
            style_class: 'rain-clock-meenimal',
            vertical: true,
            reactive: false,
            can_focus: false,
            track_hover: false,
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._root.add_child(this._numbers);

        this._root.add_child(this._weekdayLabel);

        this._root.add_child(this._dateLabel);

        return this._root;
    }

    update(data) {
        if (!this._root)
            return;

        const now = new Date();

        this._hourLabel.set_text(
            String(now.getHours()).padStart(2, '0')
        );

        this._minuteLabel.set_text(
            String(now.getMinutes()).padStart(2, '0')
        );

        this._weekdayLabel.set_text(WEEKDAYS[now.getDay()]);

        this._dateLabel.set_text(
            `${MONTHS[now.getMonth()]} ${now.getDate()}`
        );

        this._minuteContainer.translation_y = this._numberOffset;

        this._weekdayLabel.translation_y = this._weekdayOffset;

        this._dateLabel.translation_y = this._dateOffset;

        this._numbers.queue_relayout();

        this._root.queue_relayout();
    }

    updateColor(textColor) {
        if (!this._root)
            return;

        this._textColor = textColor;

        this._hourLabel.set_style(this._getNumberStyle(textColor));

        this._minuteLabel.set_style(this._getNumberStyle(textColor));

        this._weekdayLabel.set_style(this._getWeekdayStyle(textColor));

        this._dateLabel.set_style(this._getDateStyle(textColor));

        this._minuteContainer.translation_y = this._numberOffset;

        this._weekdayLabel.translation_y = this._weekdayOffset;

        this._dateLabel.translation_y = this._dateOffset;

        this._numbers.queue_relayout();

        this._root.queue_relayout();
    }

    destroy() {
        this._hourLabel = null;
        this._minuteLabel = null;
        this._hourContainer = null;
        this._minuteContainer = null;
        this._weekdayLabel = null;
        this._dateLabel = null;
        this._numbers = null;

        super.destroy();
    }

    _createNumberContainer(label) {
        const container = new St.BoxLayout({
            name: 'RainClockMeenimalNumberContainer',
            vertical: false,
            reactive: false,
            can_focus: false,
            track_hover: false,
            width: this._numberWidth,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: false,
        });

        label.x_expand = true;

        label.x_align = Clutter.ActorAlign.CENTER;

        container.add_child(label);

        return container;
    }

    _createLabel(
        text,
        fontFamily,
        fontSize,
        letterSpacing,
        color,
        fontWeight = 400
    ) {
        const label = new St.Label({
            style:
                `font-family: '${fontFamily}', sans-serif; ` +
                `font-size: ${fontSize}px; ` +
                `font-weight: ${fontWeight}; ` +
                `color: ${color}; ` +
                `letter-spacing: ${letterSpacing}px; ` +
                `font-variant-numeric: tabular-nums; ` +
                `text-align: center;`,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });

        label.style_class = 'rain-clock-meenimal-label';

        label.set_text(text);

        if (label.clutter_text) {
            label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

            label.clutter_text.line_alignment = Pango.Alignment.CENTER;
        }

        return label;
    }

    _createSpacer(height) {
        return new St.Widget({
            height,
            reactive: false,
            can_focus: false,
            track_hover: false,
        });
    }

    _getNumberStyle(color) {
        return (
            `font-family: 'Google Sans', sans-serif; ` +
            `font-size: ${this._numberSize}px; ` +
            `font-weight: 700; ` +
            `color: ${color}; ` +
            `letter-spacing: ${this._numberSpacing}px; ` +
            `font-variant-numeric: tabular-nums; ` +
            `text-align: center;`
        );
    }

    _getWeekdayStyle(color) {
        return (
            `font-family: 'Gilroy Bold', sans-serif; ` +
            `font-size: ${this._weekdaySize}px; ` +
            `font-weight: 700; ` +
            `color: ${color}; ` +
            `letter-spacing: ${this._labelSpacing}px; ` +
            `text-align: center;`
        );
    }

    _getDateStyle(color) {
        return (
            `font-family: 'Gilroy SemiBold', sans-serif; ` +
            `font-size: ${this._dateSize}px; ` +
            `font-weight: 600; ` +
            `color: ${color}; ` +
            `letter-spacing: ${this._labelSpacing}px; ` +
            `text-align: center;`
        );
    }
}