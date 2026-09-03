import { MondStyle } from './mond-style.js';

import { SummitStyle } from './summit-style.js';

import { MeenimalStyle } from './meenimal-style.js';

const STYLE_CLASSES = {
    mond: MondStyle,
    summit: SummitStyle,
    meenimal: MeenimalStyle,
};

export function createStyle(styleId, defaults) {
    const StyleClass = STYLE_CLASSES[styleId] ?? STYLE_CLASSES.mond;

    return new StyleClass(defaults);
}