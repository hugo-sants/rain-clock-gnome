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

export class SummitStyle extends BaseStyle {

    create(monitorHeight, textColor) {
        this._monitorHeight = monitorHeight;
        this._textColor = textColor;

        const scale = (monitorHeight / this._defaults.scaling.baseHeight) * 1.2;

        this._greetingSize = Math.round(14 * scale);

        this._daySize = Math.round(96 * scale);

        this._secondarySize = Math.round(15 * scale);

        this._greetingSpacing = Math.round(1 * scale);

        this._daySpacing = Math.round(1 * scale);

        this._secondarySpacing = Math.round(1 * scale);

        this._lineSize = Math.max(Math.round(2 * scale), 1);

        this._lineHeight = Math.round(58 * scale);

        this._lineGap = Math.round(20 * scale);

        this._compactGap = Math.round(12 * scale);

        this._sectionGap = Math.round(12 * scale);

        this._topLine = this._createLine(
            this._lineHeight,
            textColor
        );

        this._goodLabel = this._createLabel(
            'GOOD',
            'Outfit',
            this._greetingSize,
            this._greetingSpacing,
            textColor
        );

        this._greetingLabel = this._createLabel(
            '',
            'Outfit',
            this._greetingSize,
            this._greetingSpacing,
            textColor
        );

        this._dayLabel = this._createLabel(
            '',
            'Electroharmonix',
            this._daySize,
            this._daySpacing,
            textColor
        );

        this._dateLabel = this._createLabel(
            '',
            'Outfit',
            this._secondarySize,
            this._secondarySpacing,
            textColor
        );

        this._timeLabel = this._createLabel(
            '',
            'Outfit',
            this._secondarySize,
            this._secondarySpacing,
            textColor
        );

        this._goodGap = this._createSpacer(this._compactGap);

        this._greetingDayGap = this._createSpacer(this._sectionGap);

        this._dayDateGap = this._createSpacer(this._sectionGap);

        this._dateTimeGap = this._createSpacer(this._compactGap);

        this._bottomLineGap = this._createSpacer(this._lineGap);

        this._topContentGap = this._createSpacer(this._lineGap);

        this._bottomLine = this._createLine(this._lineHeight, textColor);

        this._root = new St.BoxLayout({
            name: 'RainClockSummit',
            style_class: 'rain-clock-summit',
            vertical: true,
            reactive: false,
            can_focus: false,
            track_hover: false,
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._root.add_child(this._topLine);

        this._root.add_child(this._topContentGap);

        this._root.add_child(this._goodLabel);

        this._root.add_child(this._goodGap);

        this._root.add_child(this._greetingLabel);

        this._root.add_child(this._greetingDayGap);

        this._root.add_child(this._dayLabel);

        this._root.add_child(this._dayDateGap);

        this._root.add_child(this._dateLabel);

        this._root.add_child(this._dateTimeGap);

        this._root.add_child(this._timeLabel);

        this._root.add_child(this._bottomLineGap);

        this._root.add_child(this._bottomLine);

        return this._root;
    }

    update(data) {
        if (!this._root)
            return;

        const now = new Date();

        this._dayLabel.set_text(data.day.slice(0, 3));

        this._greetingLabel.set_text(this._getGreeting(now.getHours()));

        this._dateLabel.set_text(this._formatDate(data.date));

        this._timeLabel.set_text(this._formatTime(data.time));
    }

    updateColor(textColor) {
        if (!this._root)
            return;

        this._textColor = textColor;

        this._goodLabel.set_style(this._getGreetingStyle(textColor));

        this._greetingLabel.set_style(this._getGreetingStyle(textColor));

        this._dayLabel.set_style(this._getDayStyle(textColor));

        this._dateLabel.set_style(this._getSecondaryStyle(textColor));

        this._timeLabel.set_style(this._getSecondaryStyle(textColor));

        this._topLine.set_style(
            `background-color: ${textColor};`
        );

        this._bottomLine.set_style(
            `background-color: ${textColor};`
        );
    }

    destroy() {
        this._goodLabel = null;
        this._greetingLabel = null;
        this._dayLabel = null;
        this._dateLabel = null;
        this._timeLabel = null;
        this._topLine = null;
        this._bottomLine = null;
        this._goodGap = null;
        this._greetingDayGap = null;
        this._dayDateGap = null;
        this._dateTimeGap = null;
        this._bottomLineGap = null;
        this._topContentGap = null;

        super.destroy();
    }

    _createLabel(
        text,
        fontFamily,
        fontSize,
        letterSpacing,
        color
    ) {
        const label = new St.Label({
            style:
                `font-family: ${fontFamily}, sans-serif; ` +
                `font-size: ${fontSize}px; ` +
                `color: ${color}; ` +
                `letter-spacing: ${letterSpacing}px; ` +
                `text-align: center;`,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });

        label.style_class = 'rain-clock-summit-label';

        label.set_text(text);

        if (label.clutter_text)
            label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

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

    _createLine(height, color) {
        return new St.Widget({
            name: 'RainClockSummitLine',
            style: `background-color: ${color};`,
            width: this._lineSize,
            height,
            x_align: Clutter.ActorAlign.CENTER,
            reactive: false,
            can_focus: false,
            track_hover: false,
        });
    }

    _getGreeting(hour) {
        if (hour >= 5 && hour < 12)
            return 'MORNING';

        if (hour >= 12 && hour < 18)
            return 'AFTERNOON';

        return 'EVENING';
    }

    _formatDate(date) {
        const parts = date.trim().split(/\s+/);

        if (parts.length < 2)
            return date;

        const day = parts[0];

        const monthIndex = [
            'JAN',
            'FEB',
            'MAR',
            'APR',
            'MAY',
            'JUN',
            'JUL',
            'AUG',
            'SEP',
            'OCT',
            'NOV',
            'DEC'
        ].indexOf(parts[1]);

        if (monthIndex === -1)
            return date;

        return `${day} ${MONTHS[monthIndex]}`;
    }

    _formatTime(time) {
        return time
            .replace(/^-+\s*/, '')
            .replace(/\s*-+$/, '')
            .trim();
    }

    _getGreetingStyle(color) {
        return (
            `font-family: Outfit, sans-serif; ` +
            `font-size: ${this._greetingSize}px; ` +
            `color: ${color}; ` +
            `letter-spacing: ${this._greetingSpacing}px; ` +
            `text-align: center;`
        );
    }

    _getDayStyle(color) {
        return (
            `font-family: Electroharmonix, sans-serif; ` +
            `font-size: ${this._daySize}px; ` +
            `color: ${color}; ` +
            `letter-spacing: ${this._daySpacing}px; ` +
            `text-align: center;`
        );
    }

    _getSecondaryStyle(color) {
        return (
            `font-family: Outfit, sans-serif; ` +
            `font-size: ${this._secondarySize}px; ` +
            `color: ${color}; ` +
            `letter-spacing: ${this._secondarySpacing}px; ` +
            `text-align: center;`
        );
    }
}