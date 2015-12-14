var DEFAULT_PIN_PATTERN_URLS = [
    '^https:\\/\\/calendar\\.google\\.com\\/',
    '^https:\\/\\/mail\\.google\\.com\\/',
];
var DEFAULT_PIN_PATTERNS = {};
for ( var i in DEFAULT_PIN_PATTERN_URLS ) {
    var pattern = DEFAULT_PIN_PATTERN_URLS[ i ];
    var key = btoa( pattern );
    DEFAULT_PIN_PATTERNS[ key ] = {
        'enabled': true,
        'pattern': pattern,
    };
}
console.log( 'DEFAULT_PIN_PATTERNS:', DEFAULT_PIN_PATTERNS );

var PinTab = function() {
    this.options = {};
    this.init();
};

PinTab.prototype.init = function() {
    console.info( 'PinTab.prototype.init' );
    this.get( null, function( items ) {
        console.info( 'this.get callback' );
        pinTab.options = items;
        if ( ! pinTab.options.pin_patterns ) {
            pinTab.options.pin_patterns = DEFAULT_PIN_PATTERNS;
        }
        console.info( 'options set', pinTab.options );
    });
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

PinTab.prototype.pinTabIfUrlMatch = function( tab ) {
    console.info( 'PinTab.prototype.pinTabIfUrlMatch' );
    if ( tab.pinned ) {
        return;
    }
    for ( var key in this.options.pin_patterns ) {
        var pinTabsPattern = this.options.pin_patterns[ key ];
        var pattern = RegExp( pinTabsPattern.pattern );
        console.log( pattern );
        if ( pattern.test( tab.url ) ) {
            console.log( 'matched' );
            pinTab.pinTab({
                'tab': tab,
            });
            break;
        }
    }
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

PinTab.prototype.get = function( key, callback ) {
    console.info( 'PinTab.prototype.get key:', key );
    chrome.storage.sync.get( key, function( items ) {
        console.log( 'PinTab.prototype.get callback for key:', key );
        if ( chrome.runtime.lastError ) {
            console.warn( 'chrome.runtime.lastError.message', chrome.runtime.lastError.message );
        } else {
            console.log( 'items:', items );
            callback( items );
        }
    });
};

PinTab.prototype.set = function( key, callback ) {
    console.info( 'PinTab.prototype.set key:', key );
    chrome.storage.sync.get( key, function() {
        console.log( 'PinTab.prototype.set callback for key:', key );
        if ( chrome.runtime.lastError ) {
            console.warn( 'chrome.runtime.lastError.message', chrome.runtime.lastError.message );
        } else {
            callback();
        }
    });
};

PinTab.prototype.addPattern = function( patternObj, callback ) {
    console.info( 'PinTab.prototype.addPattern', patternObj );
    var key = btoa( patternObj.pattern );
    console.log( 'key:', key );
    var added = false;
    if ( ! ( key in this.options.pin_patterns ) ) {
        added = true;
    }
    console.log( 'added:', added );
    this.options.pin_patterns[ key ] = patternObj;
    pinTab.set( this.options, function() {
        callback( added );
    });
};

PinTab.prototype.removePattern = function( pattern, callback ) {
    console.info( 'PinTab.prototype.removePattern', pattern );
    var key = btoa( pattern );
    console.log( 'key:', key );
    delete this.options.pin_patterns[ key ];
    callback();
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
    pinTab.pinTabIfUrlMatch( tab );
});

// Fired when a tab is updated.
chrome.tabs.onUpdated.addListener(function(
    /* integer */ tabId,
    /* object */ changeInfo,
    /* Tab */ tab ) {
    console.info( 'chrome.tabs.onUpdated', tab );
    pinTab.pinTabIfUrlMatch( tab );
});
