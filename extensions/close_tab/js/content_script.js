window.onhashchange = function() {
    if ( window.location.hash === '#_closeTab' ) {
        chrome.runtime.sendMessage({
            'action': 'chrome.tabs.remove',
        });
    }
};
