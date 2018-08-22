"use strict";
const postcss = require("postcss");
const Stringifier = require("postcss/lib/stringifier");
const convertSelectorForEmotion = require("./convertSelectorForEmotion");
const convertScopeToModuleName = require("./convertScopeToModuleName");
const getNameFromPath = require("./getNameFromPath");

function getImportAlias(varName, imports, knownLocalVars) {
    let alias = null;
    const convertedVarName = convertScopeToModuleName(varName);
    if (knownLocalVars.has(convertedVarName)) return convertedVarName;

    const keysIterator = imports.keys();

    while (alias === null) {
        const key = keysIterator.next().value;
        if (!key) break;
        const vars = imports.get(key);
        const entry = vars.find((varEntry) => varEntry.rawName === varName);
        if (entry) {
            alias = entry.alias;
        }
    }

    return alias;
}

function convertNodeValue(nodeValue, knownLocalVars, imports) {
    const varRegExp = /var\(--[^\)]{2,}\)/g;
    const convertedNodeValue = nodeValue.replace(varRegExp, (match) => {
        const rawVarName = match.substring(4, match.length - 1);
        const varName = convertScopeToModuleName(rawVarName);
        if (knownLocalVars.has(varName)) {
            return `\${${varName}\}`;
        }
        else {
            const importAlias = getImportAlias(rawVarName, imports, knownLocalVars);
            if (importAlias) {
                return `\${${importAlias}\}`;
            }
        }
    });

    return convertedNodeValue;
}

function convertVarValue(nodeValue, knownLocalVars, imports) {
    const varRegExp = /var\(--[^\)]{2,}\)/g;
    const matches = nodeValue.match(varRegExp) || [];
    if (matches.length === 0) return `"${nodeValue}"`;

    const onlyVar = matches.length === 1 && nodeValue.length === matches[0].length;
    const lastMatchIndex = matches.length ? nodeValue.indexOf(matches[matches.length - 1]) : -1;
    const stringify = lastMatchIndex !== 0 || !onlyVar;

    const convertedNodeValue = nodeValue.replace(varRegExp, (match) => {
        const rawVarName = match.substring(4, match.length - 1);
        const varName = convertScopeToModuleName(rawVarName);
        if (knownLocalVars.has(varName)) {
            if (stringify) return `\${${varName}\}`;
            return varName;
        }
        else {
            const importAlias = getImportAlias(rawVarName, imports, knownLocalVars);
            if (importAlias) {
                if (stringify) return `\${${importAlias}\}`;
                return importAlias;
            }
        }
    });

    if (stringify) return `\`${convertedNodeValue}\``;
    return convertedNodeValue;
}

function convertScopedCssForEmotion(scopedCss, scope, knownScopes, knownLocalVars, imports, assetImports) {
    let scopedCssForEmotion = "";
    function builder(output, node, flag) {
        if (!node) {
            scopedCssForEmotion += output;
            return;
        }
        if ((flag === "start" || flag === "end") && node.type === "rule") {
            if (node.selector === scope) {
                if (node.parent.type === "root") {
                    return;
                }
                else if (flag === "start") {
                    output = "& {";
                }
            }
            else if (node.selector === ":root") {
                output = "";
                if (flag === "start") {
                    node.nodes.forEach((varNode) => {
                        if (varNode.type !== "comment") {
                            const name = convertScopeToModuleName(varNode.prop);
                            const convertedValue = convertVarValue(varNode.value, knownLocalVars, imports);
                            output += `export const ${name} = ${convertedValue};\n`;
                        }
                    });
                }
            }
            else {
                if (flag === "start") {
                    const convertedSelectors = new Set();
                    (node.selectors || []).forEach((selector) => {
                        convertedSelectors.add(convertSelectorForEmotion(selector, scope, knownScopes));
                    });
                    // TODO remove join usage once https://github.com/prettier/prettier/issues/2883 is resolved
                    output = `${[...convertedSelectors].join(", ")} {`;
                }
            }
        }
        else if (node.type === "decl" && node.prop === "composes") {
            output = "";
            if (node.value.indexOf(" from ") === -1) {
                // local compose
                const parts = node.value.split(" ");
                parts.forEach((varName) => {
                    const name = convertScopeToModuleName(varName);
                    output += `\${${name}\};`;
                });
            }
            else {
                const [vars, importPath] = node.value.split(" from ");
                const importedVars = imports.get(importPath);
                const varNames = vars.split(" ");
                varNames.forEach((varName) => {
                    const entry = importedVars.find((value) => value.rawName === varName);
                    if (entry) {
                        output += `\${${entry.alias}\};`;
                    }
                    else {
                        output += `/* Variable '${varName}' was not found in ${importPath} */`;
                    }
                });
            }
        }
        else if (node.type === "decl" && node.prop.indexOf("--") === 0) {
            output = "";
        }
        else if (node.type === "decl" && node.value.indexOf("var(") !== -1) {
            const convertedValue = convertNodeValue(node.value, knownLocalVars, imports);
            output = `${node.prop}: ${convertedValue};\n`;
        }
        else if (node.type === "decl" && node.value.indexOf("url(") !== -1) {
            const convertedValue = node.value.replace(/url\([^\)]{2,}\)/g, (match) => {
                const assetPath = match.substring(4, match.length - 1);
                if (assetImports.has(assetPath)) {
                    return `url(\${${assetImports.get(assetPath)}\})`;
                }

                return match;
            })
            output = `${node.prop}: ${convertedValue};\n`;
        }
        else if (node.type === "atrule" && node.name === "media" && flag === "start") {
            const varRegExp = /[\(\s]--[^\)]{2,10}/;
            if (varRegExp.test(node.params)) {
                output = output.replace(/[\(]*--[^\)]{2,}[\)]*/g, (match) => {
                    const trimmedMatch = match.replace(/[\(|\)]/g, "");
                    const alias = getImportAlias(trimmedMatch, imports, knownLocalVars);
                    return `\${${alias}}`;
                });
            }
        }
        scopedCssForEmotion += output;
    }
    new Stringifier(builder).stringify(postcss.parse(scopedCss));
    return scopedCssForEmotion;
}
module.exports = convertScopedCssForEmotion;
