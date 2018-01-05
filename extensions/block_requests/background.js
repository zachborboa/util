chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        console.group('BlockRequests::onBeforeRequest', details.requestId, details.method, details.url);

        var urlPatterns = [
            /^https:\/\/example\.evil\.com\//,
        ];
        var blockRequest = false;
        for (var i = 0; i < urlPatterns.length; i++) {
            var pattern = urlPatterns[i];
            if (details.url.match(pattern)) {
                console.log('pattern matched', pattern, details.url);
                blockRequest = true;
                break;
            }
        }

        var funcReturn = {};
        if (blockRequest) {
            console.warn('BLOCKING request');
            funcReturn['cancel'] = true;
        }

        console.groupEnd();
        return funcReturn;
    },
    {
        urls: ["<all_urls>"],
        types: [
            "csp_report",
            "font",
            "image",
            "main_frame",
            "media",
            "object",
            "other",
            "ping",
            "script",
            "stylesheet",
            "sub_frame",
            "websocket",
            "xmlhttprequest"
        ]
    },
    ["blocking"]
);
