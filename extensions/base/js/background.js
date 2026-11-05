// Log install and update so the service worker console confirms the extension loaded.
chrome.runtime.onInstalled.addListener(function(details) {
    console.log('Base installed:', details.reason);
});
