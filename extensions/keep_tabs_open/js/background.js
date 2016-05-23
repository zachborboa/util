console.info('background.js');

var KeepTabsOpen = function() {
    this.options = {};
    this.default_patterns = function() {
        var patterns = [
            {
                'urlToOpen': 'https://www.google.com/calendar/render',
                'whenPatternsNotFound': [
                    '^https:\\/\\/accounts\\.google\\.com\\/ServiceLogin\\?',
                    '^https:\\/\\/calendar\\.google\\.com\\/',
                ],
            },
            {
                'urlToOpen': 'https://mail.google.com/mail/u/0/#inbox',
                'whenPatternsNotFound': [
                    '^https:\\/\\/accounts\\.google\\.com\\/ServiceLogin\\?',
                    '^https:\\/\\/mail\\.google\\.com\\/',
                ],
            },
        ];
        var defaultPatterns = {};
        for ( var i in patterns ) {
            var urlToOpen = patterns[i]['urlToOpen'];
            var key = btoa(urlToOpen);
            defaultPatterns[key] = patterns[i];
        }
        return defaultPatterns;
    }();
    console.log('default patterns:', this.default_patterns);

    this.init();
};

KeepTabsOpen.prototype.init = function() {
    console.info('KeepTabsOpen.prototype.init');
    this.get(null, function(items) {
        console.info('this.get callback');
        keepTabsOpen.options = items;
        if ( ! keepTabsOpen.options.patterns ) {
            keepTabsOpen.options.patterns = keepTabsOpen.default_patterns;
        }
        console.info('options set', keepTabsOpen.options);
    });
};

KeepTabsOpen.prototype.get = function(key, callback) {
    console.info('KeepTabsOpen.prototype.get key:', key);
    chrome.storage.sync.get(key, function(items) {
        console.log('KeepTabsOpen.prototype.get callback for key:', key);
        if ( chrome.runtime.lastError ) {
            console.warn('chrome.runtime.lastError.message', chrome.runtime.lastError.message);
        } else {
            console.log('items:', items);
            callback(items);
        }
    });
};

/*
KeepTabsOpen.prototype.set = function(key, callback) {
    console.info('KeepTabsOpen.prototype.set key:', key);
    chrome.storage.sync.get(key, function() {
        console.log('KeepTabsOpen.prototype.set callback for key:', key);
        if ( chrome.runtime.lastError ) {
            console.warn('chrome.runtime.lastError.message', chrome.runtime.lastError.message);
        } else {
            callback();
        }
    });
};
*/

/*
KeepTabsOpen.prototype.addPattern = function(patternObj, callback) {
    console.info('KeepTabsOpen.prototype.addPattern', patternObj);
    var key = btoa(patternObj.pattern);
    console.log('key:', key);
    var added = false;
    if ( ! ( key in this.options.patterns ) ) {
        added = true;
    }
    console.log('added:', added);
    this.options.patterns[key] = patternObj;
    KeepTabsOpen.set(this.options, function() {
        callback(added);
    });
};
*/

/*
KeepTabsOpen.prototype.removePattern = function(pattern, callback) {
    console.info('KeepTabsOpen.prototype.removePattern', pattern);
    var key = btoa(pattern);
    console.log('key:', key);
    delete this.options.patterns[key];
    callback();
};
*/

var keepTabsOpen = new KeepTabsOpen();

chrome.alarms.onAlarm.addListener(function( alarm ) {
    console.info('chrome.alarms.onAlarm.addListener callback', alarm);
    if ( alarm.name === 'keepTabsOpen' ) {
        chrome.windows.getAll(
            // object getInfo
            {
                'populate': true,
            },
            // function callback
            function( windows ) {

                var openUrls = [];
                windows.forEach(function(win) {
                    win.tabs.forEach(function(tab) {
                        openUrls.push(tab.url);
                    });
                });
                console.log('urls open:', openUrls);
                console.log('--------------------------------------------------------------------------------');

                var urlsToOpen = [];
                for ( var key in keepTabsOpen.options.patterns ) {
                    console.log('key:', key);
                    var data = keepTabsOpen.options.patterns[key];
                    console.log('data:', data);

                    var urlToMaybeOpen = data['urlToOpen'];
                    var whenPatternsNotFound = data['whenPatternsNotFound'];
                    var found = false;
                    dance:
                    for ( var i = 0; i < whenPatternsNotFound.length; i++ ) {
                        var pattern = whenPatternsNotFound[i];
                        var regex = RegExp(pattern);
                        console.log('looking for pattern:', pattern);
                        for ( var j = 0; j < openUrls.length; j++ ) {
                            var openUrl = openUrls[j];
                            console.log('looking for pattern:', pattern, 'in open url:', openUrl);
                            if ( regex.test(openUrl) ) {
                                console.log('pattern found');
                                found = true;
                                break dance;
                            }
                        }
                    }

                    if (!found) {
                        console.log('pattern not found');
                        console.log('adding url', urlToMaybeOpen, 'to list of urls to open');
                        urlsToOpen.push(urlToMaybeOpen);
                    }
                    console.log('---');
                }

                console.log('urls to open:', urlsToOpen);
                console.log('number of urls to open:', urlsToOpen.length);

                if ( urlsToOpen.length ) {
                    for ( var i = 0; i < urlsToOpen.length; i++ ) {
                        var url = urlsToOpen[i];
                        console.log('opening', url);

                        // For chrome.windows.create:
                        // TODO: Add ability to open incognito windows.
                        // TODO: Add ability to open an active window.
                        // TODO: Add ability to specify the window's 'left', 'top', 'width', and 'height'.
                        // TODO: Add ability to specify the window state ("normal", "minimized", "maximized", "fullscreen",
                        // or "docked").

                        // For chrome.tabs.create:
                        // TODO: Add ability to open an active tab.

                        chrome.tabs.create(
                            // object createProperties
                            {
                                'active': false,
                                'url': url,
                            },
                            // function callback
                            function() {
                            }
                        );
                    }
                }
            }
        );
    }
});

// TODO: Get alarm settings from storage.

// Creates an alarm. Near the time(s) specified by alarmInfo, the onAlarm event is fired. If there is another alarm
// with the same name (or no name if none is specified), it will be cancelled and replaced by this alarm.
chrome.alarms.create(
    // string name
    'keepTabsOpen',
    // object alarmInfo
    {
        'when': 1000,
        'periodInMinutes': 1,
    }
);
