'use strict';

class GoogleCalendarWorkflow {
    FIRST_ROW_BUTTONS = [
        // button label, button action, button classes
        ['-', 'toggle-prefix', ['jfk-button', 'jfk-button-standard', 'button-dash']],
        ['0', 'toggle-prefix', ['jfk-button', 'jfk-button-standard', 'button-0']],
        ['1', 'toggle-prefix', ['jfk-button', 'jfk-button-standard', 'button-1']],
        ['2', 'toggle-prefix', ['jfk-button', 'jfk-button-standard', 'button-2']],
        ['3', 'toggle-prefix', ['jfk-button', 'jfk-button-standard', 'button-3']],
        ['4', 'toggle-prefix', ['jfk-button', 'jfk-button-standard', 'button-4']],
        ['5', 'toggle-prefix', ['jfk-button', 'jfk-button-standard', 'button-5']],
        ['X', 'remove-prefix', ['jfk-button', 'jfk-button-standard', 'button-x']],
        ['*', 'toggle-prefix', ['jfk-button', 'jfk-button-standard', 'button-star']],
    ];

    SECOND_ROW_BUTTONS = [
        // button label, button action, button classes
        ['DONE',    'mark-completed', ['jfk-button', 'jfk-button-default',  'button-d']],
        ['NOPE',    'mark-completed', ['jfk-button', 'jfk-button-standard', 'button-n']],
        ['OKAY',    'mark-completed', ['jfk-button', 'jfk-button-standard', 'button-o']],
        ['AWESOME', 'mark-completed', ['jfk-button', 'jfk-button-standard', 'button-a']],
    ];

    BUTTON_LABEL_TO_EVENT_TITLE_PREFIX = {
        // button label, event title prefix
        '-': '-',
        '0': '0.',
        '1': '1.',
        '2': '2.',
        '3': '3.',
        '4': '4.',
        '5': '5.',
        '6': '6.',
        '7': '7.',
        '8': '8.',
        '9': '9.',
        'X': null,
        '*': '*',
        'DONE': '✓',
        'NOPE': '✗',
        'OKAY': '▣',
        'AWESOME': 'ツ',
    };

    BUTTON_SELECTORS = {
        '*': '.button-star',
        '-': '.button-dash',
        '0': '.button-0',
        '1': '.button-1',
        '2': '.button-2',
        '3': '.button-3',
        '4': '.button-4',
        '5': '.button-5',
        '6': '',
        '7': '',
        '8': '',
        '9': '',
        'a': '.button-a',
        'd': '.button-d',
        'n': '.button-n',
        'o': '.button-o',
        'x': '.button-x',
    };

    COMPLETED_EVENT_TITLE_PREFIXES = [
        '✓',
        '✗',
        '▣',
        'ツ',
    ];

    constructor(options) {
        this.options = options;
        this.debug = options.debug ? true : false;

        this.buttonClickedData = {};
        this.moveToDateValue = '';
        this.findEventBubbleInterval;
        this.handleMouseMoveInterval;

        this.addEventListeners();

        this.moveToDateRadioManual;
        this.moveToDateRadioSeven;
        this.moveToDateRadioFourteen;
        this.moveToDateInput;
        this.addMoveToDateField();

        this.currentDateNode;
        this.keepCurrentSelectorsUpdated();

        this.moveToDate = new GoogleCalendarMoveToDate({
            'debug': this.debug,
            'env': PROD_ENV,
            'moveToDateInput': this.moveToDateInput,
        });

        setTimeout(() => {
            this.updateMoveToDate();
            this.restoreUserSettings();
        }, 5000);
    }

    insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    clickEventBubbleEditButton() {
        this.debug && console.info('clickEventBubbleEditButton');
        var editEventButton = document.querySelector('[aria-label="Edit event"]');
        // this.debug && console.log('editEventButton:', editEventButton);
        editEventButton.click();
    }

    getEventActionContainer() {
        var eventActionContainer = document.querySelector('.gcw-container');
        return eventActionContainer;
    }

    showEventActionContainer(eventActionContainer) {
        this.debug && console.log('showEventActionContainer');
        eventActionContainer = eventActionContainer || this.getEventActionContainer();
        if (eventActionContainer) {
            eventActionContainer.style.display = '';
        }
    }

    hideEventActionContainer(eventActionContainer) {
        this.debug && console.log('hideEventActionContainer');
        eventActionContainer = eventActionContainer || this.getEventActionContainer();
        if (eventActionContainer) {
            eventActionContainer.style.display = 'none';
        }
    }

    getEventBubble() {
        var eventBubble = document.querySelector('#xDetDlg[data-eventid]');
        return eventBubble;
    }

    updateEventBubbleMetaPosition(eventBubble, eventActionContainer) {
        eventBubble = eventBubble || this.getEventBubble();
        eventActionContainer = eventActionContainer || this.getEventActionContainer();

        var eventBubbleVisible = eventBubble && isVisible(eventBubble);
        if (eventBubble && eventBubbleVisible && eventActionContainer) {
            var eventBubbleRect = eventBubble.getBoundingClientRect();
            var top = (eventBubbleRect.y + eventBubbleRect.height);
            var left = eventBubbleRect.x;
            // console.log(top, left);
            if (top && left) {
                eventActionContainer.style.top = top + 'px';
                eventActionContainer.style.left = left + 'px';
                this.showEventActionContainer(eventActionContainer);
            }
        } else if ((!eventBubble || !eventBubbleVisible) && eventActionContainer)  {
            this.hideEventActionContainer(eventActionContainer);
        }
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

        var eventBubble = this.getEventBubble();
        if (!eventBubble) {
            // Hide event action buttons when there is no event bubble.
            this.hideEventActionContainer();

            setTimeout(() => {
                this.modifyEventBubble(attempt);
            }, 500);
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

        var eventActionContainer = this.getEventActionContainer();
        if (!eventActionContainer) {
            eventActionContainer = document.createElement('div');
            eventActionContainer.classList.add('gcw-container');
            this.debug && console.log('new event bubble meta item:', eventActionContainer);

            var firstRowEventActions = document.createElement('div');
            for (var i in this.FIRST_ROW_BUTTONS) {
                var buttonLabel = this.FIRST_ROW_BUTTONS[i][0];
                var buttonAction = this.FIRST_ROW_BUTTONS[i][1];
                var buttonClassNames = this.FIRST_ROW_BUTTONS[i][2];
                var button = document.createElement('button');
                button.classList.add(...buttonClassNames);
                button.innerHTML = '<u>' + buttonLabel[0] + '</u>' + buttonLabel.slice(1);
                button.setAttribute('data-action', buttonAction);
                button.setAttribute('data-label', buttonLabel);
                firstRowEventActions.appendChild(button);
            }
            eventActionContainer.appendChild(firstRowEventActions);

            var secondRowEventActions = document.createElement('div');
            for (var i in this.SECOND_ROW_BUTTONS) {
                var buttonLabel = this.SECOND_ROW_BUTTONS[i][0];
                var buttonAction = this.SECOND_ROW_BUTTONS[i][1];
                var buttonClassNames = this.SECOND_ROW_BUTTONS[i][2];
                var button = document.createElement('button');
                button.classList.add(...buttonClassNames);
                button.innerHTML = '<u>' + buttonLabel[0] + '</u>' + buttonLabel.slice(1);
                button.setAttribute('data-action', buttonAction);
                button.setAttribute('data-label', buttonLabel);
                secondRowEventActions.appendChild(button);
            }
            eventActionContainer.appendChild(secondRowEventActions);

            eventActionContainer.style.position = 'absolute';
            eventActionContainer.style.top = '0';
            eventActionContainer.style.left = '0';
            eventActionContainer.style.zIndex = '9999';
            document.body.appendChild(eventActionContainer);
        }

        this.updateEventBubbleMetaPosition(eventBubble, eventActionContainer);
    }

    lookForEventBubble() {
        this.modifyEventBubble();

        // Stop any existing check to update event bubble position.
        clearInterval(this.findEventBubbleInterval);

        // Update event bubble position for the next few seconds.
        var eventBubble = this.getEventBubble();
        var eventActionContainer = this.getEventActionContainer();
        this.findEventBubbleInterval = setInterval(() => {
            this.updateEventBubbleMetaPosition(eventBubble, eventActionContainer);
        }, 50);

        setTimeout(() => {
            clearInterval(this.findEventBubbleInterval);
        }, 3000);
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

    clickEventBubbleDeleteButton() {
        this.debug && console.info('clickEventBubbleDeleteButton');
        var deleteEventButton = document.querySelector('[aria-label="Delete event"]');
        this.debug && console.log('deleteEventButton:', deleteEventButton);
        deleteEventButton.click();
    }

    moveEventToMoveToDate(callback) {
        this.debug && console.info('moveEventToMoveToDate');
        if (this.moveToDateInput.value === '') {
            this.debug && console.warn('move to date empty');
            return;
        }

        this.debug && console.log('moving event to', this.moveToDateInput.value);

        Promise.all([
            waitUntilElementExists('[aria-label="Start date"]'),
            waitUntilElementExists('[aria-label="End date"]'),
            waitUntilElementExists('[aria-label="Title"]'),
        ]).then(([
            startDateInput,
            endDateInput,
            eventTitleInput,
        ]) => {
            var eventDateInputFormattedDate = this.moveToDate.getEventDateFormattedDate(this.moveToDateInput.value);

            Promise.resolve()
            .then(() => setInputValue(startDateInput, eventDateInputFormattedDate))
            .then(() => setInputValue(endDateInput, eventDateInputFormattedDate))
            .then(() => eventTitleInput.focus())
            .then(() => {
                this.debug && console.log('all done');
                if (callback) {
                    this.debug && console.log('calling callback');
                    callback();
                }
            });
        });
    }

    handleKeyEvent(event) {
        // this.debug && console.info('handleKeyEvent');
        var character = event.key;
        // this.debug && console.log('character:', character);

        if (event.getModifierState('CapsLock')) {
            console.warn('caps lock is on');
        }

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

        var eventBubble = this.getEventBubble();

        // Take requested action when event bubble is open and a keyboard shortcut matching the key pressed is found.
        if (eventBubble && character in this.BUTTON_SELECTORS) {
            event.preventDefault();

            var buttonSelector = this.BUTTON_SELECTORS[character];

            // Handle simulated button click without an existing button button
            // (e.g. for buttons 6, 7, 8, 9).
            if (buttonSelector === '') {

                var label = character;
                var action = 'toggle-prefix';
                var eventTitlePrefix = this.BUTTON_LABEL_TO_EVENT_TITLE_PREFIX[label];
                this.updateCalendarEventTitle(label, action, eventTitlePrefix);

            // Handle button click (e.g. for buttons -, 0, 1, 2, 3, 4, 5, x, d,
            // n, o, a).
            } else {
                this.debug && console.log('button selector:', buttonSelector);
                var buttonToClick = document.querySelector(buttonSelector);
                this.debug && console.log('button to click:', buttonToClick);
                if (buttonToClick) {
                    buttonToClick.click();
                }
            }

        // Delete.
        } else if (eventBubble && character === '#') {
            this.clickEventBubbleDeleteButton();

        // Move.
        } else if (eventBubble && character === 'm') {
            this.clickEventBubbleEditButton();

            this.waitUntilOnEventEditPage()
            .then(() => {
                var callback = this.eventPageClickSaveButton.bind(this);
                this.moveEventToMoveToDate(callback);
            });

        // Update move-to date.
        } else if (character === 'j' || character === 'k') {
            setTimeout(() => {
                this.updateMoveToDate();
            }, 3000);
        }
    }

    waitUntilOnEventEditPage() {
        this.debug && console.log('waiting until on edit event page');
        return new Promise((resolve, reject) => {
            Promise.all([
                waitUntilElementExists('[aria-label="Start date"]'),
                waitUntilElementExists('[aria-label="End date"]'),
                waitUntilElementExists('[aria-label="Title"]'),
            ]).then(([
                startDateInput,
                endDateInput,
                eventTitleInput,
            ]) => {
                this.debug && console.log('now on edit event page');
                resolve([
                    startDateInput,
                    endDateInput,
                    eventTitleInput,
                ]);
            });
        });
    }

    updateCalendarEventTitle(
        label,  // from "data-label" (index 0; 0, 1, ..., 6, 7, 8, 9).
        action, // from "data-action" (index 1; toggle-prefix, mark-completed, etc.).
        eventTitlePrefix, // e.g. "2." for label 2.
    ) {
        this.debug && console.log('updateCalendarEventTitle');
        this.debug && console.log('label: "%s"', label);
        this.debug && console.log('action: "%s"', action);
        this.debug && console.log('eventTitlePrefix: "%s"', eventTitlePrefix);

        this.clickEventBubbleEditButton();

        this.waitUntilOnEventEditPage()
        .then(([
            startDateInput,
            endDateInput,
            eventTitleInput,
        ]) => {

            var eventCompleted = this.COMPLETED_EVENT_TITLE_PREFIXES.includes(eventTitlePrefix);
            this.debug && console.log('eventCompleted:', eventCompleted);

            var originalCalendarEventTitle = eventTitleInput.value;
            this.debug && console.log('originalCalendarEventTitle:', originalCalendarEventTitle);

            // Format event date as a date or a date range.
            var eventDate;
            if (endDateInput.value !== startDateInput.value) {
                eventDate = startDateInput.value + ' - ' + endDateInput.value;
            } else {
                eventDate = startDateInput.value;
            }
            this.debug && console.log('eventDate:', eventDate);

            var date = new Date();
            var newCalendarEventTitle = this.moveToDate.getNewEventTitle(
                originalCalendarEventTitle,
                action,
                eventTitlePrefix,
                eventCompleted,
                eventDate,
                date,
            );

            // Update calendar event.
            eventTitleInput.focus();
            eventTitleInput.value = newCalendarEventTitle;

            setTimeout(() => {
                dispatchEvent(eventTitleInput, 'input');

                // Move event to the current move-to date if marked completed.
                if (eventCompleted) {
                    var callback = this.eventPageClickSaveButton.bind(this);
                    this.moveEventToMoveToDate(callback);
                } else {
                    this.eventPageClickSaveButton();
                }
            }, 200);
        });
    }

    handleButtonClick(event) {
        // console.log('target:', event.target);
        var action = event.target.getAttribute('data-action');
        if (action !== null) {
            var button = event.target;
            this.debug && console.log('button:', button);

            var buttonLabel = button.getAttribute('data-label');
            var eventTitlePrefix = this.BUTTON_LABEL_TO_EVENT_TITLE_PREFIX[buttonLabel];
            this.updateCalendarEventTitle(buttonLabel, action, eventTitlePrefix);
        }
    }

    handleClick(event) {
        this.lookForEventBubble();
        this.handleButtonClick(event);
    }

    handleMouseMove(event) {
        clearInterval(this.handleMouseMoveInterval);
        this.handleMouseMoveInterval = setTimeout(() => {
            this.lookForEventBubble();
        }, 100);
    }

    addEventListeners() {
        document.addEventListener('click', (event) => {
            this.handleClick(event);
        }, false);

        document.addEventListener('keydown', (event) => {
            this.handleKeyEvent(event);
        }, false);

        document.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });
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

    saveUserSettings() {
        this.debug && console.info('saveUserSettings');

        localStorage.setItem('settings', JSON.stringify({
            'manual': this.moveToDateRadioManual.checked,
            'seven': this.moveToDateRadioSeven.checked,
            'fourteen': this.moveToDateRadioFourteen.checked,
            'moveToDate': this.moveToDateInput.value,
        }));
    }

    restoreUserSettings() {
        this.debug && console.info('restoreUserSettings');

        var userSettings = localStorage.getItem('settings');
        if (userSettings !== null) {
            var parsedUserSettings = JSON.parse(userSettings);
            this.debug && console.log('existing user settings found:', parsedUserSettings);

            if (parsedUserSettings['manual']) {
                this.moveToDateRadioManual.click();
            }

            if (parsedUserSettings['seven']) {
                this.moveToDateRadioSeven.click();
            }

            if (parsedUserSettings['fourteen']) {
                this.moveToDateRadioFourteen.click();
            }

            this.moveToDateInput.value = parsedUserSettings['moveToDate'];
        }
    }

    addMoveToDateField() {
        this.debug && console.info('addMoveToDateField');

        var moveToDateContainer = document.createElement('div');
        moveToDateContainer.classList.add('_move-to-date-container');
        moveToDateContainer.style.position = 'absolute';
        moveToDateContainer.style.right = '165px';
        moveToDateContainer.style.top = '37px';
        moveToDateContainer.style.zIndex = '1000';

        var moveToDateRadioManual = document.createElement('input');
        moveToDateRadioManual.addEventListener('change', (event) => {
            this.updateMaxEventsPerCell(event.target.value);
            this.moveToDateInput.disabled = false;
            this.saveUserSettings();
        });
        moveToDateRadioManual.name = 'max-events-per-cell';
        moveToDateRadioManual.type = 'radio';
        moveToDateRadioManual.value = 'manual';
        var moveToDateRadioManualLabel = document.createElement('label');
        moveToDateRadioManualLabel.appendChild(moveToDateRadioManual);
        moveToDateRadioManualLabel.appendChild(document.createTextNode('Manual'));
        moveToDateContainer.appendChild(moveToDateRadioManualLabel);
        this.moveToDateRadioManual = moveToDateRadioManual;

        var moveToDateRadioSeven = document.createElement('input');
        moveToDateRadioSeven.addEventListener('change', (event) => {
            this.updateMaxEventsPerCell(event.target.value);
            this.moveToDateInput.disabled = true;
            this.saveUserSettings();
        });
        moveToDateRadioSeven.name = 'max-events-per-cell';
        moveToDateRadioSeven.type = 'radio';
        moveToDateRadioSeven.value = '7';
        var moveToDateRadioSevenLabel = document.createElement('label');
        moveToDateRadioSevenLabel.appendChild(moveToDateRadioSeven);
        moveToDateRadioSevenLabel.appendChild(document.createTextNode('7 Events'));
        moveToDateContainer.appendChild(moveToDateRadioSevenLabel);
        this.moveToDateRadioSeven = moveToDateRadioSeven;

        var moveToDateRadioFourteen = document.createElement('input');
        moveToDateRadioFourteen.addEventListener('change', (event) => {
            this.updateMaxEventsPerCell(event.target.value);
            this.moveToDateInput.disabled = true;
            this.saveUserSettings();
        });
        moveToDateRadioFourteen.checked = 'checked';
        moveToDateRadioFourteen.name = 'max-events-per-cell';
        moveToDateRadioFourteen.type = 'radio';
        moveToDateRadioFourteen.value = '14';
        var moveToDateRadioFourteenLabel = document.createElement('label');
        moveToDateRadioFourteenLabel.appendChild(moveToDateRadioFourteen);
        moveToDateRadioFourteenLabel.appendChild(document.createTextNode('14 Events'));
        moveToDateContainer.appendChild(moveToDateRadioFourteenLabel);
        this.moveToDateRadioFourteen = moveToDateRadioFourteen;

        var moveToDateInput = document.createElement('input');
        moveToDateInput.addEventListener('change', (event) => {
            this.saveUserSettings();
        });
        moveToDateInput.classList.add('_move-to-date-input');
        moveToDateInput.disabled = true;
        moveToDateInput.placeholder = 'Move-to Date';
        moveToDateInput.style.textAlign = 'center';
        moveToDateInput.type = 'date';
        moveToDateContainer.appendChild(moveToDateInput);
        this.moveToDateInput = moveToDateInput;

        document.body.appendChild(moveToDateContainer);
        this.debug && console.log('moveToDateContainer:', moveToDateContainer);
    }

    keepCurrentSelectorsUpdated() {
        this.debug && console.info('keepCurrentSelectorsUpdated');

        setInterval(() => {
            var currentDateNode = document.querySelector('.F262Ye');
            if (currentDateNode && currentDateNode !== this.currentDateNode) {
                this.currentDateNode && this.currentDateNode.classList.remove('_gcw-current-date');
                this.currentDateNode = currentDateNode.parentNode;
                this.currentDateNode.classList.add('_gcw-current-date');
            }
        }, 3000);
    }
}

new GoogleCalendarWorkflow({
    'debug': true,
});
