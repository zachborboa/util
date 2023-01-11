console.info('background.js');

var KeepTabsOpen = function() {
    this.options = {
        'alarmPeriodInMinutes': 1,
        'settings': [
            {
                'url_to_open': 'https://accounts.google.com/ServiceLogin?service=cl&continue=https://calendar.google.com/',
                'incognito': true,
                'index': 1,
                'pinned': true,
                'when_patterns_not_found': [
                    'https:\/\/accounts\.google\.com\/ServiceLogin',
                    'https:\/\/calendar\.google\.com\/',
                    'https:\/\/www\.google\.com\/calendar',
                ],
            },
            {
                'url_to_open': 'https://accounts.google.com/ServiceLogin?service=mail&continue=https://mail.google.com/',
                'incognito': true,
                'pinned': true,
                'when_patterns_not_found': [
                    'https:\/\/accounts\.google\.com\/ServiceLogin',
                    'https:\/\/mail\.google\.com\/',
                ],
            },
        ],
    };
    this.init();
};

KeepTabsOpen.prototype.init = function() {
    console.info('KeepTabsOpen.prototype.init');
    this.get(null, function(items) {
        console.info('this.get callback');
        if ( items.length ) {
            keepTabsOpen.options = items;
            console.info('options updated:', keepTabsOpen.options);
        } else {
            console.info('options not updated');
        }
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

KeepTabsOpen.prototype.getUrlAndSettingsToOpen = function(ref, settings) {
    var urlsAndSettingsToBeOpened = [];
    for ( var j = 0; j < settings.length; j++ ) {
        var setting = settings[j];
        var whenPatternsNotFound = setting['when_patterns_not_found'];
        var found = false;
        dance:
        for ( var k = 0; k < whenPatternsNotFound.length; k++ ) {
            var pattern = whenPatternsNotFound[k];
            var regex = RegExp(pattern);
            for ( var m = 0; m < ref.openUrls.length; m++ ) {
                var openUrl = ref.openUrls[m];
                if ( regex.test(openUrl) ) {
                    found = true;
                    break dance;
                }
            }
        }

        if ( ! found ) {
            if (setting['incognito'] && !chrome.extension.inIncognitoContext) {
                console.log('skipping incognito url as not in incognito context');
            } else {
                console.log('adding url');

                // Add url to list of urls to open.
                urlsAndSettingsToBeOpened.push(setting);

                // Add url that will be opened to list of effectively open urls.
                ref.openUrls.push(setting['url_to_open']);
            }
        }
    }

    return urlsAndSettingsToBeOpened;
};

KeepTabsOpen.prototype.cron = function() {
    chrome.windows.getAll(
        // object getInfo
        {
            'populate': true,
        },
        // function callback
        function( windows ) {

            var openUrls = [];
            windows.forEach(function(win) {
                console.group('window found:', win);
                win.tabs.forEach(function(tab) {
                    console.log('tab found:', tab);
                    openUrls.push(tab.url);
                });
                console.groupEnd();
            });
            console.log('urls open:', openUrls);
            console.log('--------------------------------------------------------------------------------');

            var ref = {
                'openUrls': openUrls,
            };
            var urlsAndSettingsToOpen = keepTabsOpen.getUrlAndSettingsToOpen(ref, keepTabsOpen.options.settings);
            console.log('urls to open:', urlsAndSettingsToOpen);
            console.log('number of urls to open:', urlsAndSettingsToOpen.length);

            if ( urlsAndSettingsToOpen.length ) {
                for ( var i = 0; i < urlsAndSettingsToOpen.length; i++ ) {
                    var urlAndSettings = urlsAndSettingsToOpen[i];
                    var url = urlAndSettings['url_to_open'];
                    if (chrome.extension.inIncognitoContext) {
                        console.log('opening url (in incognito):', url);
                    } else {
                        console.log('opening url (not in incognito):', url);
                    }

                    // For chrome.windows.create:
                    // TODO: Add ability to open incognito windows.
                    // TODO: Add ability to open an active window.
                    // TODO: Add ability to specify the window's 'left', 'top', 'width', and 'height'.
                    // TODO: Add ability to specify the window state ("normal", "minimized", "maximized", "fullscreen",
                    // or "docked").

                    // For chrome.tabs.create:
                    // TODO: Add ability to open an active tab.

                    var createProperties = {
                        // Use active: false so that the tab does not become the active tab in the window.
                        'active': false,
                        'url': url,
                    };

                    var index = urlAndSettings['index'];
                    if (index !== undefined) {
                        createProperties['index'] = index;
                    }

                    var pinned = urlAndSettings['pinned'];
                    if (pinned !== undefined) {
                        createProperties['pinned'] = pinned;
                    }

                    console.log('opening tab with properties:', createProperties);

                    chrome.tabs.create(
                        // object createProperties
                        createProperties,
                        // function callback
                        function() {
                        }
                    );
                }
            }
        }
    );
};

var keepTabsOpen = new KeepTabsOpen();

chrome.alarms.onAlarm.addListener(function( alarm ) {
    console.info('chrome.alarms.onAlarm.addListener callback', alarm);
    if ( alarm.name === 'keepTabsOpen.cron' ) {
        keepTabsOpen.cron();
    }
});

// TODO: Make alarm settings configurable in options.
// TODO: Get alarm settings from storage.

// Creates an alarm. Near the time(s) specified by alarmInfo, the onAlarm event is fired. If there is another alarm
// with the same name (or no name if none is specified), it will be cancelled and replaced by this alarm.
chrome.alarms.create(
    // string name
    'keepTabsOpen.cron',
    // object alarmInfo
    {
        'periodInMinutes': keepTabsOpen.options.alarmPeriodInMinutes,
    }
);

keepTabsOpen.cron();
