// Attach to onkeydown instead of onkeyup to match YouTube's key binding.
window.onkeydown = function( event ) {
    // Ignore keydowns except spacebar.
    if ( ! ( event.keyCode === 32 ) ) {
        return;
    }

    // Ignore keydown when inside :inputs.
    if ( event.target && ( event.target.nodeName === 'TEXTAREA' ||
                           event.target.nodeName === 'INPUT' ) ) {
        return;
    }

    event.preventDefault();
    chrome.runtime.sendMessage({
        'action': 'chrome.tabs.executeScript',
    });
};
