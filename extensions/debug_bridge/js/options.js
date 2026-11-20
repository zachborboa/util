// Show the server start command with this install's pairing token filled in, ready to copy.
chrome.runtime.sendMessage({ 'type': 'get-pairing-token' }).then(function (pairingToken) {
    document.getElementById('server-command').textContent =
        'BRIDGE_DIR=/path/to/queue BRIDGE_TOKEN=' + pairingToken + ' php -S localhost:8765 server.php';
    document.getElementById('copy-server-command').disabled = false;
});

// Copy the server command and confirm beside the button, since the clipboard gives no feedback of its own.
document.getElementById('copy-server-command').addEventListener('click', function () {
    var serverCommand = document.getElementById('server-command').textContent;
    var copyStatus = document.getElementById('copy-status');
    navigator.clipboard.writeText(serverCommand).then(
        function () {
            copyStatus.textContent = 'Copied.';
        },
        function (error) {
            copyStatus.textContent = 'Copy failed: ' + error.message;
        },
    );
});
