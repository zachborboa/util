var PinTab = function() {
};

PinTab.prototype.pinTab = function( options ) {
    var updateProperties = {
        pinned: true,
    };
    if ( options.shouldActivate ) {
        updateProperties.active = true;
    }
    chrome.tabs.update( options.tab.id, updateProperties, function( tab ) {
        if ( tab.pinned ) {
            // TODO: Move tab to index from settings chrome.tabs.move( options.tab.id, { 'index': ... });
        } else {
            console.warn( 'failed to pin tab' );
        }
    });
};

PinTab.prototype.unpinTab = function( options ) {
    chrome.tabs.update( options.tab.id, {
        'pinned': false,
    }, function( tab ) {
        if ( ! tab.pinned ) {
            chrome.tabs.move( tab.id, {
                'index': -1,
            });
        } else {
            console.log( 'failed to unpin tab' );
        }
    });
};

var pinTab = new PinTab();

// Pin the active tab when the browser action icon is clicked.
chrome.browserAction.onClicked.addListener(function() {
    console.info( 'chrome.browserAction.onClicked' );
    chrome.windows.getCurrent({
        'populate': true,
        'windowTypes': ['normal',],
    }, function ( currentWindow ) {
        console.log( 'currentWindow:', currentWindow );
        for ( var i = 0; i < currentWindow.tabs.length; i++ ) {
            var tab = currentWindow.tabs[ i ];
            console.log( 'tab:', tab );
            if ( tab.active ) {
                console.log( 'tab is active' );
                if ( tab.pinned ) {
                    pinTab.unpinTab({
                        'tab': tab,
                        'source': 'browseraction',
                    });
                } else {
                    pinTab.pinTab({
                        'tab': tab,
                        'source': 'browseraction',
                        'remember': false,
                    });
                }
                break;
            }
        }
    });
});

// Fired when a tab is created. The tab's URL may not be set at the time this event fired. Listen to onUpdated events to
// be notified when a URL is set.
chrome.tabs.onCreated.addListener(function(
    /* Tab */ tab ) {
    console.info( 'chrome.tabs.onCreated', tab );
});

// Fired when a tab is updated.
chrome.tabs.onUpdated.addListener(function(
    /* integer */ tabId,
    /* object */ changeInfo,
    /* Tab */ tab ) {
    console.info( 'chrome.tabs.onCreated', tab );
    // TODO: Loop through all saved settings to see if we should pin this tab.
});
