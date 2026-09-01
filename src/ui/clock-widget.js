import Clutter from 'gi://Clutter';

import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { createStyle } from '../styles/style-registry.js';

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
        const styleId = this._settings.get_string('style');

        this._primary = this._createContainer(styleId, monitor, textColor);

        Main.layoutManager._backgroundGroup.add_child(this._primary.container);

        this._onCreate?.(this._primary.container);

        this._rebuildExtraMonitors(textColor);

        this._connectInitialAllocation();

        this.update();
        this.reposition();

        return this._primary;
    }

    setStyle(styleId, textColor) {
        if (!this._primary)
            return;

        this._disconnectInitialAllocation();

        this._replaceStyle(this._primary, styleId, textColor);

        for (const extra of this._extras)
            this._replaceStyle(extra, styleId, textColor);

        this._initialLayout = true;

        this._connectInitialAllocation();

        this.update();
        this.reposition();
    }

    updateColor(textColor) {
        if (!this._primary)
            return;

        this._primary.style.updateColor(textColor);

        for (const extra of this._extras)
            extra.style.updateColor(textColor);
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

        const data = {
            day,
            date,
            time: `${this._defaults.timeChar} ${time} ${this._defaults.timeChar}`,
        };

        this._primary.style.update(data);

        for (const extra of this._extras)
            extra.style.update(data);
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
        this._disconnectInitialAllocation();

        for (const extra of this._extras)
            extra.style.destroy();

        this._extras = [];

        this._primary?.style?.destroy();
        this._primary?.container?.destroy();

        this._primary = null;
    }

    _connectInitialAllocation() {
        if (!this._primary)
            return;

        this._allocationId = this._primary.clock.connect(
            'notify::allocation',
            () => {
                if (!this._initialLayout)
                    return;

                this._initialLayout = false;

                this._disconnectInitialAllocation();

                this._positionCurrentWidgets();
            }
        );
    }

    _disconnectInitialAllocation() {
        if (!this._allocationId)
            return;

        this._primary?.clock?.disconnect(this._allocationId);

        this._allocationId = null;
    }

    _positionCurrentWidgets() {
        const position = this._settings.get_string('position');
        const marginX = this._settings.get_int('margin-x');
        const marginY = this._settings.get_int('margin-y');

        this._positionContainer(
            this._primary,
            position,
            marginX,
            marginY
        );

        for (const extra of this._extras)
            this._positionContainer(
                extra,
                position,
                marginX,
                marginY
            );
    }

    _rebuildExtraMonitors(textColor) {
        for (const extra of this._extras)
            extra.style.destroy();

        this._extras = [];

        const styleId = this._settings.get_string('style');
        const primaryIndex = Main.layoutManager.primaryIndex;
        const monitors = Main.layoutManager.monitors;

        for (let i = 0; i < monitors.length; i++) {
            if (i === primaryIndex)
                continue;

            const monitor = monitors[i];

            const widget = this._createContainer(
                styleId,
                monitor,
                textColor
            );

            Main.layoutManager._backgroundGroup.add_child(widget.container);

            this._extras.push(widget);
        }
    }

    _createContainer(styleId, monitor, textColor) {
        const container = new St.Widget({
            name: 'RainClockMonitor',
            style_class: 'rain-clock-container',
            layout_manager: new Clutter.BinLayout(),
            reactive: false,
            can_focus: false,
            track_hover: false,
            width: monitor.width,
            height: monitor.height,
        });

        const style = createStyle(styleId, this._defaults);

        const clock = style.create(
            monitor.height || this._defaults.scaling.baseHeight,
            textColor
        );

        container.add_child(clock);

        return {
            container,
            clock,
            style,
            monitor,
        };
    }

    _replaceStyle(widget, styleId, textColor) {
        const oldStyle = widget.style;

        const style = createStyle(styleId, this._defaults);

        const clock = style.create(
            widget.monitor.height || this._defaults.scaling.baseHeight,
            textColor
        );

        widget.container.remove_child(widget.clock);
        oldStyle.destroy();

        widget.container.add_child(clock);

        widget.style = style;
        widget.clock = clock;
    }

    _getClockSize(clock) {
        try {
            const [minWidth, naturalWidth] = clock.get_preferred_width(-1);
            const [minHeight, naturalHeight] = clock.get_preferred_height(naturalWidth);

            return {
                width: Math.max(naturalWidth || minWidth || 1, 1),
                height: Math.max(naturalHeight || minHeight || 1, 1),
            };
        } catch {
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

            case 'top':
                x = (monitor.width - width) / 2;
                y = marginY;
                break;

            case 'top-right':
                x = monitor.width - width - marginX;
                y = marginY;
                break;

            case 'left':
                x = marginX;
                y = (monitor.height - height) / 2;
                break;

            case 'center':
                x = (monitor.width - width) / 2;
                y = (monitor.height - height) / 2;
                break;

            case 'right':
                x = monitor.width - width - marginX;
                y = (monitor.height - height) / 2;
                break;

            case 'bottom-left':
                x = marginX;
                y = monitor.height - height - marginY;
                break;

            case 'bottom':
                x = (monitor.width - width) / 2;
                y = monitor.height - height - marginY;
                break;

            case 'bottom-right':
                x = monitor.width - width - marginX;
                y = monitor.height - height - marginY;
                break;

            default:
                x = (monitor.width - width) / 2;
                y = (monitor.height - height) / 2;
                break;
        }

        clock.set_position(Math.round(x), Math.round(y));
    }
}