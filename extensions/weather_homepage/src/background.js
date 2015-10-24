chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log( 'message received' );
    console.log( 'message:', message );
    console.log( 'sender:', sender );
    if ( message.action === 'chrome.windows.update' ) {
        console.log( 'doing chrome.windows.update' );
        var windowId = sender.tab.windowId;
        var updateInfo = message.data.updateInfo;
        chrome.windows.update( windowId, updateInfo );
        sendResponse( message.data.updateInfo.state );
    }
});
