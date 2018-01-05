chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        console.group('RedirectRequests::onBeforeRequest', details.requestId, details.type, details.method, details.url);

        var urlPatterns = [
            [
                'https://www.example.com/before.html',
                'https://www.example.com/after.html',
            ],
            [
                /^https:\/\/www\.example\.com\/before\.html/,
                'https://www.example.com/after.html',
            ],
            [
                /^(https:\/\/www\.example\.com\/)before\.html/,
                '$1after.html',
            ],

        ];
        var redirectUrl = false;
        for (var i = 0; i < urlPatterns.length; i++) {
            var pattern = urlPatterns[i];
            var find = pattern[0];
            var replace = pattern[1];
            var findType = typeof(find);
            if (findType === 'object') {
                if (details.url.match(find)) {
                    console.log('pattern matched', find);
                    redirectUrl = details.url.replace(find, replace);
                    break;
                }
            } else if (findType === 'string') {
                if (details.url === find) {
                    console.log('string matched', find);
                    redirectUrl = replace;
                    break;
                }
            }

        }

        var returnObj = {};
        if (redirectUrl) {
            console.warn('REDIRECTING request to', redirectUrl);
            returnObj['redirectUrl'] = redirectUrl;
        }

        console.groupEnd();
        return returnObj;
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
