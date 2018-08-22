"use strict";
const postcss = require("postcss");
const parseSelector = require("postcss-selector-parser");
const getSelectorScope = require("./getSelectorScope");

function getRequiredScopes(css, scope, knownScopes) {
    const requiredScopes = new Set();
    const root = postcss.parse(css);
    root.walkRules((rule) => {
        parseSelector((nodes) => {
            nodes.walkClasses((node) => {
                const selectorScope = getSelectorScope(node.toString());
                if (selectorScope === scope) {
                    return;
                }
                if (knownScopes.has(selectorScope)) {
                    requiredScopes.add(selectorScope);
                }
            });
        }).processSync(rule.selector);
    });
    return requiredScopes;
}
module.exports = getRequiredScopes;
