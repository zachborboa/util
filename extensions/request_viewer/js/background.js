chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        console.info(details.requestId, details.type, details.method, details.url);
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
    }
);

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        for ( var i = 0; i < details.requestHeaders.length; ++i ) {
            var requestHeader = details.requestHeaders[i];
            console.log('request header:', requestHeader.name, requestHeader.value);
        }

        return {
            requestHeaders: details.requestHeaders,
        };
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"],
    },
    ["blocking", "requestHeaders"]
);
