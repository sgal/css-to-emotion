"use strict";
const camelCase = require("camelcase");

function convertScopeToModuleName(scope) {
    return camelCase(scope)
        .replace(/^(\d)/, "_$1")
        .replace("@", "")
        .replace(/^(break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|this|throw|try|typeof|var|void|while|with)$/, "_$1");
}
module.exports = convertScopeToModuleName;
