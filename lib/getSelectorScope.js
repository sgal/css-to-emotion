"use strict";
const parseSelector = require("postcss-selector-parser");

function getSelectorScope(selector) {
    let selectorScope = "root";
    parseSelector((nodes) => {
        for (const node of nodes.first.nodes) {
            if (node.type === "class") {
                selectorScope = node.toString();
                break;
            }

            if (node.type === "pseudo" && node.value === ":root") {
                selectorScope = "vars";
                break;
            }
        }
    }).processSync(selector);
    return selectorScope;
}
module.exports = getSelectorScope;
