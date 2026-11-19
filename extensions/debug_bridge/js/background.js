// Run JavaScript queued on the local debug bridge server (server.php) in the tab that polled, and post the result back.
// Keep the port in sync with host_permissions in manifest.json.
const DEBUG_BRIDGE_URL = 'http://localhost:8765';

// Wait this long after the server fails to answer before trying again, so a stopped server doesn't flood the console with errors.
const DEBUG_BRIDGE_RETRY_MS = 30000;

// Keep a tab armed this long after the toolbar click: long enough for a debugging session, short enough that a forgotten arm lapses on its own.
const ARM_DURATION_MS = 30 * 60 * 1000;

const ARM_TITLE = 'Arm Debug Bridge for this tab';
const DISARM_TITLE = 'Disarm Debug Bridge (armed for this tab)';

let debugBridgeBusy = false;
let debugBridgeFailedAt = 0;

// Evaluate through the debugger protocol: extension code can't eval, and the page's own policy blocks injected scripts.
async function evaluateInTab(tabId, code) {
    const target = { 'tabId': tabId };
    try {
        await chrome.debugger.attach(target, '1.3');
    } catch (error) {
        return { 'error': 'attach failed: ' + error.message };
    }
    try {
        const response = await chrome.debugger.sendCommand(target, 'Runtime.evaluate', {
            'awaitPromise': true,
            'expression': code,
            'returnByValue': true,
        });
        if (response.exceptionDetails !== undefined) {
            const exception = response.exceptionDetails.exception;
            return { 'error': exception !== undefined ? exception.description : response.exceptionDetails.text };
        }
        return { 'value': response.result.value };
    } catch (error) {
        return { 'error': error.message };
    } finally {
        await chrome.debugger.detach(target);
    }
}

// Make the pairing token once per install; the user copies it from the options page into the server's BRIDGE_TOKEN.
async function getPairingToken() {
    const stored = await chrome.storage.local.get('pairingToken');
    if (stored.pairingToken !== undefined) {
        return stored.pairingToken;
    }
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const pairingToken = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    await chrome.storage.local.set({ 'pairingToken': pairingToken });
    return pairingToken;
}

// Run a command only when it carries the pairing token, so another program listening on the port can't feed code to the tab.
async function runCommand(tabId, command) {
    const pairingToken = await getPairingToken();
    if (command.token !== pairingToken) {
        console.warn('Debug Bridge: refused a command without the pairing token');
        return { 'error': "refused: BRIDGE_TOKEN doesn't match the token on the extension's options page" };
    }
    return evaluateInTab(tabId, command.code);
}

// Read the armed tab from session storage, which survives the background worker stopping but not a browser restart.
async function getArmedTab() {
    const stored = await chrome.storage.session.get('armedTab');
    if (stored.armedTab === undefined) {
        return null;
    }
    return stored.armedTab;
}

async function arm(tab) {
    await chrome.storage.session.set({
        'armedTab': {
            'expiresAt': Date.now() + ARM_DURATION_MS,
            'origin': new URL(tab.url).origin,
            'tabId': tab.id,
        },
    });
    await chrome.action.setBadgeText({ 'tabId': tab.id, 'text': 'ON' });
    await chrome.action.setTitle({ 'tabId': tab.id, 'title': DISARM_TITLE });
}

async function disarm(tabId) {
    await chrome.storage.session.remove('armedTab');
    await chrome.action.setBadgeText({ 'tabId': tabId, 'text': '' });
    await chrome.action.setTitle({ 'tabId': tabId, 'title': ARM_TITLE });
}

// Accept a poll only from the armed tab, still on the site it was armed on, before the arm lapses.
async function isArmed(tabId, url) {
    const armedTab = await getArmedTab();
    if (armedTab === null) {
        return false;
    } else if (armedTab.tabId !== tabId) {
        return false;
    } else if (Date.now() > armedTab.expiresAt) {
        await disarm(tabId);
        return false;
    } else if (new URL(url).origin !== armedTab.origin) {
        await disarm(tabId);
        return false;
    }
    return true;
}

async function pollDebugBridge(tab, url) {
    if (!(await isArmed(tab.id, url))) {
        return;
    } else if (debugBridgeBusy) {
        return;
    } else if (Date.now() - debugBridgeFailedAt < DEBUG_BRIDGE_RETRY_MS) {
        return;
    }

    debugBridgeBusy = true;
    try {
        const response = await fetch(DEBUG_BRIDGE_URL + '/next');
        if (response.status === 200) {
            const command = await response.json();
            const result = await runCommand(tab.id, command);
            await fetch(DEBUG_BRIDGE_URL + '/result', {
                'body': JSON.stringify({ 'id': command.id, 'url': url, ...result }),
                'method': 'POST',
            });
        }
    } catch (error) {
        debugBridgeFailedAt = Date.now();
    } finally {
        debugBridgeBusy = false;
    }
}

// Toggle the arm on the clicked tab, moving it off any other tab first so only one tab is ever armed.
chrome.action.onClicked.addListener(async function (tab) {
    const armedTab = await getArmedTab();
    if (armedTab === null) {
        await arm(tab);
    } else if (armedTab.tabId === tab.id) {
        await disarm(tab.id);
    } else {
        await disarm(armedTab.tabId);
        await arm(tab);
    }
});

chrome.tabs.onRemoved.addListener(async function (tabId) {
    const armedTab = await getArmedTab();
    if (armedTab === null) {
        return;
    } else if (armedTab.tabId !== tabId) {
        return;
    }
    await chrome.storage.session.remove('armedTab');
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'debug-bridge-poll') {
        pollDebugBridge(sender.tab, message.url);
    } else if (message.type === 'get-pairing-token') {
        getPairingToken().then(sendResponse);

        // Keep the channel open for the asynchronous reply.
        return true;
    }
});
