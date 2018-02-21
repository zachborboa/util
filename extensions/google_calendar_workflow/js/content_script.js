function dispatchEvent(obj, event) {
    var evt = new Event(
        event,
        {
            target: obj,
            bubbles: true,
        }
    );
    obj.dispatchEvent(evt);
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function insertButtonsAfter(referenceNode, onclickAction) {
    var insertAfterTarget = referenceNode;
    var buttonLabels = [
        // buttonLabel, eventTitlePrefix.
        ['DONE',    '✓',  ['jfk-button', 'jfk-button-default' ]],
        ['NOPE',    '✗',  ['jfk-button', 'jfk-button-standard']],
        ['OKAY',    '▣',  ['jfk-button', 'jfk-button-standard']],
        ['AWESOME', 'ツ', ['jfk-button', 'jfk-button-standard']],
    ];
    for ( var i in buttonLabels ) {
        var buttonLabel = buttonLabels[i][0];
        console.log('buttonLabel:', buttonLabel);

        var eventTitlePrefix = buttonLabels[i][1];
        console.log('eventTitlePrefix:', eventTitlePrefix);

        var buttonClassNames = buttonLabels[i][2];
        console.log('buttonClassNames:', buttonClassNames);

        var button = document.createElement('button');
        button.innerText = buttonLabel;
        button.classList.add(...buttonClassNames);

        (function(myButton, myEventTitlePrefix) {
            myButton.onclick = function() {
                console.log('myButton.onclick');
                onclickAction(myButton, myEventTitlePrefix);
            };
        }(button, eventTitlePrefix));

        console.log('inserting button', button, 'after', insertAfterTarget);
        insertAfter(button, insertAfterTarget);
        insertAfterTarget = button;
    }
}

function clickButton(clickedData) {
    console.group('clickButton');
    console.log('clickedData:', clickedData);
    console.log('button clicked');

    // Today.
    var date = new Date();
    var monthName = date.toLocaleString('en-us', { 'month': 'short' });
    var todayFormattedDate = monthName + ' ' + date.getDate() + ', ' + date.getFullYear();

    // Event date.
    var startDateInput = document.querySelector('[aria-label="Start date"]');
    var endDateInput = document.querySelector('[aria-label="End date"]');
    var eventDate = startDateInput.value;
    if (endDateInput.value !== startDateInput.value) {
        eventDate += ' - ' + endDateInput.value;
    }
    console.log('eventDate:', eventDate);

    var eventTitle = document.querySelector('[aria-label="Title"]');
    var calendarEventTitle = eventTitle.value;
    console.log('before calendarEventTitle:', calendarEventTitle);

    // Remove leading number (e.g. "1. " in "1. My Calendar Event").
    calendarEventTitle = calendarEventTitle.replace(/^\d+\. /, '');
    // Remove leading ~ character.
    calendarEventTitle = calendarEventTitle.replace(/^~ /, '');

    console.log(' after calendarEventTitle:', calendarEventTitle);

    // "✓ My Event; Dec 31, 2015; event date: Jan 1, 2016"
    var eventTitlePrefix = clickedData['eventTitlePrefix'];
    var newCalendarEventTitle =
        eventTitlePrefix + ' ' + calendarEventTitle + ';' +
        ' ' + todayFormattedDate + ';' +
        ' event date: ' + eventDate;
    console.log('newCalendarEventTitle:', newCalendarEventTitle);
    eventTitle.value = newCalendarEventTitle;

    dispatchEvent(eventTitle, 'input');

    var saveButton = document.querySelector('[aria-label="Save"]');
    saveButton.click();

    console.groupEnd();
}

var buttonClickedData;
(function(){
    var pathname = window.location.pathname;
    setInterval(function() {
        if (pathname !== window.location.pathname) {
            console.log('pathname changed');
            pathname = window.location.pathname;
            if (pathname.match(/^\/calendar\/r\/eventedit\//)) {
                console.log('on event edit page');

                if (buttonClickedData) {
                    clickButton(buttonClickedData);
                    buttonClickedData = null;
                } else {
                    // Add action buttons to calendar event edit page.
                    console.log('adding buttons');
                    var saveButton = document.querySelector('[aria-label="Save"]');
                    var onclickAction = function(myButton, myEventTitlePrefix) {
                        buttonClickedData = {
                            'button': myButton,
                            'eventTitlePrefix': myEventTitlePrefix,
                        };
                        clickButton(buttonClickedData);
                        buttonClickedData = null;
                    };
                    insertButtonsAfter(saveButton, onclickAction);
                }
            }
        }
    }, 1000);
})();

document.onclick = function(event) {
    console.group('element clicked');
    console.log('element clicked:', event.target);

    var target = event.target;
    var eventIdFound = false;
    for (var i = 0; i < 5; i++) {
        // Ignore event bubble.
        if (target.getAttribute('id') === 'xDetDlg') {
            break;
        } else if (target.getAttribute('data-eventid')) {
            eventIdFound = true;
            break;
        }
        target = target.parentElement;
    }
    console.log('target:', target);
    if (eventIdFound) {
        var eventId = target.getAttribute('data-eventid');
        console.log('event id found:', eventId);
        setTimeout(function() {
            var eventBubble = document.querySelector('#xDetDlg[data-eventid="' + eventId + '"]');
            console.log('eventBubble:', eventBubble);

            var lastEventBubbleMetaItem = document.querySelector('#xDtlDlgCt > div:last-child');
            var onclickAction = function(myButton, myEventTitlePrefix) {
                buttonClickedData = {
                    'button': myButton,
                    'eventTitlePrefix': myEventTitlePrefix,
                };

                var editEventButton = document.querySelector('[aria-label="Edit event"]');
                console.log('editEventButton:', editEventButton);
                editEventButton.click();
            };
            insertButtonsAfter(lastEventBubbleMetaItem, onclickAction);
        }, 100);
    }
    console.groupEnd();
};

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
