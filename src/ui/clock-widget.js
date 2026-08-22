import Clutter from 'gi://Clutter';

import Pango from 'gi://Pango';

import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const DAYS = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
    'THURSDAY', 'FRIDAY', 'SATURDAY'
];

const MONTHS = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

export class ClockWidget {
    constructor(settings, defaults, onCreate) {
        this._settings = settings;
        this._defaults = defaults;
        this._primary = null;
        this._extras = [];
        this._onCreate = onCreate;
        this._initialLayout = true;
        this._allocationId = null;
    }

    create(textColor) {
        const monitor = Main.layoutManager.primaryMonitor;
        const height = monitor?.height ?? this._defaults.scaling.baseHeight;
        const labels = this._createLabels(height, textColor);

        this._primary = this._createContainer('rain-clock-container', labels, monitor);
        Main.layoutManager._backgroundGroup.add_child(this._primary.container);
        this._onCreate?.(this._primary.container);

        this._rebuildExtraMonitors(textColor);

        this._allocationId = this._primary.clock.connect('notify::allocation', () => {
            if (!this._initialLayout)
                return;

            this._initialLayout = false;

            if (this._allocationId) {
                this._primary.clock.disconnect(this._allocationId);
                this._allocationId = null;
            }

            this._positionCurrentWidgets();
        });

        this.update();
        this.reposition();

        return this._primary;
    }

    updateColor(textColor) {
        if (!this._primary)
            return;

        this._applyLabelStyles(this._primary.labels, this._primary.monitor.height, textColor);

        for (const extra of this._extras)
            this._applyLabelStyles(extra.labels, extra.monitor.height, textColor);
    }

    update() {
        if (!this._primary)
            return;

        const now = new Date();
        const day = DAYS[now.getDay()];
        const dd = String(now.getDate()).padStart(2, '0');
        const dateFormat = this._settings.get_string('date-format');
        let date;

        if (dateFormat === 'numeric') {
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            date = `${dd}.${mm}.${now.getFullYear()}`;
        } else {
            date = `${dd} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
        }

        const hours = now.getHours();
        const mins = String(now.getMinutes()).padStart(2, '0');
        let time;

        if (this._settings.get_boolean('use-24h')) {
            time = `${String(hours).padStart(2, '0')}:${mins}`;
        } else {
            const ampm = hours < 12 ? 'AM' : 'PM';
            const h12 = hours % 12 || 12;
            time = `${String(h12).padStart(2, '0')}:${mins} ${ampm}`;
        }

        const timeText = `${this._defaults.timeChar} ${time} ${this._defaults.timeChar}`;

        this._setLabels(this._primary.labels, day, date, timeText);

        for (const extra of this._extras)
            this._setLabels(extra.labels, day, date, timeText);
    }

    refreshMonitors(textColor) {
        this._rebuildExtraMonitors(textColor);
        this.reposition();
    }

    reposition() {
        if (!this._primary)
            return;
    
        if (this._initialLayout) {
            this._primary.container.queue_relayout();
            this._primary.clock.queue_relayout();
    
            for (const extra of this._extras) {
                extra.container.queue_relayout();
                extra.clock.queue_relayout();
            }
    
            return;
        }

        this._positionCurrentWidgets();
    }

    destroy() {
        if (this._allocationId) {
            this._primary?.clock?.disconnect(this._allocationId);
            this._allocationId = null;
        }

        for (const extra of this._extras)
            extra.container.destroy();

        this._extras = [];
        this._primary?.container?.destroy();
        this._primary = null;
    }

    _positionCurrentWidgets() {
        const position = this._settings.get_string('position');
        const marginX = this._settings.get_int('margin-x');
        const marginY = this._settings.get_int('margin-y');
    
        this._positionContainer(this._primary, position, marginX, marginY);
    
        for (const extra of this._extras)
            this._positionContainer(extra, position, marginX, marginY);
    }

    _rebuildExtraMonitors(textColor) {
        for (const extra of this._extras)
            extra.container.destroy();

        this._extras = [];

        const primaryIndex = Main.layoutManager.primaryIndex;
        const monitors = Main.layoutManager.monitors;

        for (let i = 0; i < monitors.length; i++) {
            if (i === primaryIndex)
                continue;

            const monitor = monitors[i];
            const labels = this._createLabels(monitor.height || this._defaults.scaling.baseHeight, textColor);
            const widget = this._createContainer('rain-clock-container', labels, monitor);

            Main.layoutManager._backgroundGroup.add_child(widget.container);
            this._extras.push(widget);
        }
    }

    _createLabels(monitorHeight, textColor) {
        const styles = this._buildStyles(monitorHeight, textColor);

        const dayLabel = new St.Label({
            style: styles.day,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });

        const dateLabel = new St.Label({
            style: styles.date,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });

        const timeLabel = new St.Label({
            style: styles.time,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });

        for (const label of [dayLabel, dateLabel, timeLabel]) {
            label.style_class = 'rain-clock-label';

            if (label.clutter_text)
                label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        }

        return {
            day: dayLabel,
            date: dateLabel,
            time: timeLabel,
        };
    }

    _createContainer(styleClass, labels, monitor) {
        const container = new St.Widget({
            name: 'RainClockMonitor',
            style_class: styleClass,
            layout_manager: new Clutter.BinLayout(),
            reactive: false,
            can_focus: false,
            track_hover: false,
            width: monitor.width,
            height: monitor.height,
        });

        const clock = new St.BoxLayout({
            name: 'RainClockWidget',
            vertical: true,
            reactive: false,
            can_focus: false,
            track_hover: false,
        });

        clock.add_child(labels.day);
        clock.add_child(labels.date);
        clock.add_child(labels.time);

        container.add_child(clock);

        return {
            container,
            clock,
            labels,
            monitor,
        };
    }

    _setLabels(labels, day, date, time) {
        labels.day.set_text(day);
        labels.date.set_text(date);
        labels.time.set_text(time);
    }

    _applyLabelStyles(labels, monitorHeight, textColor) {
        const styles = this._buildStyles(monitorHeight, textColor);

        labels.day.set_style(styles.day);
        labels.date.set_style(styles.date);
        labels.time.set_style(styles.time);
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

    _getClockSize(clock) {
        try {
            const [minWidth, naturalWidth] = clock.get_preferred_width(-1);
            const [minHeight, naturalHeight] = clock.get_preferred_height(naturalWidth);

            return {
                width: Math.max(naturalWidth || minWidth || 1, 1),
                height: Math.max(naturalHeight || minHeight || 1, 1),
            };
        } catch (error) {
            return {
                width: Math.max(clock.width, 1),
                height: Math.max(clock.height, 1),
            };
        }
    }

    _positionContainer(widget, position, marginX, marginY) {
        const { container, clock, monitor } = widget;

        if (!container || !clock || !monitor)
            return;

        container.width = monitor.width;
        container.height = monitor.height;
        container.set_position(Math.round(monitor.x), Math.round(monitor.y));

        const { width, height } = this._getClockSize(clock);

        clock.width = width;
        clock.height = height;

        let x;
        let y;

        switch (position) {
            case 'top-left':
                x = marginX;
                y = marginY;
                break;

            case 'top-right':
                x = monitor.width - width - marginX;
                y = marginY;
                break;

            case 'bottom-left':
                x = marginX;
                y = monitor.height - height - marginY;
                break;

            case 'bottom-right':
                x = monitor.width - width - marginX;
                y = monitor.height - height - marginY;
                break;

            case 'center':
            default:
                x = (monitor.width - width) / 2;
                y = (monitor.height - height) / 2;
                break;
        }

        clock.set_position(Math.round(x), Math.round(y));
    }
}