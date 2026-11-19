// Show the server start command with this install's pairing token filled in, ready to copy.
chrome.runtime.sendMessage({ 'type': 'get-pairing-token' }).then(function (pairingToken) {
    document.getElementById('server-command').textContent =
        'BRIDGE_DIR=/path/to/queue BRIDGE_TOKEN=' + pairingToken + ' php -S localhost:8765 server.php';
});
