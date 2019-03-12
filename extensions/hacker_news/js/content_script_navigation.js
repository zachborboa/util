function documentClick(event) {
    var target = event.target;

    // Open submission links in background tabs.
    var targetAnchorParents = getElementParents(target, 'a');
    var targetInsideList = getElementParents(target, '.itemlist').length >= 1;
    if (targetAnchorParents.length && targetInsideList) {
        var anchor = targetAnchorParents[0];
        var anchorUrl = anchor.href;
        openBackgroundTab(anchorUrl);
        event.preventDefault();
        return;
    }
}

document.addEventListener('click', documentClick);
