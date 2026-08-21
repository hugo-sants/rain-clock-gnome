import GdkPixbuf from 'gi://GdkPixbuf';

export class WallpaperColorAnalyzer {
    constructor(settings, defaults) {
        this._settings = settings;
        this._defaults = defaults;
    }

    getTextColor(path) {
        const color = this._getCenterColor(path);

        if (!color)
            return null;

        const darkThreshold = this._settings.get_double('dark-threshold');
        const lightThreshold = this._settings.get_double('light-threshold');

        const darkColor = this._settings.get_string('dark-text-color');
        const midColor = this._settings.get_string('mid-text-color');
        const lightColor = this._settings.get_string('light-text-color');

        let textColor = midColor;

        if (color.luminance < darkThreshold)
            textColor = lightColor;
        else if (color.luminance >= lightThreshold)
            textColor = darkColor;

        return {
            ...color,
            textColor,
        };
    }

    _getCenterColor(path) {
        try {
            const analysisSize = this._defaults.wallpaper.analysisSize;
            const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
                path,
                analysisSize,
                analysisSize,
                false
            );

            if (!pixbuf)
                return null;

            const width = pixbuf.get_width();
            const height = pixbuf.get_height();
            const rowstride = pixbuf.get_rowstride();
            const channels = pixbuf.get_n_channels();
            const pixels = pixbuf.get_pixels();

            const regionSize = Math.max(
                0.01,
                Math.min(
                    1.0,
                    this._settings.get_double('center-region-size')
                )
            );

            const regionWidth = Math.max(
                1,
                Math.round(width * regionSize)
            );

            const regionHeight = Math.max(
                1,
                Math.round(height * regionSize)
            );

            const startX = Math.floor((width - regionWidth) / 2);
            const startY = Math.floor((height - regionHeight) / 2);

            let totalR = 0;
            let totalG = 0;
            let totalB = 0;
            let count = 0;

            for (let y = startY; y < startY + regionHeight; y++) {
                const rowStart = y * rowstride;

                for (let x = startX; x < startX + regionWidth; x++) {
                    const offset = rowStart + x * channels;

                    totalR += pixels[offset];
                    totalG += pixels[offset + 1];
                    totalB += pixels[offset + 2];
                    count++;
                }
            }

            if (!count)
                return null;

            const r = Math.round(totalR / count);
            const g = Math.round(totalG / count);
            const b = Math.round(totalB / count);

            return {
                r,
                g,
                b,
                luminance: this._getLuminance(r, g, b),
            };
        } catch (error) {
            console.error(`[RainClock] Wallpaper analysis failed: ${error.message}`);
            return null;
        }
    }

    _getLuminance(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        r = r <= 0.03928
            ? r / 12.92
            : Math.pow((r + 0.055) / 1.055, 2.4);

        g = g <= 0.03928
            ? g / 12.92
            : Math.pow((g + 0.055) / 1.055, 2.4);

        b = b <= 0.03928
            ? b / 12.92
            : Math.pow((b + 0.055) / 1.055, 2.4);

        return (
            0.2126 * r +
            0.7152 * g +
            0.0722 * b
        );
    }
}
