"use strict";
const getRequiredScopes = require("./getRequiredScopes");

function getNumberDependenciesForScope(scope, selectorsInScopes) {
    const selectorsForScope = selectorsInScopes.get(scope) || new Set();
    if (selectorsForScope.size === 0) return 0;

    return [...selectorsForScope].reduce((acc, currentScope) => {
        return acc + getNumberDependenciesForScope(currentScope, selectorsInScopes);
    }, 1);
}

function sortScopes(scopes, cssIndexedByScope, selectorsUsedInScopes) {
    const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base",
    });

    return [...scopes].sort((scopeA, scopeB) => {
            if (scopeA === "vars" || scopeA === "root") return -1;

            const selectorsForScopeA = selectorsUsedInScopes.get(scopeA) || new Set();
            const selectorsForScopeB = selectorsUsedInScopes.get(scopeB) || new Set();
            const dependenciesForScopeA = getNumberDependenciesForScope(scopeA, selectorsUsedInScopes);
            const dependenciesForScopeB = getNumberDependenciesForScope(scopeB, selectorsUsedInScopes);

            if (selectorsForScopeB.has(scopeA) || dependenciesForScopeA < dependenciesForScopeB) return -1;
            if (selectorsForScopeA.has(scopeB) || dependenciesForScopeA > dependenciesForScopeB) return 1;

            return collator.compare(scopeA, scopeB);
        })
        .reduce((previousSortedKnownScopes, knownScope) => {
            getRequiredScopes(cssIndexedByScope.get(knownScope), knownScope, scopes)
                .forEach((requiredScope) => {
                    if (previousSortedKnownScopes.has(requiredScope) === false) {
                        previousSortedKnownScopes.add(requiredScope);
                    }
                });
            if (previousSortedKnownScopes.has(knownScope) === false) {
                previousSortedKnownScopes.add(knownScope);
            }
            return previousSortedKnownScopes;
        }, new Set());
}

module.exports = sortScopes;
