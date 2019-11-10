'use strict';

const DEBUG = false;
const TEST_ENV = 'TEST';
const PROD_ENV = 'PROD';

// TODO: Clean up by using JavaScript classes.

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

const COMPLETED_EVENT_TITLE_PREFIXES = ['✓', '✗', '▣', 'ツ'];
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

    // Move event to the current move-to date if marked completed.
    if (COMPLETED_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
        DEBUG && console.log('event marked completed');
        var moveToDateInput = document.querySelector('._move-to-date-input');
        if (moveToDateInput.value) {
            DEBUG && console.log('moving event to', moveToDateInput.value);
            setTimeout(function() {
                startDateInput.focus();
                startDateInput.value = moveToDateInput.value;

                setTimeout(function() {
                    dispatchEvent(startDateInput, 'input');
                    endDateInput.focus();

                    setTimeout(function() {
                        dispatchEvent(endDateInput, 'input');
                        eventTitle.focus();
                    }, 200);
                }, 200);
            }, 200);
        }
    }

    setTimeout(function() {
        dispatchEvent(eventTitle, 'input');
    }, 200);

    var saveButton = document.querySelector('[aria-label="Save"]');
    setTimeout(function() {
        saveButton.click();
        setTimeout(updateMoveToDate, 1000);
    }, 800);

    DEBUG && console.groupEnd();
}

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
        setTimeout(updateMoveToDate, 5000, attempt);
        return;
    }

    var moveToDate = new GoogleCalendarMoveToDate({
        'debug': DEBUG,
        'env': PROD_ENV,
    });
    var topCell = moveToDate.findTopCell(calendarGridRows);
    // Update move to date input value only when a top cell is found.
    if (topCell !== undefined) {
        var cellDate = moveToDate.getCellDate(topCell);
        var moveToDateInput = document.querySelector('._move-to-date-input');
        moveToDateInput.value = cellDate;
    }
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
    } else if (character === 'j' || character === 'k') {
        setTimeout(updateMoveToDate, 3000);
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

var moveToDateContainer = document.createElement('div');
moveToDateContainer.classList.add('_move-to-date-container');
moveToDateContainer.style.position = 'absolute';
moveToDateContainer.style.right = '165px';
moveToDateContainer.style.top = '50px';
moveToDateContainer.style.zIndex = '1000';

var moveToDateInput = document.createElement('input');
moveToDateInput.classList.add('_move-to-date-input');
moveToDateInput.placeholder = 'Move-to Date';
moveToDateInput.style.textAlign = 'center';

moveToDateContainer.appendChild(moveToDateInput);
document.body.appendChild(moveToDateContainer);
DEBUG && console.log('moveToDateContainer:', moveToDateContainer);

setTimeout(updateMoveToDate, 5000);

class GoogleCalendarMoveToDate {
    // Maximum number of events to keep in a cell.
    #MAX_EVENTS_PER_CELL = 14;

    constructor(options) {
        this.options = options;
        this.env = options.env;
        this.debug = options.debug ? true : false;
    }

    findCellsInRow(row) {
        this.debug && console.info('findCellsInRow');
        this.debug && console.log('row:', row);
        var rowCells;
        if (this.env === PROD_ENV) {
            rowCells = row.querySelectorAll('[role="gridcell"]');
        } else if (this.env === TEST_ENV) {
            rowCells = row;
        }
        this.debug && console.log('rowCells:', rowCells);
        return rowCells;
    }

    countEventsInCell(cell) {
        this.debug && console.info('countEventsInCell');
        this.debug && console.log('cell:', cell);
        var cellEventsFound;
        if (this.env === PROD_ENV) {
            var cellEvents = cell.querySelectorAll('[data-eventid]');
            cellEventsFound = cellEvents.length;
            var moreCellEvents = cell.querySelector('[data-opens-day-overview]');
            if (moreCellEvents) {
                cellEventsFound += parseInt(moreCellEvents.innerText.match(/(\d+) more/)[1]);
            }
        } else if (this.env === TEST_ENV) {
            var cellEvents = cell;
            cellEventsFound = cellEvents.length;
        }
        this.debug && console.log('cellEventsFound:', cellEventsFound);
        return cellEventsFound;
    }

    findTopCell(cells) {
        // Find first top-right most cell in current view containing a non-full number of events.
        this.debug && console.info('findTopCell');
        this.debug && console.log('cells:', cells);
        var topCell;

        // Check top to bottom.
        outer_loop:
        for (var rowIndex = 0; rowIndex < cells.length; rowIndex++) {
            this.debug && console.log('rowIndex:', rowIndex);

            var row = cells[rowIndex];
            this.debug && console.log('row:', row);

            var rowCells = this.findCellsInRow(row);
            // Check right to left.
            for (var cellIndex = rowCells.length - 1; cellIndex >= 0; cellIndex--) {
                this.debug && console.log('cellIndex:', cellIndex);
                var cell = rowCells[cellIndex];
                this.debug && console.log('cell:', cell);

                var cellEventsFound = this.countEventsInCell(cell);
                if (cellEventsFound < this.#MAX_EVENTS_PER_CELL) {
                    if (this.env === PROD_ENV) {
                        topCell = cell;
                    } else if (this.env === TEST_ENV) {
                        topCell = [rowIndex, cellIndex];
                    }
                    break outer_loop;
                } else {
                    this.debug && console.log('ELSE');
                }
            }
        }

        this.debug && console.log('topCell:', topCell);
        return topCell;
    }

    getCellDate(cell) {
        this.debug && console.info('getCellDate');
        this.debug && console.log('cell:', cell);
        var cellDate;
        if (this.env === PROD_ENV) {
            // "October 17".
            var monthDate = cell.querySelector('h2').innerText.match(/ events?, .*day, (.*?)$/)[1];
            this.debug && console.log('monthDate:', monthDate);

            // "October 17, 2019".
            var monthDateYear = monthDate + ', ' + (new Date()).getFullYear();
            this.debug && console.log('monthDateYear:', monthDateYear);

            cellDate = monthDateYear;
        } else if (this.env === TEST_ENV) {
            var rowIndex = cell[0];
            var cellIndex = cell[1];
            cellDate = this.options.cellDates[rowIndex][cellIndex];
        }
        this.debug && console.log('cellDate:', cellDate);
        return cellDate;
    }
}
