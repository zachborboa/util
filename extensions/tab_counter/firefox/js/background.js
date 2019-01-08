function updateCounter(tabId, isOnRemoved) {
    browser.tabs.query({})
        .then((tabs) => {
            let length = tabs.length;

            // onRemoved fires too early and the count is one too many.
            // see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
            if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
                length--;
            }

            browser.browserAction.setBadgeText({
                text: length.toString(),
            });
        });
}


// Fired when a tab is created.
browser.tabs.onCreated.addListener(function(
    /* Tab */ tab ) {
    updateCounter(tab.id, false);
});

// Fired when a tab is closed.
browser.tabs.onRemoved.addListener(function(
    /* integer */ tabId,
    /* object */ removeInfo ) {
    updateCounter(tabId, true);
});

browser.browserAction.setBadgeBackgroundColor({
    color: [0x66, 0x66, 0x66, 0xFF],
});

updateCounter();

// TODO: Open extensions page when extension button pressed (when supported in
// Firefox). Not currently possible to open "about:addons" per bug
// (https://bugzilla.mozilla.org/show_bug.cgi?id=1269456).
// chrome.browserAction.onClicked.addListener(function(tab) {
//     browser.tabs.create({
//         'url': 'about:addons',
//     });
// });
