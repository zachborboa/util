// Ask the background worker to run any queued debug bridge command, from the tab in view only, so a command lands where the user is looking.
// Polling from the page also keeps the background worker awake, which Chrome otherwise stops after a short idle.
const DEBUG_BRIDGE_POLL_MS = 1000;

setInterval(function () {
    if (document.visibilityState === 'visible') {
        chrome.runtime.sendMessage({ 'type': 'debug-bridge-poll', 'url': location.href });
    }
}, DEBUG_BRIDGE_POLL_MS);
