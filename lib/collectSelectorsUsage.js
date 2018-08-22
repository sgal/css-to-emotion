"use strict";
const postcss = require("postcss");
const Stringifier = require("postcss/lib/stringifier");
const parseSelector = require("postcss-selector-parser");
const convertScopeToModuleName = require("./convertScopeToModuleName");

function collectSelectorsUsage(scopedCss, scope, knownScopes, selectorsUsedInScopes) {
    function builder(output, node, flag) {
        if (!node) return;
        if ((flag === "start" || flag === "end") && node.type === "rule") {
            if (node.selector !== scope && node.selector !== ":root") {
                if (flag === "start") {
                    (node.selectors || []).forEach((selector) => {
                        parseSelector((nodes) => {
                            nodes.first.walkClasses((node) => {
                                if (node.toString() !== scope && knownScopes.has(node.toString())) {
                                    const selectorsForScope = selectorsUsedInScopes.get(scope) || new Set();
                                    selectorsForScope.add(node.toString());
                                    selectorsUsedInScopes.set(scope, selectorsForScope);
                                }
                            });
                        }).processSync(selector);
                    });
                }
            }
        }
        else if (node.type === "decl" && node.prop === "composes") {
            const isExternal = node.value.indexOf(" from ") !== -1;
            if (isExternal) return;

            const selectorsForScope = selectorsUsedInScopes.get(scope) || new Set();
            selectorsForScope.add(`.${node.value}`);
            selectorsUsedInScopes.set(scope, selectorsForScope);
        }
    }
    const parsedCss = postcss.parse(scopedCss);
    new Stringifier(builder).stringify(parsedCss);
}
module.exports = collectSelectorsUsage;
