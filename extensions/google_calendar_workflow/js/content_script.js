window.onhashchange = function() {
    console.log('hash changed', window.location.hash);

    // Add anchors below a calendar event's description created from links in the description.
    var textarea = document.querySelector('.ep-dp-descript textarea.textinput');
    console.log('element:', textarea);
    if ( textarea ) {
        var linkContainer = document.createElement('div');
        linkContainer.style.whiteSpace = 'nowrap';
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
        console.log('calendar event clicked');
        var eventBubble = document.querySelector('.bubblemain');
        if ( eventBubble ) {
            console.log('event bubble is present');
            var editLink = eventBubble.querySelector('.details-button');
            var buttonDone = eventBubble.querySelector('.button-done');
            if ( editLink.innerText === 'Edit event' && ! buttonDone ) {

                // Re-stylize delete button.
                var deleteButton = eventBubble.querySelector('.delete-button');
                if ( deleteButton ) {
                    deleteButton.classList.remove('jfk-button-standard');
                    deleteButton.classList.add('jfk-button-primary');
                }

                // Add buttons.
                console.log('adding buttons');
                var buttonLabels = [
                    // buttonLabel, eventTitlePrefix, buttonClassName.
                    ['DONE', '✓', 'jfk-button-default'],
                    ['NOPE', '✗', 'jfk-button-standard'],
                    ['OKAY', '❍', 'jfk-button-standard'],
                    ['AWESOME', 'ツ', 'jfk-button-standard'],
                ];
                for ( var i in buttonLabels ) {
                    var buttonLabel = buttonLabels[i][0];
                    console.log('buttonLabel:', buttonLabel);
                    var eventTitlePrefix = buttonLabels[i][1];
                    console.log('eventTitlePrefix:', eventTitlePrefix);
                    var buttonClassNames = buttonLabels[i][2] + ' button-' + buttonLabel.toLowerCase();
                    console.log('buttonClassNames:', buttonClassNames);
                    var button = document.createElement('div');
                    button.innerHTML =
                        '<div ' +
                            'role="button" ' +
                            'class="' +
                                'goog-inline-block ' +
                                'jfk-button ' +
                                'jfk-button-clear-outline ' +
                                buttonClassNames +
                                '" ' +
                            'style="-webkit-user-select: none;"' +
                            '>' +
                            buttonLabel +
                        '</div>' +
                        '';
                    button.style.display = 'inline-block';
                    button.style.marginRight = '8px';
                    button.style.marginTop = '12px';

                    (function( myEventTitlePrefix ) {
                        button.onclick = function() {
                            var eventTitle = eventBubble.querySelector('.neb-title .ui-sch-schmedit');
                            if ( eventTitle ) {
                                console.log('event title clicked');
                                eventTitle.click();
                            } else {
                                console.log('event title not clicked');
                            }

                            var eventButtonTitle = eventBubble.querySelector('input.neb-title');
                            if ( eventButtonTitle ) {
                                console.log('event title found');

                                // Today.
                                var date = new Date();
                                var monthName = date.toLocaleString('en-us', { 'month': 'short' });
                                var todayFormattedDate = monthName + ' ' + date.getDate() + ', ' + date.getFullYear();

                                // Event date.
                                var eventDate = eventBubble.querySelector('.neb-date').innerText;

                                var calendarEventTitle = eventButtonTitle.value;
                                console.log('before calendarEventTitle:', calendarEventTitle);

                                // Remove leading number (e.g. "1. " in "1. My Calendar Event").
                                calendarEventTitle = calendarEventTitle.replace(/^\d+\. /, '');
                                // Remove leading ~ character.
                                calendarEventTitle = calendarEventTitle.replace(/^~ /, '');

                                console.log(' after calendarEventTitle:', calendarEventTitle);
                                // "✓ My Event; Dec 31, 2015; event date: Jan 1, 2016"
                                var newCalendarEventTitle =
                                    myEventTitlePrefix + ' ' + calendarEventTitle + ';' +
                                    ' ' + todayFormattedDate + ';' +
                                    ' event date: ' + eventDate;
                                console.log('newCalendarEventTitle:', newCalendarEventTitle);
                                eventButtonTitle.value = newCalendarEventTitle;
                            } else {
                                console.log('event title not found');
                            }

                            var saveButton = eventBubble.querySelector('.save-button');
                            if ( saveButton ) {
                                saveButton.click();
                                console.log('save button clicked');
                            } else {
                                console.log('save button not clicked');
                            }
                        };
                    }( eventTitlePrefix ));
                    eventBubble.appendChild(button);
                }
            }
        }
    }
};

var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML =
    // Show current tab index (focus) by disabling webkit styling.
    '.cal-dialog-buttons button {' +
        '-webkit-appearance: none;' +
    '}' +

    // Increase width of title.
    '.ep-title .textinput {' +
        'box-sizing: border-box;' +
        'width: 100%;' +
    '}' +

    // Fix sidebar positioning.
    '.ep-dp-panel {' +
        'width: inherit;' +
    '}' +

    '';
var head = document.getElementsByTagName('head')['0'];
head.appendChild(style);
