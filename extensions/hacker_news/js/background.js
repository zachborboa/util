chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'chrome.tabs.create') {
        var index = sender.tab.index + 1;
        var createProperties = {
            'active': false,
            'index': index,
            'url': message.data.url,
        };
        chrome.tabs.create(createProperties);
    }
});
