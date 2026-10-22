// Match the list table by its submission rows; HN dropped the .itemlist class.
// Skip .fatitem, which holds the lone submission atop an item page.
function isInsideSubmissionList(element) {
    var table = element.closest('table');
    if (!table) {
        return false;
    } else if (table.matches('.fatitem')) {
        return false;
    } else {
        return table.querySelector(':scope > tbody > tr.athing.submission') !== null;
    }
}

function documentClick(event) {
    var target = event.target;

    // Open submission links in background tabs.
    var targetAnchorParents = getElementParents(target, 'a');
    var targetInsideList = isInsideSubmissionList(target);
    if (targetAnchorParents.length && targetInsideList) {
        var anchor = targetAnchorParents[0];
        var anchorUrl = anchor.href;
        openBackgroundTab(anchorUrl);
        event.preventDefault();
        return;
    }
}

document.addEventListener('click', documentClick);
