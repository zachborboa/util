function updateCounter() {
    chrome.windows.getAll({populate: true}, function(wins) {
        // Count tabs and windows.
        var windows = [];
        var tabs = [];
        wins.forEach(function(win) {
            windows.push(win);
            win.tabs.forEach(function(tab){
                tabs.push(tab.url);
            });
        });

        if ( chrome.browserAction ) {
            // Set tooltip.
            var title = [
                'Tab Counter',
                'tabs: ' + tabs.length,
                'windows: ' + windows.length,
            ].join('\n');
            chrome.browserAction.setTitle({
                'title': title,
            });

            // Set extension icon text.
            var text = tabs.length + '';
            chrome.browserAction.setBadgeText({
                text: text,
            });
        } else {
            console.warn('chrome.browserAction is:', chrome.browserAction);
        }
    });
}

// TODO: Update counter when a window (last tab) is closed for number of windows to be accurate.

// Fired when a tab is created.
chrome.tabs.onCreated.addListener(function(
    /* Tab */ tab ) {
    updateCounter();
});

// Fired when a tab is closed.
chrome.tabs.onRemoved.addListener(function(
    /* integer */ tabId,
    /* object */ removeInfo ) {
    updateCounter();
});

// Open extensions page when extension button pressed.
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({ 'url': 'chrome://extensions/' }, function(tabs) {
        for ( var i = 0; i < tabs.length; i++ ) {
            chrome.tabs.update(tabs[i].id, {
                'active': true,
            });
            chrome.windows.update(tabs[i].windowId, {
                'focused': true,
            });
            return;
        }
        chrome.tabs.create({
            'url': 'chrome://extensions/',
            'windowId': tab.windowId,
        });
    });
});

updateCounter();
