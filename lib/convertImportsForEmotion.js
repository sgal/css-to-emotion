"use strict";
const getNameFromPath = require("./getNameFromPath");

function convertImportsForEmotion(imports, assetImports) {
    let cssForEmotion = "";

    imports.forEach((usedVars, importPath) => {
        const importAlias = getNameFromPath(importPath);
        const convertedImportPath = importPath.replace(".css", ".styles");
        if (!usedVars.length) {
            cssForEmotion += `import * as ${importAlias} from ${convertedImportPath};\n`;
        }
        else {
            const varImports = usedVars.map((varEntry) => `${varEntry.name} as ${varEntry.alias}`);
            cssForEmotion += `import {${varImports.join(", ")}} from ${convertedImportPath};\n`;
        }
    });

    assetImports.forEach((alias, importPath) => {
        if (importPath.indexOf("\"") > -1) {
            cssForEmotion += `import ${alias} from ${importPath};\n`;
        } else {
            cssForEmotion += `import ${alias} from "${importPath}";\n`;
        }
    });

    return cssForEmotion;
}

module.exports = convertImportsForEmotion;
