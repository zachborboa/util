console.info( 'background.js' );

var DEFAULT_PATTERNS = function() {
    var patterns = {
        '^https:\\/\\/calendar\\.google\\.com\\/': {
            'url': 'https://www.google.com/calendar/render',
        },
        '^https:\\/\\/mail\\.google\\.com\\/': {
            'url': 'https://mail.google.com/mail/u/0/#inbox',
        },
//        '^https:\\/\\/www\\.example\\.com\\/': {
//            'url': 'https://www.example.com/#opened',
//        },
    };
    var defaultPatterns = {};
    for ( var pattern in patterns ) {
        var url = patterns[ pattern ][ 'url' ];
        var key = btoa( pattern );
        defaultPatterns[ key ] = {
            'pattern': pattern,
            'url': url,
        };
    }
    return defaultPatterns;
}();
console.log( 'default patterns:', DEFAULT_PATTERNS );

var KeepTabsOpen = function() {
    this.options = {};
    this.init();
};

KeepTabsOpen.prototype.init = function() {
    console.info( 'KeepTabsOpen.prototype.init' );
    this.get( null, function( items ) {
        console.info( 'this.get callback' );
        keepTabsOpen.options = items;
        if ( ! keepTabsOpen.options.patterns ) {
            keepTabsOpen.options.patterns = DEFAULT_PATTERNS;
        }
        console.info( 'options set', keepTabsOpen.options );
    });
};

KeepTabsOpen.prototype.get = function( key, callback ) {
    console.info( 'KeepTabsOpen.prototype.get key:', key );
    chrome.storage.sync.get( key, function( items ) {
        console.log( 'KeepTabsOpen.prototype.get callback for key:', key );
        if ( chrome.runtime.lastError ) {
            console.warn( 'chrome.runtime.lastError.message', chrome.runtime.lastError.message );
        } else {
            console.log( 'items:', items );
            callback( items );
        }
    });
};

KeepTabsOpen.prototype.set = function( key, callback ) {
    console.info( 'KeepTabsOpen.prototype.set key:', key );
    chrome.storage.sync.get( key, function() {
        console.log( 'KeepTabsOpen.prototype.set callback for key:', key );
        if ( chrome.runtime.lastError ) {
            console.warn( 'chrome.runtime.lastError.message', chrome.runtime.lastError.message );
        } else {
            callback();
        }
    });
};

KeepTabsOpen.prototype.addPattern = function( patternObj, callback ) {
    console.info( 'KeepTabsOpen.prototype.addPattern', patternObj );
    var key = btoa( patternObj.pattern );
    console.log( 'key:', key );
    var added = false;
    if ( ! ( key in this.options.patterns ) ) {
        added = true;
    }
    console.log( 'added:', added );
    this.options.patterns[ key ] = patternObj;
    KeepTabsOpen.set( this.options, function() {
        callback( added );
    });
};

KeepTabsOpen.prototype.removePattern = function( pattern, callback ) {
    console.info( 'KeepTabsOpen.prototype.removePattern', pattern );
    var key = btoa( pattern );
    console.log( 'key:', key );
    delete this.options.patterns[ key ];
    callback();
};

var keepTabsOpen = new KeepTabsOpen();

chrome.alarms.onAlarm.addListener(function( alarm ) {
    console.info( 'chrome.alarms.onAlarm.addListener callback', alarm );
    if ( alarm.name === 'keepTabsOpen' ) {
        var getInfo = {
            'populate': true,
        };
        var callback = function( windows ) {

            var urlsOpen = [];
            windows.forEach(function( window ) {
                window.tabs.forEach(function( tab ) {
                    urlsOpen.push( tab.url );
                });
            });

            var patternsToOpen = function() {
                var patterns = [];
                for ( var key in keepTabsOpen.options.patterns ) {
                    var data = keepTabsOpen.options.patterns[ key ];
                    patterns.push( data );
                }
                return patterns;
            }();

            for ( var i = patternsToOpen.length - 1; i >= 0; i-- ) {
                var data = patternsToOpen[ i ];
                var regex = RegExp( data.pattern );
                for ( var j = 0; j < urlsOpen.length; j++ ) {
                    var urlOpen = urlsOpen[ j ];
                    if ( regex.test( urlOpen ) ) {
                        patternsToOpen.splice( i, 1 );
                        break;
                    }
                }
            }

            console.log( 'number of urls to open:', patternsToOpen.length );
            if ( patternsToOpen.length ) {
                for ( var i = 0; i < patternsToOpen.length; i++ ) {
                    var data = patternsToOpen[ i ];
                    var url = data.url;
                    console.log( 'opening', url );

                    // For chrome.windows.create:
                    // TODO: Add ability to open incognito windows.
                    // TODO: Add ability to open an active window.
                    // TODO: Add ability to specify the window's 'left', 'top', 'width', and 'height'.
                    // TODO: Add ability to specify the window state ("normal", "minimized", "maximized", "fullscreen",
                    // or "docked").

                    // For chrome.tabs.create:
                    // TODO: Add ability to open an active tab.

                    var createProperties = {
                        'active': false,
                        'url': url,
                    };
                    var callback = function() {
                    };
                    chrome.tabs.create(
                        /* object */ createProperties,
                        /* function */ callback
                    );
                }
            }
        };
        chrome.windows.getAll(
            /* object */ getInfo,
            /* function */ callback
        );
    }
});

// TODO: Get alarm settings from storage.

// Creates an alarm. Near the time(s) specified by alarmInfo, the onAlarm event is fired. If there is another alarm
// with the same name (or no name if none is specified), it will be cancelled and replaced by this alarm.
var name = 'keepTabsOpen';
var alarmInfo = {
    'when': 1000,
    'periodInMinutes': 1,
};
chrome.alarms.create(
    /* string */ name,
    /* object */ alarmInfo
);
