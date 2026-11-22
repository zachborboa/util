// Show the command that saves this install's pairing token where start_server.sh reads it, ready to copy.
chrome.runtime.sendMessage({ 'type': 'get-pairing-token' }).then(function (pairingToken) {
    document.getElementById('save-token-command').textContent =
        '(umask 077 && mkdir -p ~/.config/debug-bridge && printf "%s\\n" ' +
        pairingToken +
        ' > ~/.config/debug-bridge/token)';
    document.getElementById('copy-save-token-command').disabled = false;
});

// Copy the save command and confirm beside the button, since the clipboard gives no feedback of its own.
document.getElementById('copy-save-token-command').addEventListener('click', function () {
    var saveTokenCommand = document.getElementById('save-token-command').textContent;
    var copyStatus = document.getElementById('copy-status');
    navigator.clipboard.writeText(saveTokenCommand).then(
        function () {
            copyStatus.textContent = 'Copied.';
        },
        function (error) {
            copyStatus.textContent = 'Copy failed: ' + error.message;
        },
    );
});
