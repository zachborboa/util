function documentClick(event) {
    var target = event.target;

    // Open non-javascript links clicked in background tabs.
    var targetClickedIsAnchor = target.nodeName === 'A';
    if (targetClickedIsAnchor && target.href && target.href !== 'javascript:void(0)') {
        openBackgroundTab(target.href);
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
