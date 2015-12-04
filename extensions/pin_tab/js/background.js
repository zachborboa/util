var PinTab = function() {
};

PinTab.prototype.pinTab = function( options ) {
    console.info( 'PinTab.prototype.pinTab' );
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
    console.info( 'PinTab.prototype.unpinTab' );
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

PinTab.prototype.togglePin = function( options ) {
    console.info( 'PinTab.prototype.togglePin' );
    if ( options.tab.pinned ) {
        this.unpinTab({
            'tab': options.tab,
        });
    } else {
        this.pinTab({
            'tab': options.tab,
        });
    }
};

PinTab.prototype.set = function( key, callback ) {
    console.info( 'PinTab.prototype.set' );
    chrome.storage.sync.set( key, function() {
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
                pinTab.togglePin({
                    'tab': tab,
                });
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
    console.info( 'chrome.tabs.onUpdated', tab );
    if ( tab.pinned ) {
        return;
    }
    if ( tab.status === 'complete' ) {
        // TODO: Get pin patterns from settings/storage.
        var pinPatterns = [
            /^https:\/\/www\.example\.com\/pin\//,
        ];
        for ( var i = 0; i < pinPatterns.length; i++ ) {
            var pinPattern = pinPatterns[ i ];
            console.log( pinPattern );
            if ( pinPattern.test( tab.url ) ) {
                console.log( 'matched' );
                pinTab.pinTab({
                    'tab': tab,
                });
                break;
            }
        }
    }
});
