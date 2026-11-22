// Run JavaScript queued on the local debug bridge server (server.php) in the armed tab, and post the result back.
// Keep the port in sync with host_permissions in manifest.json.
const DEBUG_BRIDGE_URL = 'http://localhost:8765';

// Ask for the next command this often while a tab is armed, so a queued command runs about as soon as it lands.
const DEBUG_BRIDGE_POLL_MS = 1000;

// Wait this long after the server fails to answer: short enough that a server started after the arm click gets picked up within moments.
const DEBUG_BRIDGE_RETRY_MS = 2000;

// Keep a tab armed this long after the toolbar click: long enough for a debugging session, short enough that a forgotten arm lapses on its own.
const ARM_DURATION_MS = 30 * 60 * 1000;

const ARM_TITLE = 'Arm Debug Bridge for this tab';
const DISARM_TITLE = 'Disarm Debug Bridge (armed for this tab)';

let debugBridgePolling = false;

// Evaluate through the debugger protocol: extension code can't eval, and the page's own policy blocks injected scripts.
async function evaluateInTab(tabId, code) {
    try {
        const response = await chrome.debugger.sendCommand({ 'tabId': tabId }, 'Runtime.evaluate', {
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
    }
}

// Make the pairing token once per install; the user saves it from the options page into the file start_server.sh reads.
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

// Attach the debugger for the whole arm: commands then skip a per-command attach, and the open session keeps this worker alive between polls.
async function arm(tab) {
    const target = { 'tabId': tab.id };
    try {
        await chrome.debugger.attach(target, '1.3');
    } catch (error) {
        console.warn('Debug Bridge: attach failed: ' + error.message);
        return;
    }

    // Report navigation, so leaving the armed site disarms right away rather than at the next command.
    await chrome.debugger.sendCommand(target, 'Page.enable');
    await chrome.storage.session.set({
        'armedTab': {
            'expiresAt': Date.now() + ARM_DURATION_MS,
            'origin': new URL(tab.url).origin,
            'tabId': tab.id,
        },
    });
    await chrome.action.setBadgeText({ 'tabId': tab.id, 'text': 'ON' });
    await chrome.action.setTitle({ 'tabId': tab.id, 'title': DISARM_TITLE });
    pollDebugBridge();
}

async function forgetArm() {
    await chrome.storage.session.remove('armedTab');
}

async function showDisarmed(tabId) {
    await chrome.action.setBadgeText({ 'tabId': tabId, 'text': '' });
    await chrome.action.setTitle({ 'tabId': tabId, 'title': ARM_TITLE });
}

async function disarm(tabId) {
    // Carry on when the session is already gone (a worker restart can drop it), so the arm never gets stuck on.
    try {
        await chrome.debugger.detach({ 'tabId': tabId });
    } catch (error) {
        console.warn('Debug Bridge: detach failed: ' + error.message);
    }
    await forgetArm();
    await showDisarmed(tabId);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the next queued command, if there is one, and return how long to wait before asking again.
async function runNextCommand(tabId) {
    try {
        const response = await fetch(DEBUG_BRIDGE_URL + '/next');
        if (response.status !== 200) {
            return DEBUG_BRIDGE_POLL_MS;
        }
        const command = await response.json();
        const location = await evaluateInTab(tabId, 'location.href');
        const result = await runCommand(tabId, command);
        await fetch(DEBUG_BRIDGE_URL + '/result', {
            'body': JSON.stringify({ 'id': command.id, 'url': location.value, ...result }),
            'method': 'POST',
        });
        return DEBUG_BRIDGE_POLL_MS;
    } catch (error) {
        return DEBUG_BRIDGE_RETRY_MS;
    }
}

// Poll the server for as long as a tab stays armed, one loop at a time, until the arm ends or lapses.
async function pollDebugBridge() {
    if (debugBridgePolling) {
        return;
    }

    debugBridgePolling = true;
    try {
        while (true) {
            const armedTab = await getArmedTab();
            if (armedTab === null) {
                break;
            } else if (Date.now() > armedTab.expiresAt) {
                await disarm(armedTab.tabId);
                break;
            }
            const delayMs = await runNextCommand(armedTab.tabId);
            await sleep(delayMs);
        }
    } finally {
        debugBridgePolling = false;
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

// Disarm when the armed tab's top frame leaves the site it was armed on.
chrome.debugger.onEvent.addListener(async function (source, method, params) {
    if (method !== 'Page.frameNavigated') {
        return;
    } else if (params.frame.parentId !== undefined) {
        return;
    }

    const armedTab = await getArmedTab();
    if (armedTab === null) {
        return;
    } else if (armedTab.tabId !== source.tabId) {
        return;
    } else if (new URL(params.frame.url).origin === armedTab.origin) {
        return;
    }
    await disarm(source.tabId);
});

// Forget the arm when Chrome ends the debugging session itself: the tab closed, or the user pressed Cancel on the debugging bar.
chrome.debugger.onDetach.addListener(async function (source, reason) {
    const armedTab = await getArmedTab();
    if (armedTab === null) {
        return;
    } else if (armedTab.tabId !== source.tabId) {
        return;
    }
    await forgetArm();

    // Reset the badge only while the tab still exists; a closed tab has no badge left to reset.
    if (reason !== 'target_closed') {
        await showDisarmed(source.tabId);
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'get-pairing-token') {
        getPairingToken().then(sendResponse);

        // Keep the channel open for the asynchronous reply.
        return true;
    }
});

// Resume polling if the worker restarts while a tab is armed; the open debugger session normally keeps it alive, so this covers an unexpected stop.
pollDebugBridge();
