// Pin tabs on these sites; match pattern syntax: https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
const AUTO_PIN_URL_PATTERNS = ['https://calendar.google.com/*', 'https://mail.google.com/*'];

// List unpinned tabs on a matching url, letting Chrome do the pattern matching.
function queryUnpinnedMatchingTabs(callback) {
    chrome.tabs.query(
        {
            'pinned': false,
            'url': AUTO_PIN_URL_PATTERNS,
        },
        callback,
    );
}

function pinTab(tab) {
    chrome.tabs.update(tab.id, {
        'pinned': true,
    });
}

// Pin matching tabs that were already open before the extension loaded.
chrome.runtime.onInstalled.addListener(function () {
    queryUnpinnedMatchingTabs(function (tabs) {
        for (const tab of tabs) {
            pinTab(tab);
        }
    });
});

// Pin a tab when it navigates to a matching url.
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.url === undefined) {
        return;
    }
    queryUnpinnedMatchingTabs(function (tabs) {
        for (const tab of tabs) {
            if (tab.id === tabId) {
                pinTab(tab);
            }
        }
    });
});
