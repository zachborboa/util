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
    });
}

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

updateCounter();
