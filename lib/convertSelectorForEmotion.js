"use strict";
const parseSelector = require("postcss-selector-parser");
const convertScopeToModuleName = require("./convertScopeToModuleName");

function convertSelectorForEmotion(selector, scope, knownScopes) {
    return parseSelector((nodes) => {
        nodes.first.walkClasses((node) => {
            if (node.toString() === scope) {
                node.toString = () => "&";
            }
            else if (knownScopes.has(node.toString())) {
                node.toString = () => ".${" + convertScopeToModuleName(node.value) + "}";
            }
        });
    }).processSync(selector);
}
module.exports = convertSelectorForEmotion;
