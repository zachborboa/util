console.info( 'options.js' );

var backgroundPage = chrome.extension.getBackgroundPage();

var pinTabsPatterns = backgroundPage.pinTab.options.pin_patterns;

var pinTabs = $( '#pin-tabs' );
var pinTabsRowWrapper = pinTabs.find( 'tbody' );
var pinTabsRowTemplate = Handlebars.compile( $( '#pin-tabs-row-template' ).html() );

for ( var key in pinTabsPatterns ) {
    var context = pinTabsPatterns[ key ];
    var html = pinTabsRowTemplate( context );
    pinTabsRowWrapper.append( html );
}

var pinTabsForm = pinTabs.find( 'form' );
pinTabsForm.submit(function( event ) {
    event.preventDefault();

    var formGroup = pinTabs.find( '.form-group' );
    formGroup.removeClass( 'has-error' );

    var patternInput = pinTabsForm.find( '#pattern' );
    var pattern = patternInput.val().trim();
    if ( pattern === '' ) {
        formGroup.addClass( 'has-error' );
        patternInput.focus();
    } else {
        if ( ! backgroundPage.pinTab.options.pin_patterns ) {
            backgroundPage.pinTab.options.pin_patterns = {};
        }

        var patternObj = {
            'key': btoa(pattern),
            'enabled': true,
            'matching': '-',
            'pattern': pattern,
        };
        console.log(patternObj);

        var context = patternObj;
        var html = pinTabsRowTemplate( context );

        backgroundPage.pinTab.addPattern( patternObj, function( added ) {
            patternInput.val( '' );
            if ( added ) {
                pinTabsRowWrapper.prepend( html );
                backgroundPage.pinTab.getMatchingTabCount(function(patternMatches) {
                    for ( var key in patternMatches ) {
                        var matches = patternMatches[key];
                        console.log(pattern, matches);
                        var selector = '[data-key="' + key + '"]';
                        console.log('selector:', selector);
                        var row = document.querySelector(selector);
                        if ( ! row ) {
                            console.error('row not found');
                        } else {
                            var matching = row.querySelector('.matching');
                            if ( ! matching ) {
                                console.error('matching not found');
                            } else {
                                matching.innerText = matches;
                                console.log('matching set');
                            }
                        }
                        console.log('---');
                    }
                });
            }
        });
    }
});

$( document.body ).on('click', '.delete', function( event ) {
    var row = $( event.target ).parents( 'tr' );
    var pattern = row.attr( 'data-pattern' );
    backgroundPage.pinTab.removePattern( pattern, function() {
        row.remove();
    });
});
