'use strict';

const DEBUG = false;

// TODO: Clean up by using JavaScript classes.

const BUTTON_LABELS = [
    // buttonLabel, eventTitlePrefix, buttonClassNames.
    ['-',       '-',  ['jfk-button', 'jfk-button-standard', 'button-dash']],
    ['0',       '0.', ['jfk-button', 'jfk-button-standard', 'button-0']],
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
    '0': '.button-0',
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

const COMPLETED_EVENT_TITLE_PREFIXES = ['✓', '✗', '▣', 'ツ'];
const PRIORITY_EVENT_TITLE_PREFIXES = ['-', '0.', '1.', '2.', '3.', '4.', '5.', null];

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

    Promise.all([
        waitUntilElementExists('[aria-label="Start date"]'),
        waitUntilElementExists('[aria-label="End date"]'),
        waitUntilElementExists('[aria-label="Title"]'),
    ]).then(function([
        startDateInput,
        endDateInput,
        eventTitle,
    ]) {
        // Today.
        var date = new Date();
        var monthName = date.toLocaleString('en-us', { 'month': 'short' });
        var todayFormattedDate = monthName + ' ' + date.getDate() + ', ' + date.getFullYear();

        // Event date.
        var eventDate = startDateInput.value;
        if (endDateInput.value !== startDateInput.value) {
            eventDate += ' - ' + endDateInput.value;
        }
        DEBUG && console.log('eventDate:', eventDate);

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

            // Remove leading "- " when the dash hotkey is pressed the current
            // event title already starts with a dash (toggle the dash prefix).
            if (eventTitlePrefix === '-' && eventTitle.value.startsWith('- ')) {
                newCalendarEventTitle = calendarEventTitle;
            } else {
                newCalendarEventTitle = eventTitlePrefix + ' ' + calendarEventTitle;
            }

            if (! PRIORITY_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
                newCalendarEventTitle += ';' +
                    ' ' + todayFormattedDate + ';' +
                    ' event date: ' + eventDate;
            }
        }
        DEBUG && console.log('newCalendarEventTitle:', newCalendarEventTitle);
        eventTitle.focus();
        eventTitle.value = newCalendarEventTitle;
        setTimeout(function() {
            dispatchEvent(eventTitle, 'input');

            // Move event to the current move-to date if marked completed.
            if (COMPLETED_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
                DEBUG && console.log('event marked completed');
                moveEventToMoveToDate(eventPageClickSaveButton);
            } else {
                eventPageClickSaveButton();
            }

            DEBUG && console.groupEnd();
        }, 200);
    });
}

var moveToDate;
function updateMoveToDate(attempt) {
    DEBUG && console.info('updateMoveToDate');
    attempt = attempt || 1;
    if (attempt >= 5) {
        return;
    } else {
        attempt += 1;
    }
    DEBUG && console.log('attempt:', attempt);

    // Find oldest date with a non-full number of events on the calendar day.

    var calendarGridRows = document.querySelectorAll('[data-view-heading] [role="presentation"] [role="row"]');
    DEBUG && console.log('calendarGridRows found:', calendarGridRows.length);
    if (!calendarGridRows.length) {
        setTimeout(updateMoveToDate, 2000, attempt);
        return;
    }

    // Update move to date input value only when a top cell date is found.
    var topCellDate = moveToDate.getTopCellDate(calendarGridRows);
    if (topCellDate !== undefined) {
        var moveToDateInput = document.querySelector('._move-to-date-input');
        moveToDateInput.value = moveToDate.getInputDateFormattedDate(topCellDate);
    }
}

function updateMaxEventsPerCell(maxEventsPerCell) {
    DEBUG && console.info('updateMaxEventsPerCell');
    DEBUG && console.log('maxEventsPerCell:', maxEventsPerCell);
    moveToDate.setOption('maxEventsPerCell', maxEventsPerCell);
    moveToDate.clearTopCellDate();
    updateMoveToDate();
}

function eventPageClickSaveButton() {
    DEBUG && console.info('eventPageClickSaveButton');
    waitUntilElementExists('[aria-label="Save"]')
    .then((saveButton) => {
        saveButton.click();
        setTimeout(updateMoveToDate, 500);
    });
}

function clickEventBubbleDeleteButton() {
    DEBUG && console.info('clickEventBubbleDeleteButton');
    var deleteEventButton = document.querySelector('[aria-label="Delete event"]');
    DEBUG && console.log('deleteEventButton:', deleteEventButton);
    deleteEventButton.click();
}

function clickEventBubbleEditButton() {
    DEBUG && console.info('clickEventBubbleEditButton');
    var editEventButton = document.querySelector('[aria-label="Edit event"]');
    DEBUG && console.log('editEventButton:', editEventButton);
    editEventButton.click();
}

function moveEventToMoveToDate(callback) {
    DEBUG && console.info('moveEventToMoveToDate');
    var moveToDateInput = document.querySelector('._move-to-date-input');
    if (moveToDateInput.value) {
        DEBUG && console.log('moving event to', moveToDateInput.value);

        Promise.all([
            waitUntilElementExists('[aria-label="Start date"]'),
            waitUntilElementExists('[aria-label="End date"]'),
            waitUntilElementExists('[aria-label="Title"]'),
        ]).then(function([
            startDateInput,
            endDateInput,
            eventTitle,
        ]) {
            var eventDateInputFormattedDate = moveToDate.getEventDateFormattedDate(moveToDateInput.value);

            Promise.resolve()
            .then(() => setInputValue(startDateInput, eventDateInputFormattedDate))
            .then(() => setInputValue(endDateInput, eventDateInputFormattedDate))
            .then(() => eventTitle.focus())
            .then(() => {
                console.log('all done');
                if (callback) {
                    callback();
                }
            });
        });
    }
}

function handleKeyEvent(event) {
    DEBUG && console.info('handleKeyEvent');
    var character = event.key;
    DEBUG && console.log('character:', character);

    // Ignore events with modifiers.
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
    } else if (eventBubble && character === '#') {
        clickEventBubbleDeleteButton();
    } else if (eventBubble && character === 'm') {
        clickEventBubbleEditButton();
        moveEventToMoveToDate(eventPageClickSaveButton);
    } else if (character === 'j' || character === 'k') {
        setTimeout(updateMoveToDate, 3000);
    }
}

document.addEventListener('keydown', handleKeyEvent);

var buttonClickedData;
(function() {
    function pathnameChanged(pathname) {
        DEBUG && console.info('pathnameChanged');
        DEBUG && console.log('pathname:', pathname);

        if (pathname.match(/\/eventedit\//)) {
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
        } else {
            DEBUG && console.log('NOT on event edit page');
        }
    }

    var pathname = window.location.pathname;
    setInterval(function() {
        if (pathname !== window.location.pathname) {
            DEBUG && console.log('pathname changed');
            pathname = window.location.pathname;
            pathnameChanged(pathname);
        }
    }, 500);
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
                clickEventBubbleEditButton();
            };
            insertButtons(newEventBubbleMetaItem, onclickAction, 'inside', lastNewEventBubbleMetaItem);
        }
        setTimeout(modifyEventBubble, 100);
    }
    DEBUG && console.groupEnd();
};

var moveToDateContainer = document.createElement('div');
moveToDateContainer.classList.add('_move-to-date-container');
moveToDateContainer.style.position = 'absolute';
moveToDateContainer.style.right = '165px';
moveToDateContainer.style.top = '50px';
moveToDateContainer.style.zIndex = '1000';

var moveToDateRadioManual = document.createElement('input');
moveToDateRadioManual.addEventListener('change', function(event) {
    updateMaxEventsPerCell(event.target.value);
    moveToDateInput.disabled = false;
});
moveToDateRadioManual.name = 'max-events-per-cell';
moveToDateRadioManual.type = 'radio';
moveToDateRadioManual.value = 'manual';
var moveToDateRadioManualLabel = document.createElement('label');
moveToDateRadioManualLabel.appendChild(moveToDateRadioManual);
moveToDateRadioManualLabel.appendChild(document.createTextNode('Manual'));
moveToDateContainer.appendChild(moveToDateRadioManualLabel);

var moveToDateRadioSeven = document.createElement('input');
moveToDateRadioSeven.addEventListener('change', function(event) {
    updateMaxEventsPerCell(event.target.value);
    moveToDateInput.disabled = true;
});
moveToDateRadioSeven.name = 'max-events-per-cell';
moveToDateRadioSeven.type = 'radio';
moveToDateRadioSeven.value = '7';
var moveToDateRadioSevenLabel = document.createElement('label');
moveToDateRadioSevenLabel.appendChild(moveToDateRadioSeven);
moveToDateRadioSevenLabel.appendChild(document.createTextNode('7 Events'));
moveToDateContainer.appendChild(moveToDateRadioSevenLabel);

var moveToDateRadioFourteen = document.createElement('input');
moveToDateRadioFourteen.addEventListener('change', function(event) {
    updateMaxEventsPerCell(event.target.value);
    moveToDateInput.disabled = true;
});
moveToDateRadioFourteen.checked = 'checked';
moveToDateRadioFourteen.name = 'max-events-per-cell';
moveToDateRadioFourteen.type = 'radio';
moveToDateRadioFourteen.value = '14';
var moveToDateRadioFourteenLabel = document.createElement('label');
moveToDateRadioFourteenLabel.appendChild(moveToDateRadioFourteen);
moveToDateRadioFourteenLabel.appendChild(document.createTextNode('14 Events'));
moveToDateContainer.appendChild(moveToDateRadioFourteenLabel);

var moveToDateInput = document.createElement('input');
moveToDateInput.classList.add('_move-to-date-input');
moveToDateInput.disabled = true;
moveToDateInput.placeholder = 'Move-to Date';
moveToDateInput.style.textAlign = 'center';
moveToDateInput.type = 'date';
moveToDateContainer.appendChild(moveToDateInput);

document.body.appendChild(moveToDateContainer);
DEBUG && console.log('moveToDateContainer:', moveToDateContainer);

setTimeout(updateMoveToDate, 5000);


moveToDate = new GoogleCalendarMoveToDate({
    'debug': DEBUG,
    'env': PROD_ENV,
    'moveToDateInput': moveToDateInput,
});
