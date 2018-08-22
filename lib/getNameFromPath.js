"use strict";
const convertScopeToModuleName = require("./convertScopeToModuleName");
function getNameFromPath(pathString) {
    if (!pathString) return "";
    const pathParts = pathString.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    return convertScopeToModuleName(lastPart.slice(0, -5));
}

module.exports = getNameFromPath;
