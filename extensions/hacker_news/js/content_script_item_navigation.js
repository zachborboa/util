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

function documentClick(event) {
    var target = event.target;

    // Open non-javascript links clicked in background tabs.
    var targetClickedIsAnchor = target.nodeName === 'A';
    var anchorUrl = target.getAttribute('href');
    if (targetClickedIsAnchor && anchorUrl !== 'javascript:void(0)') {
        openBackgroundTab(anchorUrl);
        event.preventDefault();
        return;
    }

    // Avoid collapsing comment when there is a selection.
    if (window.getSelection().toString() !== '') {
        return;
    }

    // Toggle comment collapse when comment is clicked.
    var targetParents = getElementParents(target, '.comment');
    if (target.classList.contains('comment') || targetParents.length ) {
        var comment = getElementParents(target, '.athing')[0];
        var commentToggle = comment.querySelector('.togg');
        commentToggle.click();
    }
}

document.addEventListener('click', documentClick);
