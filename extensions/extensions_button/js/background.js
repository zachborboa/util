chrome.browserAction.onClicked.addListener(function( tab ) {
    chrome.tabs.query({ 'url': 'chrome://extensions/' }, function ( tabs ) {
        for ( var i = 0, tab; i < tabs.length; i++ ) {
            chrome.tabs.update( tabs[ i ].id, {
                'active': true,
            });
            chrome.windows.update( tabs[ i ].windowId, {
                'focused': true,
            });
            return;
        }
        chrome.tabs.create({
            'url': 'chrome://extensions/',
        });
    });
});
