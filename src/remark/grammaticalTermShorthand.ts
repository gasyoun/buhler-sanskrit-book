import {createShorthandPlugin, makeTextSpan} from './shorthand';

export default createShorthandPlugin({
    regex: /__GT_(.+?)__/g,
    prefix: 'GT_',
    makeSpan: (term) => makeTextSpan('grammatical-term', term),
});
