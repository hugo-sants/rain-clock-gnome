import St from 'gi://St';

import { BaseStyle } from './base-style.js';

export class MondStyle extends BaseStyle {
    create(monitorHeight, textColor) {
        this._monitorHeight = monitorHeight;
        this._textColor = textColor;

        const styles = this._buildStyles(
            monitorHeight,
            textColor
        );

        this._dayLabel = this._createLabel(styles.day);
        this._dateLabel = this._createLabel(styles.date);
        this._timeLabel = this._createLabel(styles.time);

        this._root = new St.BoxLayout({
            name: 'RainClockMond',
            style_class: 'rain-clock-mond',
            vertical: true,
            reactive: false,
            can_focus: false,
            track_hover: false,
        });

        this._root.add_child(this._dayLabel);
        this._root.add_child(this._dateLabel);
        this._root.add_child(this._timeLabel);

        return this._root;
    }

    update(data) {
        if (!this._root)
            return;

        this._dayLabel.set_text(data.day);
        this._dateLabel.set_text(data.date);
        this._timeLabel.set_text(data.time);
    }

    updateColor(textColor) {
        if (!this._root)
            return;

        this._textColor = textColor;

        this._applyStyles();
    }

    destroy() {
        this._dayLabel = null;
        this._dateLabel = null;
        this._timeLabel = null;

        super.destroy();
    }

    _applyStyles() {
        const styles = this._buildStyles(
            this._monitorHeight,
            this._textColor
        );

        this._dayLabel.set_style(styles.day);
        this._dateLabel.set_style(styles.date);
        this._timeLabel.set_style(styles.time);
    }
}