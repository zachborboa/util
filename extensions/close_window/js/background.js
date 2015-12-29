chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if ( message.action === 'chrome.tabs.remove' ) {
        var tabId = sender.tab.id;
        chrome.tabs.remove( tabId );
    }
});
