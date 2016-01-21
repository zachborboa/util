chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if ( message.action === 'chrome.tabs.executeScript' ) {
        var tabId = sender.tab.id;
        var code = [
            '(function() {',
                'var video = document.querySelector(\'video\');',
                'var fullScreen = document.querySelector(\'.ytp-fullscreen-button[title="Exit full screen"]\') ? 1 : 0;',
                'if ( ! fullScreen ) {',
                    'if ( video.paused ) {',
                        'video.play();',
                    '} else {',
                        'video.pause();',
                    '}',
                '}',
            '})();',
        ].join('');
        var details = {
            'code': code,
        };
        var callback = function() {
        };
        chrome.tabs.executeScript(
            /* integer */ tabId,
            /* object */ details,
            /* function */ callback);
    }
});
