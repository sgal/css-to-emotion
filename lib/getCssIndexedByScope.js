"use strict";
const postcss = require("postcss");
const Stringifier = require("postcss/lib/stringifier");
const getNodeScopes = require("./getNodeScopes");
const getSelectorScope = require("./getSelectorScope");

function getCssIndexedByScope(css) {
    const cssIndexedByScope = new Map();
    const scopesStack = [];
    function builder(output, node, flag) {
        if (node && node.name === "import") return;
        if (flag === "start" && node) {
            scopesStack.push(getNodeScopes(node));
        }
        if (flag === "end") {
            output += "\n\n";
        }
        const lastScope = scopesStack.length ? scopesStack[scopesStack.length - 1] : [];
        lastScope.forEach((scope) => {
            if (cssIndexedByScope.has(scope) === false) {
                cssIndexedByScope.set(scope, "");
            }
            if (flag === "start" &&
                node &&
                node.type === "rule" &&
                (node.parent.type !== "atrule" ||
                    /keyframes$/.test(node.parent.name) === false)) {
                if (node.selector !== ":root") {
                    output = `${(node.selectors || [])
                        .filter((selector) => getSelectorScope(selector) === scope)} {`;
                }
            }
            cssIndexedByScope.set(scope, cssIndexedByScope.get(scope) + output);
        });
        if (flag === "end") {
            scopesStack.pop();
        }
    }
    new Stringifier(builder).stringify(postcss.parse(css));
    return cssIndexedByScope;
}
module.exports = getCssIndexedByScope;
