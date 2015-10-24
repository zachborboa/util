console.group( 'Weather Homepage' );
console.log( 'included' );

var currentWindowState = 'normal';

function toggleWindowState() {
    console.log( 'currentWindowState:', currentWindowState );
    var nextWindowState = currentWindowState === 'normal' ? 'fullscreen' : 'normal';
    console.log( 'nextWindowState:', nextWindowState );
    chrome.runtime.sendMessage({
        'action': 'chrome.windows.update',
        'data': {
            'updateInfo': {
                'state': nextWindowState,
            },
        },
    }, function( response ) {
        console.log( 'response received:', response );
        currentWindowState = response;
        console.log( 'currentWindowState:', currentWindowState );
    });
}

toggleWindowState();

// Restore window when page is clicked.
document.addEventListener('click', function() {
    toggleWindowState();
});

console.log( 'adding style' );
var style = document.createElement( 'style' );
style.type = 'text/css';
style.innerHTML =
    [
        // Hide search form.
        '#searchform',
        // Hide extra padding.
        '#sfcnt',
        '#subform_ctrl',
        // Hide tabs (e.g. "Web", "News", "Apps", etc.).
        '#top_nav',
        // Hide results (e.g. "About 1 bazillion results (0.01 seconds)").
        '#appbar',
        // Hide sidebar.
        '.mw #rhs',
        // Hide weather card feedback.
        '#center_col ._vm',
        // Hide search results.
        'ol#rso .g:nth-child(n+1) ~ div',
        // Hide search results horizontal rules.
        'ol#rso hr',
        // Hide extra search results.
        '#extrares',
        // Hide pagination.
        '#foot',
        // Hide footer.
        '#footcnt',
    ].join(',') + '{' +
        'display: none;' +
    '}' +

    // Align weather card.
    '.big .mw {' +
        'max-width: 100%;' +
    '}' +
    '.col {' +
        'float: none;' +
        'width: 100% !important;' +
    '}' +
    '#center_col {' +
        'margin: auto !important;' +
    '}' +

    '.vk_c {' +
        // Remove weather card shadow.
        'box-shadow: none !important;' +
        // Remove weather card padding.
        'padding: 0 !important;' +
    '}' +

    // Vertical align weather card.
    [
        'html',
        'body',
        '#main',
        '#cnt',
        '.mw:not(#ucs)',
        '#rcnt',
        '.col:not(#rhscol)',
        '#center_col',
    ].join(',') + '{' +
        'height: 100%;' +
    '}' +
    '#center_col {' +
        'display: table;' +
    '}' +
    '#res {' +
        'display: table-cell;' +
        'padding: 0;' +
        'vertical-align: middle;' +
    '}' +
    '#search {' +
        'width: 528px;' +
    '}' +
    '.vk_c {' +
        'margin-left: 0 !important;' +
        'margin-right: 0 !important;' +
    '}' +
    '';
var head = document.getElementsByTagName( 'head' )[ '0' ];
head.appendChild( style );
console.log( 'style added' );

console.log( 'done' );
console.groupEnd();
