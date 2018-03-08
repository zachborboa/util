const PRIORITY_EVENT_TITLE_PREFIXES = ['1.', '2.', '3.', '4.', '5.'];

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

function insertButtons(referenceNode, onclickAction, where, alternateReferenceNode) {
    var insertTarget = referenceNode;
    var buttonLabels = [
        // buttonLabel, eventTitlePrefix, buttonClassNames.
        ['DONE',    '✓',  ['jfk-button', 'jfk-button-default' ]],
        ['NOPE',    '✗',  ['jfk-button', 'jfk-button-standard']],
        ['OKAY',    '▣',  ['jfk-button', 'jfk-button-standard']],
        ['AWESOME', 'ツ', ['jfk-button', 'jfk-button-standard']],
        ['1',       '1.', ['jfk-button', 'jfk-button-standard']],
        ['2',       '2.', ['jfk-button', 'jfk-button-standard']],
        ['3',       '3.', ['jfk-button', 'jfk-button-standard']],
        ['4',       '4.', ['jfk-button', 'jfk-button-standard']],
        ['5',       '5.', ['jfk-button', 'jfk-button-standard']],
    ];
    for (var i in buttonLabels) {
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

        console.log('inserting button', button, where, insertTarget);
        if (where === 'after') {
            insertAfter(button, insertTarget);
            insertTarget = button;
        } else if (where === 'inside') {
            if (alternateReferenceNode && PRIORITY_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
                alternateReferenceNode.appendChild(button);
            } else {
                referenceNode.appendChild(button);
            }
        }
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
    // "1. My Event"
    var eventTitlePrefix = clickedData['eventTitlePrefix'];
    var newCalendarEventTitle = eventTitlePrefix + ' ' + calendarEventTitle;
    if (! PRIORITY_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
        newCalendarEventTitle += ';' +
            ' ' + todayFormattedDate + ';' +
            ' event date: ' + eventDate;
    }
    console.log('newCalendarEventTitle:', newCalendarEventTitle);
    eventTitle.value = newCalendarEventTitle;

    dispatchEvent(eventTitle, 'input');

    var saveButton = document.querySelector('[aria-label="Save"]');
    setTimeout(function() {
        saveButton.click();
    }, 100);

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
                    insertButtons(saveButton, onclickAction, 'after');
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

            var newEventBubbleMetaItem = document.createElement('div');
            newEventBubbleMetaItem.classList.add(...lastEventBubbleMetaItem.classList);
            insertAfter(newEventBubbleMetaItem, lastEventBubbleMetaItem);

            var lastNewEventBubbleMetaItem = document.createElement('div');
            lastNewEventBubbleMetaItem.classList.add(...lastEventBubbleMetaItem.classList);
            insertAfter(lastNewEventBubbleMetaItem, newEventBubbleMetaItem);

            var onclickAction = function(myButton, myEventTitlePrefix) {
                buttonClickedData = {
                    'button': myButton,
                    'eventTitlePrefix': myEventTitlePrefix,
                };

                var editEventButton = document.querySelector('[aria-label="Edit event"]');
                console.log('editEventButton:', editEventButton);
                editEventButton.click();
            };
            insertButtons(newEventBubbleMetaItem, onclickAction, 'inside', lastNewEventBubbleMetaItem);
        }, 100);
    }
    console.groupEnd();
};
