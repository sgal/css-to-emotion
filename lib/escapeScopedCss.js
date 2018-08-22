"use strict";
function escapeScopedCss(scopedCss) {
    return scopedCss.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}
module.exports = escapeScopedCss;
