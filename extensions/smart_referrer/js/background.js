// Block referrers when the referring url origin doesn't match the request url origin.

function getOrigin( url ) {
    var parser = document.createElement( 'a' );
    parser.href = url;
    return parser.origin;
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        for ( var i = 0; i < details.requestHeaders.length; ++i ) {
            if ( details.requestHeaders[i].name === 'Referer' ) {
                var referrer = details.requestHeaders[i].value;
                if ( ! ( getOrigin(details.url) === getOrigin(referrer) ) ) {
                    details.requestHeaders.splice(i, 1);
                }
                break;
            }
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
