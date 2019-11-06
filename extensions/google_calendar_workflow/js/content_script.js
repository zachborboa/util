/* const */ DEBUG = false;

const BUTTON_LABELS = [
    // buttonLabel, eventTitlePrefix, buttonClassNames.
    ['-',       '-',  ['jfk-button', 'jfk-button-standard', 'button-dash']],
    ['1',       '1.', ['jfk-button', 'jfk-button-standard', 'button-1']],
    ['2',       '2.', ['jfk-button', 'jfk-button-standard', 'button-2']],
    ['3',       '3.', ['jfk-button', 'jfk-button-standard', 'button-3']],
    ['4',       '4.', ['jfk-button', 'jfk-button-standard', 'button-4']],
    ['5',       '5.', ['jfk-button', 'jfk-button-standard', 'button-5']],
    ['X',       null, ['jfk-button', 'jfk-button-standard', 'button-x']],
    ['DONE',    '✓',  ['jfk-button', 'jfk-button-default',  'button-d']],
    ['NOPE',    '✗',  ['jfk-button', 'jfk-button-standard', 'button-n']],
    ['OKAY',    '▣',  ['jfk-button', 'jfk-button-standard', 'button-o']],
    ['AWESOME', 'ツ',  ['jfk-button', 'jfk-button-standard', 'button-a']],
];

const BUTTON_SELECTORS = {
    '-': '.button-dash',
    '1': '.button-1',
    '2': '.button-2',
    '3': '.button-3',
    '4': '.button-4',
    '5': '.button-5',
    'x': '.button-x',
    'd': '.button-d',
    'n': '.button-n',
    'o': '.button-o',
    'a': '.button-a',
};

const KEYCODE = {
    'DASH': 189,
};

const PRIORITY_EVENT_TITLE_PREFIXES = ['-', '1.', '2.', '3.', '4.', '5.', null];

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
    for (var i in BUTTON_LABELS) {
        var buttonLabel = BUTTON_LABELS[i][0];
        DEBUG && console.log('buttonLabel:', buttonLabel);

        var eventTitlePrefix = BUTTON_LABELS[i][1];
        DEBUG && console.log('eventTitlePrefix:', eventTitlePrefix);

        var buttonClassNames = BUTTON_LABELS[i][2];
        DEBUG && console.log('buttonClassNames:', buttonClassNames);

        var button = document.createElement('button');
        button.innerHTML = '<u>' + buttonLabel[0] + '</u>' + buttonLabel.slice(1);
        button.classList.add(...buttonClassNames);

        (function(myButton, myEventTitlePrefix) {
            myButton.onclick = function() {
                DEBUG && console.log('myButton.onclick');
                onclickAction(myButton, myEventTitlePrefix);
            };
        }(button, eventTitlePrefix));

        DEBUG && console.log('inserting button', button, where, insertTarget);
        if (where === 'after') {
            insertAfter(button, insertTarget);
            insertTarget = button;
        } else if (where === 'inside') {
            if (alternateReferenceNode && !PRIORITY_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
                alternateReferenceNode.appendChild(button);
            } else {
                referenceNode.appendChild(button);
            }
        }
    }
}

function clickButton(clickedData) {
    DEBUG && console.group('clickButton');
    DEBUG && console.log('clickedData:', clickedData);
    DEBUG && console.log('button clicked');

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
    DEBUG && console.log('eventDate:', eventDate);

    var eventTitle = document.querySelector('[aria-label="Title"]');
    var calendarEventTitle = eventTitle.value;
    DEBUG && console.log('before calendarEventTitle:', calendarEventTitle);

    // Remove leading number (e.g. "1. " in "1. My Calendar Event").
    calendarEventTitle = calendarEventTitle.replace(/^\d+\. /, '');
    // Remove leading ! character.
    calendarEventTitle = calendarEventTitle.replace(/^! /, '');
    // Remove leading - character.
    calendarEventTitle = calendarEventTitle.replace(/^- /, '');
    // Remove leading ~ character.
    calendarEventTitle = calendarEventTitle.replace(/^~ /, '');

    var eventTitlePrefix = clickedData['eventTitlePrefix'];
    DEBUG && console.log('eventTitlePrefix:', eventTitlePrefix);
    if (eventTitlePrefix === '✓') {
        // Remove leading "Tentative: ".
        calendarEventTitle = calendarEventTitle.replace(/^Tentative: /, '');
    }

    DEBUG && console.log(' after calendarEventTitle:', calendarEventTitle);

    // "✓ My Event; Dec 31, 2015; event date: Jan 1, 2016"
    // "1. My Event"
    // "My Event"
    var newCalendarEventTitle = calendarEventTitle;
    if (eventTitlePrefix !== null) {
        newCalendarEventTitle = eventTitlePrefix + ' ' + calendarEventTitle;
        if (! PRIORITY_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
            newCalendarEventTitle += ';' +
                ' ' + todayFormattedDate + ';' +
                ' event date: ' + eventDate;
        }
    }
    DEBUG && console.log('newCalendarEventTitle:', newCalendarEventTitle);
    eventTitle.value = newCalendarEventTitle;

    setTimeout(function() {
        dispatchEvent(eventTitle, 'input');
    }, 200);

    var saveButton = document.querySelector('[aria-label="Save"]');
    setTimeout(function() {
        saveButton.click();
    }, 700);

    DEBUG && console.groupEnd();
}

function handleKeyEvent(event) {
    DEBUG && console.info('handleKeyEvent');
    var character = String.fromCharCode(event.which);
    if (!event.shiftKey) {
        character = character.toLowerCase();
    }
    if (event.which === KEYCODE.DASH) {
        character = '-';
    }
    DEBUG && console.log('character:', character);

    // Ignore events with modifiers.
    if (event.shiftKey) {
        return;
    }
    if (event.altKey) {
        return;
    }
    if (event.ctrlKey) {
        return;
    }
    if (event.metaKey) {
        return;
    }

    // Take requested action when event bubble is open and a keyboard shortcut matching the key pressed is found.
    var eventBubble = document.querySelector('#xDetDlg[data-eventid]')
    if (eventBubble && character in BUTTON_SELECTORS) {
        event.preventDefault();

        var buttonSelector = BUTTON_SELECTORS[character];
        var buttonToClick = document.querySelector(buttonSelector);
        if (buttonToClick) {
            buttonToClick.click();
        }
    }
}

document.addEventListener('keydown', handleKeyEvent);

var buttonClickedData;
(function(){
    var pathname = window.location.pathname;
    setInterval(function() {
        if (pathname !== window.location.pathname) {
            DEBUG && console.log('pathname changed');
            pathname = window.location.pathname;
            if (pathname.match(/^\/calendar\/r\/eventedit\//)) {
                DEBUG && console.log('on event edit page');

                if (buttonClickedData) {
                    clickButton(buttonClickedData);
                    buttonClickedData = null;
                } else {
                    // Add action buttons to calendar event edit page.
                    DEBUG && console.log('adding buttons');
                    var onclickAction = function(myButton, myEventTitlePrefix) {
                        buttonClickedData = {
                            'button': myButton,
                            'eventTitlePrefix': myEventTitlePrefix,
                        };
                        clickButton(buttonClickedData);
                        buttonClickedData = null;
                    };

                    var saveButton = document.querySelector('[aria-label="Save"]');

                    var buttonWrapper = document.createElement('div');
                    buttonWrapper.style.left = '350px';
                    buttonWrapper.style.position = 'absolute';
                    buttonWrapper.style.top = '65px';
                    buttonWrapper.style.width = '350px';
                    buttonWrapper.style.zIndex = '1';

                    insertAfter(buttonWrapper, saveButton);
                    insertButtons(buttonWrapper, onclickAction, 'inside');
                }
            }
        }
    }, 1000);
})();

document.onclick = function(event) {
    DEBUG && console.group('element clicked');
    DEBUG && console.log('element clicked:', event.target);

    var target = event.target;
    if (!target) {
        return;
    }
    var eventIdFound = false;
    for (var i = 0; i < 5; i++) {
        if (!target) {
            break;
        // Ignore event bubble.
        } else if (target.getAttribute('id') === 'xDetDlg') {
            break;
        } else if (target.getAttribute('data-eventid')) {
            eventIdFound = true;
            break;
        }
        target = target.parentElement;
    }
    DEBUG && console.log('target:', target);
    if (eventIdFound) {
        var eventId = target.getAttribute('data-eventid');
        DEBUG && console.log('event id found:', eventId);

        function modifyEventBubble(attempt) {
            attempt = attempt || 1;
            if (attempt >= 3) {
                return;
            }
            attempt += 1;

            var eventBubble = document.querySelector('#xDetDlg[data-eventid="' + eventId + '"]');
            DEBUG && console.log('eventBubble:', eventBubble);
            if (!eventBubble) {
                setTimeout(modifyEventBubble, 500, attempt);
                return;
            }

            var editEventButton = eventBubble.querySelector('[data-tooltip="Edit event"]');
            var eventEditable = editEventButton ? true : false;
            if (!eventEditable) {
                return;
            }

            var lastEventBubbleMetaItem = document.querySelector('#xDtlDlgCt > div:last-child');

            var newEventBubbleMetaItem = document.createElement('div');
            newEventBubbleMetaItem.classList.add(...lastEventBubbleMetaItem.classList);
            insertAfter(newEventBubbleMetaItem, lastEventBubbleMetaItem);

            var lastNewEventBubbleMetaItem = document.createElement('div');
            lastNewEventBubbleMetaItem.classList.add(...lastEventBubbleMetaItem.classList);
            lastNewEventBubbleMetaItem.classList.add('_gcw-last-event-bubble-meta');
            insertAfter(lastNewEventBubbleMetaItem, newEventBubbleMetaItem);

            var onclickAction = function(myButton, myEventTitlePrefix) {
                buttonClickedData = {
                    'button': myButton,
                    'eventTitlePrefix': myEventTitlePrefix,
                };

                var editEventButton = document.querySelector('[aria-label="Edit event"]');
                DEBUG && console.log('editEventButton:', editEventButton);
                editEventButton.click();
            };
            insertButtons(newEventBubbleMetaItem, onclickAction, 'inside', lastNewEventBubbleMetaItem);
        }
        setTimeout(modifyEventBubble, 100);
    }
    DEBUG && console.groupEnd();
};
