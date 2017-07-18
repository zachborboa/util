function checkHash() {
    if ( window.location.hash === '#_closeTab' ) {
        chrome.runtime.sendMessage({
            'action': 'chrome.tabs.remove',
        });
    }
}

window.onhashchange = checkHash;
window.onload = checkHash;
