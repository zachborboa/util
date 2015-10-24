console.group( 'Weather Homepage' );
console.log( 'included' );

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
    '';
var head = document.getElementsByTagName( 'head' )[ '0' ];
head.appendChild( style );
console.log( 'style added' );

console.log( 'done' );
console.groupEnd();
