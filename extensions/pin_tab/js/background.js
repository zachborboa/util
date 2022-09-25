const DEBUG = false;

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
DEBUG && console.log( 'DEFAULT_PIN_PATTERNS:', DEFAULT_PIN_PATTERNS );

var PinTab = function() {
    this.options = {};
    this.init();
};

PinTab.prototype.init = function() {
    DEBUG && console.info( 'PinTab.prototype.init' );
    this.get( null, function( items ) {
        DEBUG && console.info( 'this.get callback' );
        pinTab.options = items;
        if ( ! pinTab.options.pin_patterns ) {
            pinTab.options.pin_patterns = DEFAULT_PIN_PATTERNS;
        }
        DEBUG && console.info( 'options set', pinTab.options );
    });
};

PinTab.prototype.pinTab = function( options ) {
    DEBUG && console.info( 'PinTab.prototype.pinTab' );
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
            DEBUG && console.warn( 'failed to pin tab' );
        }
    });
};

PinTab.prototype.pinTabIfUrlMatch = function( tab ) {
    DEBUG && console.info( 'PinTab.prototype.pinTabIfUrlMatch' );
    if ( tab.pinned ) {
        return;
    }
    for ( var key in this.options.pin_patterns ) {
        var pinTabsPattern = this.options.pin_patterns[key];
        var pattern = RegExp(pinTabsPattern.pattern);
        DEBUG && console.log(pattern);
        if ( pattern.test(tab.url) ) {
            DEBUG && console.log('matched');
            pinTab.pinTab({
                'tab': tab,
            });
            break;
        }
    }
};

PinTab.prototype.unpinTab = function( options ) {
    DEBUG && console.info( 'PinTab.prototype.unpinTab' );
    chrome.tabs.update( options.tab.id, {
        'pinned': false,
    }, function( tab ) {
        if ( ! tab.pinned ) {
            chrome.tabs.move( tab.id, {
                'index': -1,
            });
        } else {
            DEBUG && console.log( 'failed to unpin tab' );
        }
    });
};

PinTab.prototype.togglePin = function( options ) {
    DEBUG && console.info( 'PinTab.prototype.togglePin' );
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
    DEBUG && console.info( 'PinTab.prototype.get key:', key );
    chrome.storage.sync.get( key, function( items ) {
        DEBUG && console.log( 'PinTab.prototype.get callback for key:', key );
        if ( chrome.runtime.lastError ) {
            DEBUG && console.warn( 'chrome.runtime.lastError.message', chrome.runtime.lastError.message );
        } else {
            DEBUG && console.log( 'items:', items );
            callback( items );
        }
    });
};

PinTab.prototype.set = function( key, callback ) {
    DEBUG && console.info( 'PinTab.prototype.set key:', key );
    chrome.storage.sync.set( key, function() {
        DEBUG && console.log( 'PinTab.prototype.set callback for key:', key );
        if ( chrome.runtime.lastError ) {
            DEBUG && console.warn( 'chrome.runtime.lastError.message', chrome.runtime.lastError.message );
        } else {
            callback();
        }
    });
};

PinTab.prototype.addPattern = function( patternObj, callback ) {
    DEBUG && console.info( 'PinTab.prototype.addPattern', patternObj );
    var key = btoa( patternObj.pattern );
    DEBUG && console.log( 'key:', key );
    var added = false;
    if ( ! ( key in this.options.pin_patterns ) ) {
        added = true;
    }
    DEBUG && console.log( 'added:', added );
    this.options.pin_patterns[ key ] = patternObj;
    pinTab.set( this.options, function() {
        callback( added );
    });
};

PinTab.prototype.removePattern = function( pattern, callback ) {
    DEBUG && console.info( 'PinTab.prototype.removePattern', pattern );
    var key = btoa( pattern );
    DEBUG && console.log( 'key:', key );
    delete this.options.pin_patterns[ key ];
    callback();
};

PinTab.prototype.getMatchingTabCount = function(callback) {
    DEBUG && console.info('PinTab.prototype.getMatchingTabCount');
    chrome.windows.getAll(
        /* object getInfo */ {
            'populate': true,
        },
        /* function callback */ function(windows) {
            var tabsOpen = {};
            windows.forEach(function(window) {
                window.tabs.forEach(function(tab) {
                    tabsOpen[tab.id] = tab;
                });
            });
            DEBUG && console.log('tabsOpen:', tabsOpen);

            DEBUG && console.log('looping through all pin patterns');
            var patternMatches = {};
            for ( var key in pinTab.options.pin_patterns ) {
                var pinTabsPattern = pinTab.options.pin_patterns[key];
                DEBUG && console.log('pattern:', pinTabsPattern.pattern);
                var regex = RegExp(pinTabsPattern.pattern);
                DEBUG && console.log('regex:', regex);
                patternMatches[key] = 0;
                for ( var k in tabsOpen ) {
                    var tab = tabsOpen[k];
                    DEBUG && console.log('tab.url:', tab.url);
                    if ( regex.test(tab.url) ) {
                        DEBUG && console.log('matched');
                        patternMatches[key] += 1;
                    }
                }
                DEBUG && console.log('---');
            }

            DEBUG && console.log('patternMatches:', patternMatches);
            callback(patternMatches);
        }
    );
};


var pinTab = new PinTab();

// Pin the active tab when the browser action icon is clicked.
chrome.browserAction.onClicked.addListener(function() {
    DEBUG && console.info( 'chrome.browserAction.onClicked' );
    chrome.windows.getCurrent({
        'populate': true,
        'windowTypes': ['normal',],
    }, function ( currentWindow ) {
        DEBUG && console.log( 'currentWindow:', currentWindow );
        for ( var i = 0; i < currentWindow.tabs.length; i++ ) {
            var tab = currentWindow.tabs[ i ];
            DEBUG && console.log( 'tab:', tab );
            if ( tab.active ) {
                DEBUG && console.log( 'tab is active' );
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
    DEBUG && console.info( 'chrome.tabs.onCreated', tab );
    pinTab.pinTabIfUrlMatch( tab );
});

// Fired when a tab is updated.
chrome.tabs.onUpdated.addListener(function(
    /* integer */ tabId,
    /* object */ changeInfo,
    /* Tab */ tab ) {
    DEBUG && console.info( 'chrome.tabs.onUpdated', tab );
    pinTab.pinTabIfUrlMatch( tab );
});

// Used by hotkeys.
// https://developer.chrome.com/docs/extensions/reference/commands/#event-onCommand
/*
chrome.commands.onCommand.addListener(function() {
    DEBUG && console.info('chrome.commands.onCommand');

    chrome.tabs.query(
        // queryInfo
        {
            'active': true,
            'currentWindow': true,
        },
        // callback
        function(tabs) {
            var tab = tabs[0];
            pinTab.togglePin({
                'tab': tab,
            });
        }
    );
});
*/
