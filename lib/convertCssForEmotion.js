"use strict";
const convertScopedCssForEmotion = require("./convertScopedCssForEmotion");
const convertScopeToModuleName = require("./convertScopeToModuleName");
const convertImportsForEmotion = require("./convertImportsForEmotion");
const getCssIndexedByScope = require("./getCssIndexedByScope");
const collectImports = require("./collectImports");
const getNameFromPath = require("./getNameFromPath");
const collectSelectorsUsage = require("./collectSelectorsUsage");
const sortScopes = require("./sortScopes");

function convertCssForEmotion(css) {
    let cssForEmotion = "";
    const cssIndexedByScope = getCssIndexedByScope(css);
    const onlyVars = cssIndexedByScope.has("vars") && cssIndexedByScope.size === 1;

    if (!onlyVars) {
        if (cssIndexedByScope.has("root")) {
            if (cssIndexedByScope.size > 1) {
                cssForEmotion += 'import {css, injectGlobal} from "react-emotion";\n';
            }
            else {
                cssForEmotion += 'import {injectGlobal} from "react-emotion";\n';
            }
        }
        else if (cssIndexedByScope.size > 0) {
            cssForEmotion += 'import {css} from "react-emotion";\n';
        }
    }
    const knownLocalVars = new Set();
    const assetImports = new Map();
    const imports = collectImports(css, knownLocalVars, assetImports);
    const knownScopes = new Set([...cssIndexedByScope.keys()]);
    const selectorsUsedInScopes = new Map();
    knownScopes.forEach((scope) => {
        collectSelectorsUsage(cssIndexedByScope.get(scope), scope, knownScopes, selectorsUsedInScopes);
    });

    const sortedKnownScopes = sortScopes(knownScopes, cssIndexedByScope, selectorsUsedInScopes);

    cssForEmotion += convertImportsForEmotion(imports, assetImports);

    sortedKnownScopes.forEach((scope) => {
        cssForEmotion += "\n";
        const convertedScopedCssForEmotion = convertScopedCssForEmotion(
            cssIndexedByScope.get(scope),
            scope,
            knownScopes,
            knownLocalVars,
            imports,
            assetImports
        );
        if (scope === "root") {
            cssForEmotion += `injectGlobal\`${convertedScopedCssForEmotion}\`;\n`;
        }
        else if (scope === "vars") {
            cssForEmotion += `${convertedScopedCssForEmotion}\n`;
        }
        else {
            cssForEmotion += `export const ${convertScopeToModuleName(scope)} = css\`${convertedScopedCssForEmotion}\`;\n`;
        }
    });
    return cssForEmotion;
}
module.exports = convertCssForEmotion;
