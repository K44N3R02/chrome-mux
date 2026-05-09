export function fuzzySearch(itemList, query) {
    const result = itemList
        .map((item) => fuzzyMatch(item, query))
        .filter(({ matched }) => matched);

    result.sort(sortResults);

    return result;
}

function fuzzyMatch(item, query) {
    const result = {
        item: item,
        matched: false,
        matchIndex: 0,
        matchDistance: 0,
    };

    if (query === '') {
        result.matched = true;
        return result;
    }

    // First pass: check if there is a match
    let foundCharsOfQuery = 0;
    let i;
    for (i = 0; i < item.length; i++) {
        if (item[i] === query[foundCharsOfQuery]) {
            foundCharsOfQuery++;
        }
        if (foundCharsOfQuery === query.length) {
            result.matched = true;
            break;
        }
    }

    if (!result.matched) {
        return result;
    }

    // Second pass: find shortest first match
    let queryIndex = query.length - 1;
    for (let j = i; j >= 0; j--) {
        if (item[j] === query[queryIndex]) {
            queryIndex--;
        }
        if (queryIndex === -1) {
            result.matchIndex = j;
            result.matchDistance = i - j + 1;
            break;
        }
    }

    return result;
}

function sortResults(a, b) {
    if (a.matchDistance !== b.matchDistance) {
        return a.matchDistance - b.matchDistance;
    }

    if (a.matchIndex !== b.matchIndex) {
        return a.matchIndex - b.matchIndex;
    }

    return a.item.localeCompare(b.item);
}
