function openBackgroundTab(url) {
    chrome.runtime.sendMessage({
        'action': 'chrome.tabs.create',
        'data': {
            'url': url,
        },
    });
}

function getElementParents(element, selector) {
    var parents = [];
    for (; element && element !== document; element = element.parentNode) {
        if (selector) {
            if (element.matches(selector)) {
                parents.push(element);
            }
            continue;
        } else {
            parents.push(element);
        }
    }
    return parents;
}
