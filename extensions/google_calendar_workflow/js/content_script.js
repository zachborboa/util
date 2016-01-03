console.log('loaded');

window.onhashchange = function() {
    console.log('hash changed', window.location.hash);

    // Add anchors below a calendar event's description created from links in the description.
    var textarea = document.querySelector('.ep-dp-descript textarea.textinput');
    console.log('element:', textarea);
    if ( textarea ) {
        var linkContainer = document.createElement('div');
        linkContainer.innerHTML = urlize(
                textarea.innerHTML,
                {
                    'nofollow': true,
                    'target': '_blank',
                }
            )
            .replace(/<a /g, '<div class="ep-dp-link-icon goog-inline-block"></div><a ')
            .replace(/<\/a>/g, '</a><br />');
        textarea.parentElement.appendChild(linkContainer);

        // Remove text nodes from urlized html.
        const TEXT_NODE = 3;
        for ( var i = 0; i < textarea.nextElementSibling.childNodes.length; i++ ) {
            var childNode = textarea.nextElementSibling.childNodes[ i ];
            if ( childNode.nodeType === TEXT_NODE ) {
                textarea.nextElementSibling.removeChild(childNode);
            }
        }
    }
};

document.onclick = function( event ) {
    console.log('element clicked:', event.target);

    // Add action buttons to calendar event bubbles.
    var bubble = document.querySelector('.bubble');
    if ( bubble && ! ( bubble.style.visibility === 'hidden' ) ) {
        console.log('calendar event clicked. bubble should be present.');
        if ( ! document.querySelector( '.button-done' ) ) {
            console.log('adding buttons');
            var eventBubble = document.querySelector('.eb-root');
            if ( eventBubble ) {
                var buttonLabels = [
                    'DONE',
                    'NOPE',
                    'OKAY',
                ];
                for ( var i in buttonLabels ) {
                    var buttonLabel = buttonLabels[ i ];
                    console.log('buttonLabel:', buttonLabel);
                    var buttonClassName = 'button-' + buttonLabel.toLowerCase();
                    console.log('buttonClassName:', buttonClassName);
                    var button = document.createElement('div');
                    button.innerHTML =
                        '<div class="goog-inline-block goog-imageless-button goog-imageless-button-collapse-right ' + buttonClassName + '" role="button" aria-pressed="false" tabindex="0" style="-webkit-user-select: none;">' +
                            '<div class="goog-inline-block goog-imageless-button-outer-box">' +
                                '<div class="goog-inline-block goog-imageless-button-inner-box">' +
                                    '<div class="goog-imageless-button-pos">' +
                                        '<div class="goog-imageless-button-top-shadow">' +
                                            '&nbsp;' +
                                        '</div>' +
                                        '<div class="goog-imageless-button-content">' +
                                            buttonLabel +
                                        '</div>' +
                                    '</div>' +
                                '</div>'
                            '</div>'
                        '</div>'
                        '';
                    button.style.display = 'inline-block';
                    button.style.marginRight = '8px';
                    button.style.marginTop = '12px';

                    (function( myButtonLabel ) {
                        button.onclick = function() {
                            var eventTitle = eventBubble.querySelector('.eb-title .ui-sch-schmedit');
                            if ( eventTitle ) {
                                console.log('event title clicked');
                                eventTitle.click();
                            } else {
                                console.log('event title not clicked');
                            }

                            var eventButtonTitle = eventBubble.querySelector('input.eb-title');
                            if ( eventButtonTitle ) {
                                console.log('event title found');

                                // Today.
                                var date = new Date();
                                var monthName = date.toLocaleString('en-us', { 'month': 'short' });
                                var todayFormattedDate = monthName + ' ' + date.getDate() + ', ' + date.getFullYear();

                                // Event date.
                                var eventDate = eventBubble.querySelector('.eb-date').innerText;

                                var calendarEventTitle = eventButtonTitle.value;
                                console.log('before calendarEventTitle:', calendarEventTitle);

                                // Remove leading number (e.g. "1. " in "1. My Calendar Event").
                                calendarEventTitle = calendarEventTitle.replace(/^\d+\. /, '');
                                // Remove leading ~ character.
                                calendarEventTitle = calendarEventTitle.replace(/^~ /, '');

                                console.log(' after calendarEventTitle:', calendarEventTitle);
                                // "DONE: My Event; Dec 31, 2015; event date: Jan 1, 2016"
                                var newCalendarEventTitle =
                                    myButtonLabel + ': ' + calendarEventTitle + ';' +
                                    ' ' + todayFormattedDate + ';' +
                                    ' event date: ' + eventDate;
                                console.log('newCalendarEventTitle:', newCalendarEventTitle);
                                eventButtonTitle.value = newCalendarEventTitle;
                            } else {
                                console.log('event title not found');
                            }

                            var saveButton = eventBubble.querySelector('.eb-save .goog-imageless-button-content');
                            if ( saveButton ) {
                                saveButton.click();
                                console.log('save button clicked');
                            } else {
                                console.log('save button not clicked');
                            }
                        };
                    }( buttonLabel ));
                    eventBubble.appendChild(button);
                }
            }
        } else {
            console.log('not adding done button');
        }
    }
};

console.log('adding style');
var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML =
    // Show current tab index (focus) by disabling webkit styling.
    '.cal-dialog-buttons button {' +
        '-webkit-appearance: none;' +
    '}' +
    '';
var head = document.getElementsByTagName('head')['0'];
head.appendChild(style);
console.log('style added');

console.log('done');
