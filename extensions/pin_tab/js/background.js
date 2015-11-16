function unpinTab( options ) {
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
    })
}

function pinTab( options ) {
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
}

// Pin the active tab when the browser action icon is clicked.
chrome.browserAction.onClicked.addListener(function() {
    chrome.windows.getCurrent({
        'populate': true,
        'windowTypes': ['normal',],
    }, function ( window ) {
        console.log( 'window:', window );
        for ( var i = 0; i < window.tabs.length; i++ ) {
            console.log( '---' );
            var tab = window.tabs[ i ];
            console.log( 'tab:', tab );
            if ( tab.active ) {
                console.log( 'tab is active' );
                if ( tab.pinned ) {
                    unpinTab({
                        'tab': tab,
                        'source': 'browseraction',
                    });
                } else {
                    pinTab({
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
