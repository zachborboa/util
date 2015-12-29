window.onhashchange = function() {
    if ( window.location.hash === '#_closeWindow' ) {
        chrome.runtime.sendMessage({
            'action': 'chrome.tabs.remove',
        });
    }
};
