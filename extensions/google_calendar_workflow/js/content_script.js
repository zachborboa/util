'use strict';

class GoogleCalendarWorkflow {
    BUTTON_LABELS = [
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

    BUTTON_SELECTORS = {
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

    PRIORITY_EVENT_TITLE_PREFIXES = ['-', '0.', '1.', '2.', '3.', '4.', '5.', null];

    COMPLETED_EVENT_TITLE_PREFIXES = ['✓', '✗', '▣', 'ツ'];

    constructor(options) {
        this.options = options;
        this.debug = options.debug ? true : false;

        this.eventBubbleEventId = '';
        this.buttonClickedData = {};
        this.moveToDateValue = '';

        this.addEventListeners();
        this.moveToDateInput = this.addMoveToDateField();

        this.moveToDate = new GoogleCalendarMoveToDate({
            'debug': this.debug,
            'env': PROD_ENV,
            'moveToDateInput': this.moveToDateInput,
        });
    }

    insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    insertButtons(referenceNode, onclickAction, where, alternateReferenceNode) {
        var insertTarget = referenceNode;
        for (var i in this.BUTTON_LABELS) {
            var buttonLabel = this.BUTTON_LABELS[i][0];
            // this.debug && console.log('buttonLabel:', buttonLabel);

            var eventTitlePrefix = this.BUTTON_LABELS[i][1];
            // this.debug && console.log('eventTitlePrefix:', eventTitlePrefix);

            var buttonClassNames = this.BUTTON_LABELS[i][2];
            // this.debug && console.log('buttonClassNames:', buttonClassNames);

            var button = document.createElement('button');
            button.innerHTML = '<u>' + buttonLabel[0] + '</u>' + buttonLabel.slice(1);
            button.classList.add(...buttonClassNames);

            (function(myButton, myEventTitlePrefix) {
                myButton.onclick = function() {
                    // this.debug && console.log('myButton.onclick');
                    onclickAction(myButton, myEventTitlePrefix);
                };
            }(button, eventTitlePrefix));

            // this.debug && console.log('inserting button', button, where, insertTarget);
            if (where === 'after') {
                this.insertAfter(button, insertTarget);
                insertTarget = button;
            } else if (where === 'inside') {
                if (alternateReferenceNode && !this.PRIORITY_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
                    alternateReferenceNode.appendChild(button);
                } else {
                    referenceNode.appendChild(button);
                }
            }
        }
    }

    clickEventBubbleEditButton() {
        this.debug && console.info('clickEventBubbleEditButton');
        var editEventButton = document.querySelector('[aria-label="Edit event"]');
        // this.debug && console.log('editEventButton:', editEventButton);
        editEventButton.click();
    }

    modifyEventBubble(attempt) {
        this.debug && console.group('modify event bubble');

        attempt = attempt || 0;
        attempt += 1;
        this.debug && console.log('attempt', attempt);

        if (attempt >= 5) {
            this.debug && console.log('too many attempts');
            this.debug && console.groupEnd();
            return;
        }

        var eventBubble = document.querySelector('#xDetDlg[data-eventid="' + this.eventBubbleEventId + '"]');
        // this.debug && console.log('eventBubble:', eventBubble);
        if (!eventBubble) {
            setTimeout(() => {
                this.modifyEventBubble();
            }, 500, attempt);
            this.debug && console.log('will try again soon');
            this.debug && console.groupEnd();
            return;
        }

        var editEventButton = eventBubble.querySelector('[data-tooltip="Edit event"]');
        var eventEditable = editEventButton ? true : false;
        if (!eventEditable) {
            this.debug && console.log('event not editable');
            this.debug && console.groupEnd();
            return;
        }

        this.debug && console.log('will modify event bubble');
        this.debug && console.groupEnd();

        var lastEventBubbleMetaItem = document.querySelector('#xDtlDlgCt > div:last-child');

        var newEventBubbleMetaItem = document.createElement('div');
        newEventBubbleMetaItem.classList.add(...lastEventBubbleMetaItem.classList);
        this.insertAfter(newEventBubbleMetaItem, lastEventBubbleMetaItem);

        var lastNewEventBubbleMetaItem = document.createElement('div');
        lastNewEventBubbleMetaItem.classList.add(...lastEventBubbleMetaItem.classList);
        lastNewEventBubbleMetaItem.classList.add('_gcw-last-event-bubble-meta');
        this.insertAfter(lastNewEventBubbleMetaItem, newEventBubbleMetaItem);

        var onclickAction = (myButton, myEventTitlePrefix) => {
            this.buttonClickedData = {
                'button': myButton,
                'eventTitlePrefix': myEventTitlePrefix,
            };
            this.clickEventBubbleEditButton();
        };
        this.insertButtons(newEventBubbleMetaItem, onclickAction, 'inside', lastNewEventBubbleMetaItem);

        setTimeout(() => {
            if (!document.body.contains(lastNewEventBubbleMetaItem)) {
                this.debug && console.warn('event bubble meta item disappeared');
                this.modifyEventBubble();
            }
        }, 1000);
    }

    lookForEventBubble() {
        // this.debug && console.group('element clicked');
        // this.debug && console.log('element clicked:', event.target);

        var target = event.target;
        if (!target) {
            // this.debug && console.log('no target');
            // this.debug && console.groupEnd();
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
        // this.debug && console.log('target:', target);

        if (!eventIdFound) {
            // this.debug && console.log('event id not found');
            // this.debug && console.groupEnd();
            return;
        }

        this.eventBubbleEventId = target.getAttribute('data-eventid');
        // this.debug && console.log('event id found:', this.eventBubbleEventId);
        this.modifyEventBubble();

        // this.debug && console.groupEnd();
    }

    eventPageClickSaveButton() {
        this.debug && console.info('eventPageClickSaveButton');
        waitUntilElementExists('[aria-label="Save"]')
        .then((saveButton) => {
            saveButton.click();
            setTimeout(() => {
                this.updateMoveToDate();
            }, 500);
        });
    }

    clickButton(clickedData) {
        this.debug && console.group('clickButton');
        this.debug && console.log('clickedData:', clickedData);
        this.debug && console.log('button clicked');

        Promise.all([
            waitUntilElementExists('[aria-label="Start date"]'),
            waitUntilElementExists('[aria-label="End date"]'),
            waitUntilElementExists('[aria-label="Title"]'),
        ]).then(([
            startDateInput,
            endDateInput,
            eventTitle,
        ]) => {
            // Today.
            var date = new Date();
            var monthName = date.toLocaleString('en-us', { 'month': 'short' });
            var todayFormattedDate = monthName + ' ' + date.getDate() + ', ' + date.getFullYear();

            // Event date.
            var eventDate = startDateInput.value;
            if (endDateInput.value !== startDateInput.value) {
                eventDate += ' - ' + endDateInput.value;
            }
            this.debug && console.log('eventDate:', eventDate);

            var calendarEventTitle = eventTitle.value;
            this.debug && console.log('before calendarEventTitle:', calendarEventTitle);

            // Remove leading number (e.g. "1. " in "1. My Calendar Event").
            calendarEventTitle = calendarEventTitle.replace(/^\d+\. /, '');
            // Remove leading ! character.
            calendarEventTitle = calendarEventTitle.replace(/^! /, '');
            // Remove leading - character.
            calendarEventTitle = calendarEventTitle.replace(/^- /, '');
            // Remove leading ~ character.
            calendarEventTitle = calendarEventTitle.replace(/^~ /, '');

            var eventTitlePrefix = clickedData['eventTitlePrefix'];
            this.debug && console.log('eventTitlePrefix:', eventTitlePrefix);
            if (eventTitlePrefix === '✓') {
                // Remove leading "Tentative: ".
                calendarEventTitle = calendarEventTitle.replace(/^Tentative: /, '');
            }

            this.debug && console.log(' after calendarEventTitle:', calendarEventTitle);

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

                if (!this.PRIORITY_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
                    newCalendarEventTitle += ';' +
                        ' ' + todayFormattedDate + ';' +
                        ' event date: ' + eventDate;
                }
            }
            this.debug && console.log('newCalendarEventTitle:', newCalendarEventTitle);
            eventTitle.focus();
            eventTitle.value = newCalendarEventTitle;
            setTimeout(() => {
                dispatchEvent(eventTitle, 'input');

                // Move event to the current move-to date if marked completed.
                if (this.COMPLETED_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix)) {
                    this.debug && console.log('event marked completed');
                    var callback = this.eventPageClickSaveButton.bind(this);
                    this.moveEventToMoveToDate(callback);
                } else {
                    this.eventPageClickSaveButton();
                }

                this.debug && console.groupEnd();
            }, 200);
        });
    }

    pathnameChanged(pathname) {
        this.debug && console.info('pathnameChanged');
        this.debug && console.log('pathname:', pathname);

        if (pathname.match(/\/eventedit\//)) {
            this.debug && console.log('on event edit page');
            if (this.buttonClickedData) {
                this.clickButton(this.buttonClickedData);
                this.buttonClickedData = null;
            } else {
                // Add action buttons to calendar event edit page.
                this.debug && console.log('adding buttons');
                var onclickAction = (myButton, myEventTitlePrefix) => {
                    this.buttonClickedData = {
                        'button': myButton,
                        'eventTitlePrefix': myEventTitlePrefix,
                    };
                    this.clickButton(this.buttonClickedData);
                    this.buttonClickedData = null;
                };

                var saveButton = document.querySelector('[aria-label="Save"]');

                var buttonWrapper = document.createElement('div');
                buttonWrapper.style.left = '350px';
                buttonWrapper.style.position = 'absolute';
                buttonWrapper.style.top = '65px';
                buttonWrapper.style.width = '350px';
                buttonWrapper.style.zIndex = '1';

                this.insertAfter(buttonWrapper, saveButton);
                this.insertButtons(buttonWrapper, onclickAction, 'inside');
            }
        } else {
            this.debug && console.log('NOT on event edit page');
        }
    }

    clickEventBubbleDeleteButton() {
        this.debug && console.info('clickEventBubbleDeleteButton');
        var deleteEventButton = document.querySelector('[aria-label="Delete event"]');
        this.debug && console.log('deleteEventButton:', deleteEventButton);
        deleteEventButton.click();
    }

    moveEventToMoveToDate(callback) {
        this.debug && console.info('moveEventToMoveToDate');
        var moveToDateInput = document.querySelector('._move-to-date-input');
        if (moveToDateInput.value === '') {
            this.debug && console.warn('move to date empty');
            return;
        }

        this.debug && console.log('moving event to', moveToDateInput.value);

        Promise.all([
            waitUntilElementExists('[aria-label="Start date"]'),
            waitUntilElementExists('[aria-label="End date"]'),
            waitUntilElementExists('[aria-label="Title"]'),
        ]).then(([
            startDateInput,
            endDateInput,
            eventTitle,
        ]) => {
            var eventDateInputFormattedDate = this.moveToDate.getEventDateFormattedDate(moveToDateInput.value);

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

    handleKeyEvent(event) {
        // this.debug && console.info('handleKeyEvent');
        var character = event.key;
        // this.debug && console.log('character:', character);

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
        if (eventBubble && character in this.BUTTON_SELECTORS) {
            event.preventDefault();

            var buttonSelector = this.BUTTON_SELECTORS[character];
            var buttonToClick = document.querySelector(buttonSelector);
            if (buttonToClick) {
                buttonToClick.click();
            }
        } else if (eventBubble && character === '#') {
            this.clickEventBubbleDeleteButton();
        } else if (eventBubble && character === 'm') {
            this.clickEventBubbleEditButton();
            this.moveEventToMoveToDate(this.eventPageClickSaveButton);
        } else if (character === 'j' || character === 'k') {
            setTimeout(() => {
                this.updateMoveToDate();
            }, 3000);
        }
    }

    addEventListeners() {
        document.addEventListener('click', () => {
            this.lookForEventBubble();
        }, false);

        var pathname = window.location.pathname;
        setInterval(() => {
            if (pathname !== window.location.pathname) {
                this.debug && console.log('pathname changed');
                pathname = window.location.pathname;
                this.pathnameChanged(pathname);
            }
        }, 500);

        document.addEventListener('keydown', (event) => {
            this.handleKeyEvent(event);
        }, false);
    }

    updateMoveToDate(attempt) {
        this.debug && console.group('updateMoveToDate');
        attempt = attempt || 0;
        attempt += 1;
        this.debug && console.log('attempt', attempt);

        if (attempt >= 5) {
            this.debug && console.log('too many attempts');
            this.debug && console.groupEnd();
            return;
        }

        // Find oldest date with a non-full number of events on the calendar day.

        var calendarGridRows = document.querySelectorAll('[data-view-heading] [role="presentation"] [role="row"]');
        this.debug && console.log('calendarGridRows found:', calendarGridRows.length);
        if (!calendarGridRows.length) {
            setTimeout(() => {
                this.updateMoveToDate(attempt);
            }, 2000);
            this.debug && console.groupEnd();
            return;
        }

        // Update move to date input value only when a top cell date is found.
        var topCellDate = this.moveToDate.getTopCellDate(calendarGridRows);
        if (topCellDate !== undefined) {
            this.moveToDateInput.value = this.moveToDate.getInputDateFormattedDate(topCellDate);
        }

        this.debug && console.groupEnd();
    }

    updateMaxEventsPerCell(maxEventsPerCell) {
        this.debug && console.info('updateMaxEventsPerCell');
        this.debug && console.log('maxEventsPerCell:', maxEventsPerCell);
        this.moveToDate.setOption('maxEventsPerCell', maxEventsPerCell);
        this.moveToDate.clearTopCellDate();
        this.updateMoveToDate();
    }

    addMoveToDateField() {
        this.debug && console.info('addMoveToDateField');

        var moveToDateContainer = document.createElement('div');
        moveToDateContainer.classList.add('_move-to-date-container');
        moveToDateContainer.style.position = 'absolute';
        moveToDateContainer.style.right = '165px';
        moveToDateContainer.style.top = '50px';
        moveToDateContainer.style.zIndex = '1000';

        var moveToDateRadioManual = document.createElement('input');
        moveToDateRadioManual.addEventListener('change', (event) => {
            this.updateMaxEventsPerCell(event.target.value);
            this.moveToDateInput.disabled = false;
        });
        moveToDateRadioManual.name = 'max-events-per-cell';
        moveToDateRadioManual.type = 'radio';
        moveToDateRadioManual.value = 'manual';
        var moveToDateRadioManualLabel = document.createElement('label');
        moveToDateRadioManualLabel.appendChild(moveToDateRadioManual);
        moveToDateRadioManualLabel.appendChild(document.createTextNode('Manual'));
        moveToDateContainer.appendChild(moveToDateRadioManualLabel);

        var moveToDateRadioSeven = document.createElement('input');
        moveToDateRadioSeven.addEventListener('change', (event) => {
            this.updateMaxEventsPerCell(event.target.value);
            this.moveToDateInput.disabled = true;
        });
        moveToDateRadioSeven.name = 'max-events-per-cell';
        moveToDateRadioSeven.type = 'radio';
        moveToDateRadioSeven.value = '7';
        var moveToDateRadioSevenLabel = document.createElement('label');
        moveToDateRadioSevenLabel.appendChild(moveToDateRadioSeven);
        moveToDateRadioSevenLabel.appendChild(document.createTextNode('7 Events'));
        moveToDateContainer.appendChild(moveToDateRadioSevenLabel);

        var moveToDateRadioFourteen = document.createElement('input');
        moveToDateRadioFourteen.addEventListener('change', (event) => {
            this.updateMaxEventsPerCell(event.target.value);
            this.moveToDateInput.disabled = true;
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
        this.debug && console.log('moveToDateContainer:', moveToDateContainer);

        setTimeout(() => {
            this.updateMoveToDate();
        }, 5000);

        return moveToDateInput;
    }
}

new GoogleCalendarWorkflow({
    'debug': true,
});
