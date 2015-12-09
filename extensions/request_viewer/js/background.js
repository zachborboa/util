chrome.webRequest.onBeforeRequest.addListener(
    function ( details ) {
        console.log( details.requestId, details.type, details.method, details.url );
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
    }
);
