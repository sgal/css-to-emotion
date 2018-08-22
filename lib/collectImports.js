"use strict";
const postcss = require("postcss");
const Stringifier = require("postcss/lib/stringifier");
const convertScopeToModuleName = require("./convertScopeToModuleName");
const getNameFromPath = require("./getNameFromPath");

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getGlobalVarsImportPath(imports) {
    if (!imports) return null;

    const keys = [...imports.keys()];
    return keys.find((key) => key.indexOf("/variables.css") !== -1);
}

function addImportVar(imports, varName, importPath) {
    if (!importPath) {
        console.error(`Cannot add var ${varName} to ${importPath}`);
        return;
    }

    const vars = imports.get(importPath) || [];
    const alreadyImported = vars.some((entry) => entry.rawName === varName);
    if (alreadyImported) return;

    const importAlias = getNameFromPath(importPath);
    const convertedVarName = convertScopeToModuleName(varName);
    const varAlias = `${importAlias}${capitalize(convertedVarName)}`;
    const varEntry = {
        rawName: varName,
        name: convertedVarName,
        alias: varAlias
    };

    const newVars = [...vars, varEntry];
    imports.set(importPath, newVars);
}

function collectImports(scopedCss, knownLocalVars, assetImports) {
    const imports = new Map();
    const knownGlobalVars = new Set();

    function builder(output, node, flag) {
        if (!node) return;
        if (node.selector === ":root" && flag === "start") {
            node.nodes.forEach((varNode) => {
                if (varNode.type === "comment") return;
                const name = convertScopeToModuleName(varNode.prop);
                knownLocalVars.add(name);
            });
        }
        if (node.type === "decl" && node.prop === "composes") {
            const isExternal = node.value.indexOf(" from ") !== -1;
            if (!isExternal) return;

            const [vars, importPath] = node.value.split(" from ");
            const varNames = vars.split(" ");
            varNames.forEach((varName) => {
                addImportVar(imports, varName, importPath);
            });
        }
        else if (node.type === "decl" && node.value.indexOf("var(") !== -1) {
            node.value.replace(/var\(--[^\)]{2,}\)/g, (match) => {
                const varName = match.substring(4, match.length - 1);
                const convertedVarName = convertScopeToModuleName(varName);
                if (!knownLocalVars.has(convertedVarName) && !knownGlobalVars.has(varName)) {
                    knownGlobalVars.add(varName);
                    const globalVarsImportPath = getGlobalVarsImportPath(imports);
                    addImportVar(imports, varName, globalVarsImportPath);
                }
                return match;
            });
        }
        else if (node.type === "decl" && node.value.indexOf("url(") !== -1) {
            node.value.replace(/url\([^\)]{2,}\)/g, (match) => {
                const assetPath = match.substring(4, match.length - 1);
                const pathParts = assetPath.split("/");
                const filename = pathParts[pathParts.length - 1].split(".")[0];
                const convertedFilename = convertScopeToModuleName(filename);
                assetImports.set(assetPath, convertedFilename);
                return match;
            });
        }
        else if (node.type === "atrule" && node.name === "import") {
            if (imports.has(node.params)) return;

            imports.set(node.params, []);
        }
        else if (node.type === "atrule" && node.name === "media") {
            const varRegExp = /[\(\s]--[^\)]{2,}/;
            node.params.replace(/[\(\s]--[^\)]{2,}/, (match) => {
                const varName = match.substring(1);
                const convertedVarName = convertScopeToModuleName(varName);
                if (knownLocalVars.has(convertedVarName)) return;
                if (!knownGlobalVars.has(varName)) {
                    knownGlobalVars.add(varName);
                    const globalVarsImportPath = getGlobalVarsImportPath(imports);
                    addImportVar(imports, varName, globalVarsImportPath);
                }
                return match;
            });
        }
    }
    new Stringifier(builder).stringify(postcss.parse(scopedCss));
    return imports;
}
module.exports = collectImports;
