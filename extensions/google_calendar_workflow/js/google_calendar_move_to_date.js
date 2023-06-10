'use strict';

const DEBUG = true;

const TEST_ENV = 'TEST';
const PROD_ENV = 'PROD';

class Spinner {
    constructor(options) {
        this.options = options;
        this.env = options.env;

        this.spinnerNode = this.createSpinnerNode();
        this.hide();
    }

    createSpinnerNode() {
        // Fix "ReferenceError: document is not defined" when testing.
        if (typeof document === 'undefined') {
            global.document = {};
            global.document.createElement = (() => {
                return {
                    style: {},
                    classList: {
                        add: function () {},
                    },
                };
            });
        }

        var spinnerNode = document.createElement('div');
        spinnerNode.classList.add('gcw-spinner');
        return spinnerNode;
    }

    hide() {
        this.spinnerNode.style.opacity = '0';
    }

    show() {
        this.spinnerNode.style.opacity = '1';
    }
}

class GoogleCalendarWorkflow {
    // Maximum number of events to keep in a cell.
    #DEFAULT_MAX_EVENTS_PER_CELL = 14;

    // Oldest available cell date that has been found and should be used.
    topCellDate;

    editEventTimeout = -1;

    // List of recent characters pressed.
    recentCharacterKeysPressedBuffer = [];

    // Last time key was pressed.
    lastKeyTime = Date.now();

    // Amount of time can elapse before list of recent characters pressed is reset.
    keystrokeDelay = 1000;

    LABEL_AND_CHAR_TO_ACTION = {
        // button label, button action.
        '*': 'toggle-prefix',
        '-': 'toggle-prefix',
        '0': 'toggle-prefix',
        '1': 'toggle-prefix',
        '2': 'toggle-prefix',
        '3': 'toggle-prefix',
        '4': 'toggle-prefix',
        '5': 'toggle-prefix',
        '6': 'toggle-prefix',
        '7': 'toggle-prefix',
        '8': 'toggle-prefix',
        '9': 'toggle-prefix',
        'a': 'mark-completed', // awesome
        'd': 'mark-completed', // done
        'n': 'mark-completed', // nope
        'o': 'mark-completed', // ok
        'x': 'remove-prefix', // remove
        'X': 'remove-prefix', // remove
        'DONE': 'mark-completed', // done
        'NOPE': 'mark-completed', // nope
        'OKAY': 'mark-completed', // ok
        'AWESOME': 'mark-completed', // awesome
    };

    FIRST_ROW_BUTTONS = [
        // button label, button classes
        ['-', ['jfk-button', 'jfk-button-standard', 'button-dash']],
        ['0', ['jfk-button', 'jfk-button-standard', 'button-0']],
        ['1', ['jfk-button', 'jfk-button-standard', 'button-1']],
        ['2', ['jfk-button', 'jfk-button-standard', 'button-2']],
        ['3', ['jfk-button', 'jfk-button-standard', 'button-3']],
        ['4', ['jfk-button', 'jfk-button-standard', 'button-4']],
        ['5', ['jfk-button', 'jfk-button-standard', 'button-5']],
        ['X', ['jfk-button', 'jfk-button-standard', 'button-x']],
        ['*', ['jfk-button', 'jfk-button-standard', 'button-star']],
    ];

    SECOND_ROW_BUTTONS = [
        // button label, button classes
        ['DONE',    ['jfk-button', 'jfk-button-default',  'button-d']],
        ['NOPE',    ['jfk-button', 'jfk-button-standard', 'button-n']],
        ['OKAY',    ['jfk-button', 'jfk-button-standard', 'button-o']],
        ['AWESOME', ['jfk-button', 'jfk-button-standard', 'button-a']],
    ];

    BUTTON_LABEL_TO_EVENT_TITLE_PREFIX = {
        // button label, event title prefix
        '*': '*',
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
        'AWESOME': 'ツ', // awesome
        'DONE': '✓', // done
        'NOPE': '✗', // nope
        'OKAY': '▣', // ok
        'X': null, // remove
        'a': 'ツ', // awesome
        'd': '✓', // done
        'n': '✗', // nope
        'o': '▣', // ok
        'x': null, // remove
    };

    COMPLETED_EVENT_TITLE_PREFIXES = [
        '✓',
        '✗',
        '▣',
        'ツ',
    ];

    constructor(options) {
        this.options = options;
        this.env = options.env;

        this.debug = options.debug ? true : false;
        this.options.maxEventsPerCell = this.options.maxEventsPerCell || this.#DEFAULT_MAX_EVENTS_PER_CELL;

        this.buttonClickedData = {};
        this.findEventBubbleInterval;
        this.handleMouseMoveInterval;

        this.moveToDateRadioManual;
        this.moveToDateRadioSeven;
        this.moveToDateRadioFourteen;
        this.moveToDateInput;
        this.addMoveToDateField();

        this.addCustomViewSwitcher();

        this.spinner = this.addSpinner();

        this.currentDateNode;
        this.keepCurrentSelectorsUpdated();

        this.cleaningUpEvents = false;
        this.cleaningUpEventsCanceled = false;

        if (this.env === PROD_ENV) {
            setTimeout(() => {
                this.updateMoveToDate();
                this.restoreUserSettings();
                this.addEventListeners();
            }, 5000);
        }
    }

    findCellsInRow(row) {
        this.debug && console.info('findCellsInRow');
        // this.debug && console.log('row:', row);
        var rowCells;
        if (this.env === PROD_ENV) {
            rowCells = row.querySelectorAll('[role="gridcell"]');
        } else if (this.env === TEST_ENV) {
            rowCells = row;
        }
        // this.debug && console.log('rowCells:', rowCells);
        return rowCells;
    }

    countEventsInCell(cell) {
        // this.debug && console.info('countEventsInCell');
        // this.debug && console.log('cell:', cell);
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
        // this.debug && console.log('cellEventsFound:', cellEventsFound);
        return cellEventsFound;
    }

    getCellDate(cell) {
        this.debug && console.group('getCellDate');
        // this.debug && console.log('cell:', cell);
        var cellDate;
        if (this.env === PROD_ENV) {
            // "7 events, Thursday, October 17".
            var cellDescription = cell.querySelector('h2').innerText;

            // "October 17".
            var monthDate = cellDescription.match(/ events?, .*day, (.*?)$/)[1];
            this.debug && console.log('monthDate:', monthDate);

            // "Oct 17".
            monthDate = monthDate.substr(0, 3) + ' ' + monthDate.split(' ')[1];
            this.debug && console.log('monthDate:', monthDate);

            // "Oct 17, 2019".
            var monthDateYear = monthDate + ', ' + this.getCalendarYear();
            this.debug && console.log('monthDateYear:', monthDateYear);

            cellDate = monthDateYear;
        } else if (this.env === TEST_ENV) {
            var rowIndex = cell[0];
            var cellIndex = cell[1];
            cellDate = this.options.cellDates[rowIndex][cellIndex];
        }
        this.debug && console.log('cellDate:', cellDate);
        this.debug && console.groupEnd();
        return cellDate;
    }

    findTopCell(calendarGridRows) {
        // Find first top-right most cell in current view containing a non-full number of events.
        this.debug && console.group('findTopCell');
        // this.debug && console.log('calendarGridRows:', calendarGridRows);
        var topCell;

        // Check top to bottom.
        outer_loop:
        for (var rowIndex = 0; rowIndex < calendarGridRows.length; rowIndex++) {
            this.debug && console.group('rowIndex:', rowIndex);

            var row = calendarGridRows[rowIndex];
            // this.debug && console.log('row:', row);

            var rowCells = this.findCellsInRow(row);
            // Check right to left.
            for (var cellIndex = rowCells.length - 1; cellIndex >= 0; cellIndex--) {
                // this.debug && console.log('cellIndex:', cellIndex);
                var cell = rowCells[cellIndex];
                // this.debug && console.log('cell:', cell);

                var cellEventsFound = this.countEventsInCell(cell);

                if (this.env === PROD_ENV) {
                    cell = cell;
                } else if (this.env === TEST_ENV) {
                    cell = [rowIndex, cellIndex];
                }

                // Determine if current top cell should be cleared now that it has the maximum number of events per
                // cell.
                if (this.topCellDate !== undefined &&
                    cellEventsFound === this.options.maxEventsPerCell) {
                    var cellDate = this.getCellDate(cell);
                    if (cellDate === this.topCellDate) {
                        this.topCellDate = undefined;
                    }
                }

                if (cellEventsFound < this.options.maxEventsPerCell) {
                    topCell = cell;
                    this.debug && console.groupEnd();
                    break outer_loop;
                }
            }

            this.debug && console.groupEnd();
        }

        this.debug && console.log('topCell:', topCell);
        this.debug && console.groupEnd();
        return topCell;
    }

    getTopCellDate(calendarGridRows) {
        this.debug && console.info('getTopCellDate');
        var topCellDate;

        // Use date from input when in manual mode.
        if (this.moveToDateForm && this.moveToDateForm['max-events-per-cell'].value === 'manual') {
            this.debug && console.log('max events per cell is manual so using current move to date');
            topCellDate = this.getCurrentMoveToDate();
        } else {
            // Calculate if cell date is older than the current top cell date only when a top cell is found.
            var topCell = this.findTopCell(calendarGridRows);
            if (topCell !== undefined) {
                var cellDate = this.getCellDate(topCell);
                if (this.topCellDate === undefined) {
                    this.debug && console.log('using newly calculated cellDate:', cellDate);
                    topCellDate = cellDate;
                } else {
                    this.debug && console.log('comparing cellDate "%s" to current topCellDate "%s"', cellDate, this.topCellDate);
                    if (this._getDateComparisonObject(cellDate) < this._getDateComparisonObject(this.topCellDate)) {
                        this.debug && console.log('updating current topCellDate');
                        topCellDate = cellDate;
                    } else {
                        this.debug && console.log('keeping current topCellDate');
                        topCellDate = this.topCellDate;
                    }
                }
            }
        }

        this.debug && console.log('topCellDate: "%s"', topCellDate);
        return topCellDate;
    }

    getEventDateFormattedDate(dateString) {
        this.debug && console.info('getEventDateFormattedDate');
        this.debug && console.log('dateString:', dateString);

        // This function previously formatted a date from "2021-02-01" to
        // "Feb 1, 2021". This is no longer needed as the input field accepts
        // dates like "2021-02-01" and formats the date into something like
        // "Feb 1, 2021" when the input field loses focus.
        var eventDateFormatted = dateString;
        this.debug && console.log('eventDateFormatted:', eventDateFormatted);

        return eventDateFormatted;
    }

    getNewEventTitle(
        originalCalendarEventTitle,
        action,
        eventTitlePrefix,
        eventCompleted,
        eventDate,
        date,
    ) {
        this.debug && console.group('getNewEventTitle');
        this.debug && console.log('originalCalendarEventTitle: "%s"', originalCalendarEventTitle);
        this.debug && console.log('action:', action);
        this.debug && console.log('eventTitlePrefix:', eventTitlePrefix);
        this.debug && console.log('eventCompleted:', eventCompleted);
        this.debug && console.log('eventDate:', eventDate);
        this.debug && console.log('date:', date);

        var newCalendarEventTitle = originalCalendarEventTitle;

        var eventTitleStartsWithNumber = /^(\d+)\. /.test(originalCalendarEventTitle);
        this.debug && console.log('eventTitleStartsWithNumber:', eventTitleStartsWithNumber);

        var eventTitleIsNumbered = /^(?:\*\*\* )?(\d+)\. /.test(originalCalendarEventTitle);
        this.debug && console.log('eventTitleIsNumbered:', eventTitleIsNumbered);

        var eventTitleStartsWithPrefix = originalCalendarEventTitle.startsWith(eventTitlePrefix);
        this.debug && console.log('eventTitleStartsWithPrefix:', eventTitleStartsWithPrefix);

        var eventTitleStartsWithStarPrefix = originalCalendarEventTitle.startsWith('*** ');
        this.debug && console.log('eventTitleStartsWithStarPrefix:', eventTitleStartsWithStarPrefix);

        var originalEventTitlePrefix = originalCalendarEventTitle.match(/(\d+\.) /);
        originalEventTitlePrefix = originalEventTitlePrefix === null ? null : originalEventTitlePrefix[1];
        this.debug && console.log('originalEventTitlePrefix: "%s"', originalEventTitlePrefix);

        var replaceEventTitleNumber = eventTitlePrefix !== originalEventTitlePrefix;
        this.debug && console.log('replaceEventTitleNumber: %s', replaceEventTitleNumber);

        // "1. " + * -> "*** 1. "
        if (action === 'toggle-prefix' && eventTitlePrefix === '*' && eventTitleStartsWithNumber) {
            newCalendarEventTitle = '*** ' + newCalendarEventTitle;
        }

        // "" + * -> "*** "
        else if (action === 'toggle-prefix' && eventTitlePrefix === '*' && !eventTitleStartsWithStarPrefix) {
            newCalendarEventTitle = '*** ' + newCalendarEventTitle;
        }

        // "*** " + * -> ""
        else if (action === 'toggle-prefix' && eventTitlePrefix === '*' && eventTitleStartsWithStarPrefix) {
            newCalendarEventTitle = newCalendarEventTitle.replace(/^\*\*\* /, '');
        }

        // "*** 1. " + * -> "1. "
        else if (action === 'toggle-prefix' && eventTitlePrefix === '*' && eventTitleStartsWithStarPrefix && eventTitleIsNumbered) {
            newCalendarEventTitle = newCalendarEventTitle.replace(/^\*\*\* /, '');
        }

        // "*** - " + - -> "*** "
        else if (action === 'toggle-prefix' && eventTitlePrefix === '-' && eventTitleStartsWithStarPrefix && newCalendarEventTitle.match(/\*\*\* - /)) {
            newCalendarEventTitle = newCalendarEventTitle.replace(/^\*\*\* - /, '*** ');
        }

        // "*** " + - -> "- "
        else if (action === 'toggle-prefix' && eventTitlePrefix === '-' && eventTitleStartsWithStarPrefix && newCalendarEventTitle.match(/\*\*\* /)) {
            newCalendarEventTitle = newCalendarEventTitle.replace(/^\*\*\* /, '- ');
        }

        // "*** 1. " + 2. -> "*** 2. "
        else if (action === 'toggle-prefix' && eventTitleStartsWithStarPrefix && eventTitleIsNumbered && replaceEventTitleNumber) {
            newCalendarEventTitle = '*** ' + eventTitlePrefix + ' ' + newCalendarEventTitle.replace(/^\*\*\* \d+\. /, '');
        }

        // "*** 1. " + 1. -> "*** "
        else if (action === 'toggle-prefix' && eventTitleStartsWithStarPrefix && eventTitleIsNumbered) {
            newCalendarEventTitle = newCalendarEventTitle.replace(/^(\*\*\* )(\d+\.) /, '$1');
        }

        // "*** " + 1. -> "*** 1. "
        else if (action === 'toggle-prefix' && eventTitleStartsWithStarPrefix && !eventTitleIsNumbered) {
            newCalendarEventTitle = '*** ' + eventTitlePrefix + ' ' + newCalendarEventTitle.replace(/^\*\*\* /, '');
        }

        // "3. " + - -> ""
        else if (action === 'toggle-prefix' && eventTitlePrefix === '-' && eventTitleStartsWithNumber) {
            // Remove any existing leading number prefix (e.g. "1. " in "1. My Calendar Event").
            newCalendarEventTitle = newCalendarEventTitle.replace(/^\d+\. /, '');
        }

        else if (action === 'toggle-prefix' && eventTitleStartsWithPrefix) {
            // Remove existing prefix if it is the same prefix as the hotkey.
            newCalendarEventTitle = newCalendarEventTitle.substr((eventTitlePrefix + ' ').length);
        }

        // "2. " + 1. -> "1. "
        else if (action === 'toggle-prefix' && !eventTitleStartsWithPrefix) {
            // Remove leading ~ character.
            newCalendarEventTitle = newCalendarEventTitle.replace(/^~ /, '');

            // Replace prefix.
            newCalendarEventTitle = eventTitlePrefix + ' ' + newCalendarEventTitle.replace(/^\d+\. /, '');
        }

        // Remove leading "Tentative: " when event is marked done.
        if (eventTitlePrefix === '✓') {
            newCalendarEventTitle = newCalendarEventTitle.replace(/^Tentative: /, '');
        }

        // Remove "Tentative: " within event title when event is no longer
        // tentative.
        if (['✓', '▣', 'ツ'].includes(eventTitlePrefix)) {
            newCalendarEventTitle = newCalendarEventTitle.replace(/Tentative: /, '');
        }

        if (action === 'mark-completed' && eventTitlePrefix !== null) {
            // Append event title prefix.
            // "✓ My Event; Dec 31, 2015; event date: Jan 1, 2016"
            // "1. My Event"
            newCalendarEventTitle = eventTitlePrefix + ' ' + newCalendarEventTitle;
        }

        // Format today.
        var monthName = date.toLocaleString('en-us', { 'month': 'short' });
        var todayFormattedDate = monthName + ' ' + date.getDate() + ', ' + date.getFullYear();
        this.debug && console.log('todayFormattedDate:', todayFormattedDate);

        // Append today's date and the original calendar event date to
        // the new calendar event title when the event is marked
        // completed (done, nope, okay, awesome).
        if (eventCompleted) {
            newCalendarEventTitle += ';' +
                ' ' + todayFormattedDate + ';' +
                ' event date: ' + eventDate;
        }

        this.debug && console.log('newCalendarEventTitle: "%s"', newCalendarEventTitle);
        this.debug && console.groupEnd();

        return newCalendarEventTitle;
    }

    clearTopCellDate() {
        this.debug && console.info('clearTopCellDate');
        this.topCellDate = undefined;
    }

    getCellDateMatchString(cell) {
        this.debug && console.group('getCellDateMatchString');
        this.debug && console.log('cell:', cell);
    }

    findCellByDateStringEnding(calendarGridRows, dateStringEnding) {
        this.debug && console.group('findCellByDateStringEnding');
        this.debug && console.log('dateStringEnding:', dateStringEnding);
        this.debug && console.log('calendarGridRows.length:', calendarGridRows.length);

        var cellFound;
        outer_loop:
        for (var rowIndex = 0; rowIndex < calendarGridRows.length; rowIndex++) {
            this.debug && console.group('rowIndex:', rowIndex);

            var row = calendarGridRows[rowIndex];
            var rowCells = this.findCellsInRow(row);
            // Check right to left.
            for (var cellIndex = rowCells.length - 1; cellIndex >= 0; cellIndex--) {
                var cell = rowCells[cellIndex];
                this.debug && console.log('cell:', cell, 'cellIndex:', cellIndex);

                var cellDayNode = cell.querySelector('h2');
                if (cellDayNode.innerText.endsWith(dateStringEnding)) {
                    this.debug && console.log('found');
                    this.debug && console.groupEnd();
                    cellFound = cell;
                    break outer_loop;
                }
            }

            this.debug && console.groupEnd();
        }

        this.debug && console.log('cellFound:', cellFound);
        this.debug && console.groupEnd();
        return cellFound;
    }

    findCellWithMinEvents(calendarGridRows, minMoveToDateFindString, maxMoveToDateFindString) {
        this.debug && console.group('findCellWithMinEvents');

        var cellFound;
        var minEvents = null;
        var minMoveToDayFound = false;
        var maxMoveToDayFound = false;

        outer_loop:
        for (var rowIndex = 0; rowIndex < calendarGridRows.length; rowIndex++) {
            this.debug && console.group('rowIndex:', rowIndex);

            var row = calendarGridRows[rowIndex];
            var rowCells = this.findCellsInRow(row);
            // Check right to left.
            for (var cellIndex = rowCells.length - 1; cellIndex >= 0; cellIndex--) {
                var cell = rowCells[cellIndex];

                // Figure out which day or days have the fewest number of
                // events.
                var cellEventsFound = this.countEventsInCell(cell);

                this.debug && console.log('cell', cellIndex, cellEventsFound, cell);
                if (
                    (minEvents === null || cellEventsFound < minEvents) &&
                    !(minMoveToDayFound && maxMoveToDayFound)
                ) {
                    this.debug && console.log('updating cellFound');
                    minEvents = cellEventsFound;
                    cellFound = cell;
                    this.debug && console.log('cellFound:', cellFound);
                }

                var cellDayNode = cell.querySelector('h2');
                if (!minMoveToDayFound && cellDayNode.innerText.endsWith(minMoveToDateFindString)) {
                    this.debug && console.log('minMoveToDayFound');
                    minMoveToDayFound = true;
                } else if (!maxMoveToDayFound && cellDayNode.innerText.endsWith(maxMoveToDateFindString)) {
                    this.debug && console.log('maxMoveToDayFound');
                    maxMoveToDayFound = true;
                }

                if (minMoveToDayFound && maxMoveToDayFound) {
                    this.debug && console.log('minMoveToDayFound && maxMoveToDayFound');
                    this.debug && console.groupEnd();
                    break outer_loop;
                }
            }

            this.debug && console.groupEnd();
        }

        this.debug && console.groupEnd();
        return cellFound;
    }

    isOnCustomWeekPage() {
        return window.location.pathname.indexOf('/customweek/') !== -1 &&
            document.querySelector('[aria-label="Start date"]') === null &&
            document.querySelector('[aria-label="End date"]') === null &&
            document.querySelector('[aria-label="Title"]') === null;
    }

    clickEditRecurringEventDialogOptionThisEvent() {
        this.debug && console.log('clickEditRecurringEventDialogOptionThisEvent');
        var dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
            var dialogLabelledByIdentifier = dialog.getAttribute('aria-labelledby');
            if (dialogLabelledByIdentifier) {

                // Ensure that current dialog is "Edit recurring event".
                var dialogLabelledByNode = document.getElementById(dialogLabelledByIdentifier);
                if (dialogLabelledByNode && dialogLabelledByNode.innerText === 'Edit recurring event') {

                    // Remove option highlights.
                    dialog.querySelectorAll('[role="radiogroup"] [id^="label-"]').forEach(
                        node => node.removeAttribute('style')
                    );

                    // Ensure that the "This event" option is selected (and not
                    // the "This and following events" option or any other
                    // option).
                    var dialogRadioChecked = dialog.querySelector('[type="radio"]:checked');
                    if (dialogRadioChecked) {
                        var dialogRadioLabelledByIdentifier = dialogRadioChecked.getAttribute('aria-labelledby');
                        if (dialogRadioLabelledByIdentifier) {
                            var dialogRadioLabelledByNode = document.getElementById(dialogRadioLabelledByIdentifier);
                            dialogRadioLabelledByNode && this.debug && console.log('current selected option: "%s"', dialogRadioLabelledByNode.innerText);
                            if (dialogRadioLabelledByNode) {
                                if (dialogRadioLabelledByNode.innerText === 'This event') {
                                    console.log('OK - "This event" is selected');

                                    dialogRadioLabelledByNode.style.backgroundColor = 'lawngreen';
                                    dialogRadioLabelledByNode.style.outline = '1px dashed #333';

                                    // Click the "OK" button now that basic
                                    // checks have passed.
                                    var dialogButtons = dialog.querySelectorAll('[role="button"]');;
                                    var dialogOkButtons = Array.from(dialogButtons).filter(button => button.innerText === 'OK');
                                    if (dialogOkButtons.length !== 1) {
                                        alert('Error: Multiple "OK" buttons found');
                                    } else {
                                        var dialogOkButton = dialogOkButtons[0];
                                        dialogOkButton.click();
                                        console.log('ok button clicked:', dialogOkButton);
                                    }

                                } else {
                                    console.warn('FAIL - "This event" isn\'t selected yet');

                                    dialogRadioLabelledByNode.style.backgroundColor = 'red';
                                    dialogRadioLabelledByNode.style.outline = '1px dashed #333';
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    isEditRecurringEventDialogOpen() {
        var dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
            var dialogLabelledByIdentifier = dialog.getAttribute('aria-labelledby');
            if (dialogLabelledByIdentifier) {
                var dialogLabelledByNode = document.getElementById(dialogLabelledByIdentifier);
                if (dialogLabelledByNode && dialogLabelledByNode.innerText === 'Edit recurring event') {
                    this.debug && console.log('dialog open: "Edit recurring event"');
                    return true;
                }
            }
        }

        return false;
    }

    clickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk() {
        this.debug && console.log('clickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk');
        var dialog = document.querySelector('[role="dialog"]');
        if (dialog &&
            dialog.innerText === 'Are you sure?\n' +
            'You are about to make changes that will only be reflected on your own calendar.\n' +
            'Cancel\n' +
            'OK'
        ) {
            // Click the "OK" button now that basic checks have passed.
            var dialogButtons = dialog.querySelectorAll('[role="button"]');;
            var dialogOkButtons = Array.from(dialogButtons).filter(button => button.innerText === 'OK');
            if (dialogOkButtons.length !== 1) {
                alert('Error: Multiple "OK" buttons found');
            } else {
                var dialogOkButton = dialogOkButtons[0];
                dialogOkButton.click();
                console.log('ok button clicked:', dialogOkButton);
            }
        }
    }

    isAreYouSureDialogOpen() {
        var dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
            var dialogLabelledByIdentifier = dialog.getAttribute('aria-labelledby');
            if (dialogLabelledByIdentifier) {
                var dialogLabelledByNode = document.getElementById(dialogLabelledByIdentifier);
                if (dialogLabelledByNode && dialogLabelledByNode.innerText === 'Edit recurring event') {
                    this.debug && console.log('dialog open: "Edit recurring event"');
                    return true;
                }
            }
        }

        return false;
    }

    isAreYouSureChangesOnlyReflectedOnOwnCalendarDialogOpen() {
        var dialog = document.querySelector('[role="dialog"]');
        if (dialog &&
            dialog.innerText === 'Are you sure?\n' +
            'You are about to make changes that will only be reflected on your own calendar.\n' +
            'Cancel\n' +
            'OK'
        ) {
            return true;
        }

        return false;
    }

    waitUntilOnCustomWeekPage(
        autoClickEditRecurringEventDialogOptionThisEvent = false,
        autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk = false,
    ) {
        this.debug && console.group('waitUntilOnCustomWeekPage');
        this.debug && console.log('waitUntilOnCustomWeekPage.autoClickEditRecurringEventDialogOptionThisEvent:', autoClickEditRecurringEventDialogOptionThisEvent);
        this.debug && console.log('waitUntilOnCustomWeekPage.autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk:', autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk);
        return new Promise((resolve, reject) => {
            var checkCustomWeekPageInterval = setInterval(() => {
                if (this.isOnCustomWeekPage()) {
                    this.debug && console.log('waitUntilOnCustomWeekPage.isOnCustomWeekPage');
                    clearInterval(checkCustomWeekPageInterval);
                    this.debug && console.groupEnd();
                    resolve();
                } else if (autoClickEditRecurringEventDialogOptionThisEvent && this.isEditRecurringEventDialogOpen()) {
                    this.debug && console.log('waitUntilOnCustomWeekPage: autoClickEditRecurringEventDialogOptionThisEvent && isEditRecurringEventDialogOpen');
                    clearInterval(checkCustomWeekPageInterval);
                    this.clickEditRecurringEventDialogOptionThisEvent();
                    this.debug && console.groupEnd();
                    resolve();
                } else if (autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk && this.isAreYouSureChangesOnlyReflectedOnOwnCalendarDialogOpen()) {
                    this.debug && console.log('waitUntilOnCustomWeekPage: autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk && isAreYouSureDialogOpen');
                    clearInterval(checkCustomWeekPageInterval);
                    this.clickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk();
                    this.debug && console.groupEnd();
                    resolve();
                } else {
                    this.debug && console.log('waitUntilOnCustomWeekPage.else');
                }
            }, 200);
        });
    }

    updateSourceCell(cell) {
        this.debug && console.log('updateSourceCell', cell);

        document.querySelectorAll('div[role="gridcell"][style]').forEach(
            node => node.style.backgroundColor === 'lawngreen' && node.removeAttribute('style')
        );

        if (cell) {
            cell.style.backgroundColor = 'lawngreen';
            cell.style.outline = ' 4px solid limegreen';
        }
    }

    updateDestinationCell(cell) {
        this.debug && console.log('updateDestinationCell', cell);

        document.querySelectorAll('div[role="gridcell"][style]').forEach(
            node => node.style.backgroundColor === 'indianred' && node.removeAttribute('style')
        );

        if (cell) {
            cell.style.backgroundColor = 'indianred';
        }
    }

    waitUntilCalendarGridRows() {
        return new Promise((resolve, reject) => {
            waitUntilElementExists('[data-view-heading] [role="presentation"] [role="row"]')
            .then(() => {
                var calendarGridRows = document.querySelectorAll('[data-view-heading] [role="presentation"] [role="row"]');
                this.debug && console.log('calendarGridRows:', calendarGridRows);
                resolve(calendarGridRows);
            });
        });
    }

    checkToExit(condition, reject, message) {
        this.debug && console.info('checkToExit');

        if (condition) {
            this.debug && console.warn(message);
            reject();
            return true;
        }

        return false;
    }

    moveEvents(
        moveFromDate,
        minMoveToDate,
        maxMoveToDate,
    ) {
        return new Promise((resolve, reject) => {
            // Find row containing both min day and max day. Check top to bottom.
            this.debug && console.group('moveEvents');
            this.debug && console.log('moveFromDate: %s', moveFromDate);
            this.debug && console.log('minMoveToDate: %s', minMoveToDate);
            this.debug && console.log('maxMoveToDate: %s', maxMoveToDate);

            var moveFromDateFindString = ', ' + new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric'}).format(moveFromDate);
            this.debug && console.log('moveFromDateFindString: "%s"', moveFromDateFindString);

            var minMoveToDateFindString = ', ' + new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric'}).format(minMoveToDate);
            this.debug && console.log('minMoveToDateFindString: "%s"', minMoveToDateFindString);

            var maxMoveToDateFindString = ', ' + new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric'}).format(maxMoveToDate);
            this.debug && console.log('maxMoveToDateFindString: "%s"', maxMoveToDateFindString);

            var moveEvent = (() =>  {
                this.debug && console.log('moveEvent');

                if (this.checkToExit(this.cleaningUpEventsCanceled, reject, 'cleaning up events canceled')) {
                    this.cleaningUpEventsCanceled = false;
                    return;
                }

                this.waitUntilCalendarGridRows()
                .then((calendarGridRows) => {

                    var moveFromDateCell = this.findCellByDateStringEnding(calendarGridRows, moveFromDateFindString);
                    this.debug && console.log('moveFromDateCell:', moveFromDateCell);
                    if (!moveFromDateCell) {
                        this.debug && console.warn('move from date cell not found. looked for "%s"', moveFromDateFindString);
                        resolve();
                        return;
                    }
                    this.updateSourceCell(moveFromDateCell);

                    var firstCellWithMinEvents = this.findCellWithMinEvents(calendarGridRows, minMoveToDateFindString, maxMoveToDateFindString);
                    this.debug && console.log('firstCellWithMinEvents:', firstCellWithMinEvents);
                    this.updateDestinationCell(firstCellWithMinEvents);

                    var moveToDate = this.getCellDate(firstCellWithMinEvents);
                    this.debug && console.log('moving from %s to %s', moveFromDate, moveToDate);
                    this.debug && console.log('moving events from this cell', moveFromDateCell, 'to this cell', firstCellWithMinEvents);

                    // Click first event in cell so that the event popup
                    // appears. Sometimes the event disappears (moves) so check
                    // that it still exists.
                    var sourceEvent = moveFromDateCell.querySelector('[data-eventid]');
                    if (!sourceEvent) {
                        this.debug && console.log('no events found on source cell:', moveFromDateCell);
                        this.updateSourceCell();
                        this.updateDestinationCell();
                        resolve();
                        return;
                    }

                    // Edit event date of first event in source cell.
                    this.debug && console.log('clicking sourceEvent and waiting until edit event exists');
                    this.debug && console.log('sourceEvent:', sourceEvent);

                    // Click first calendar event in cell.
                    var calendarEvent = moveFromDateCell.querySelector('[data-eventid]');
                    this.debug && console.log('calendarEvent:', calendarEvent);
                    if (!calendarEvent) {
                        this.debug && console.log('no event found on source cell:', moveFromDateCell);
                        resolve();
                        return;
                    }

                    calendarEvent.click();
                    this.debug && console.log('calendar event clicked');

                    // Wait for the popup to appear with the "Edit event" button.
                    doThingUntilTrue(
                        () => {
                            var editEventButton = document.querySelector('[aria-label="Edit event"]');
                            this.debug && console.log('editEventButton:', editEventButton);
                            if (!editEventButton) {
                                this.debug && console.log('no edit event button found for calendar event:', calendarEvent);
                                return false;
                            } else {
                                this.debug && console.log('edit event button found for calendar event:', calendarEvent);

                                editEventButton.click();
                                this.debug && console.log('edit event button clicked');

                                return true;
                            }
                        },
                        5
                    )
                    .then(() => this.waitUntilOnEventEditPage())
                    .then(() => {
                        this.debug && console.log('ready to update event date');

                        var autoClickEditRecurringEventDialogOptionThisEvent = true;
                        var autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk = true;

                        this.moveEventToMoveToDate(moveToDate)
                        .then(() => this.eventPageClickSaveButton())
                        .then(() => this.waitUntilOnCustomWeekPage(
                            autoClickEditRecurringEventDialogOptionThisEvent,
                            autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk,
                        ))
                        .then(() => waitUntilEventHasMovedFromCell(sourceEvent, moveFromDateCell))
                        .then(() => {
                            // Try to move next source event to destination.
                            setTimeout(moveEvent, 100);
                        });
                    });

                });
            });
            moveEvent();

            this.debug && console.groupEnd();
        });
    }

    getCalendarYear() {
        this.debug && console.info('getCalendarYear');

        var pathname = window.location.toString();
        this.debug && console.log('pathname:', pathname);

        // Fetch calendar year from url. Don't use "(new Date()).getFullYear()"
        // as it leads to incorrect years.
        // (e.g. 2019 in urls
        // "https://calendar.google.com/calendar/r/customweek/2019/12/9" and
        // "https://calendar.google.com/calendar/u/0/r/customweek/2019/8/19"
        // ).
        var matchResult = pathname.match(/\/(\d\d\d\d)\//);
        var calendarYear;
        if (matchResult === null) {

            // Attempt to fetch calendar year from current page.
            var currentMonthAndYearNode = document.querySelector('.rSoRzd');
            if (currentMonthAndYearNode && currentMonthAndYearNode.innerText.match(/ (\d\d\d\d)$/)) {
                calendarYear = currentMonthAndYearNode.innerText.match(/ (\d\d\d\d)$/)[1];
            }

        } else {
            calendarYear = matchResult[1];
        }

        if (calendarYear) {
            this.debug && console.log('calendarYear:', calendarYear);
        } else {
            this.debug && console.warn('calendar year not found');
        }

        return calendarYear;
    }

    setOption(option, value) {
        this.options[option] = value;
    }

    getInputDateFormattedDate(date) {
        var inputDate = new Date(date);
        if (inputDate.toString() === 'Invalid Date') {
            this.debug && console.warn('invalid date: "%s"', date);
            return '';
        }
        return inputDate.toISOString().slice(0, 10);
    }

    insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    clickEventBubbleEditButton() {
        this.debug && console.group('clickEventBubbleEditButton');
        return new Promise((resolve, reject) => {
            var editEventButton = document.querySelector('[aria-label="Edit event"]');
            if (editEventButton) {
                editEventButton.click();
                this.debug && console.groupEnd();
                resolve(editEventButton);
            } else {
                this.debug && console.warn('editEventButton not found', editEventButton);
                this.debug && console.groupEnd();
            }
        });
    }

    clickEventBubbleOptionsDuplicate() {
        this.debug && console.group('clickEventBubbleOptionsDuplicate');

        return new Promise((resolve, reject) => {
            waitUntilElementVisible('[aria-label="Options"]')
            .then((optionsButton) => {
                optionsButton.click();
            })
            .then(() => {
                // Update: The aria-label attribute ([aria-label="Duplicate"])
                // seems to have disappeared so this no longer works:
                //   waitUntilElementVisible('[aria-label="Duplicate"]')
                return new Promise((resolve, reject) => {
                        var menus = document.querySelectorAll('[role="menu"]');
                        for (var i = 0; i < menus.length; i++) {
                            var menu = menus[i];
                            console.log(i, menu);
                            if (menu.innerText.indexOf('\nDuplicate\n') !== -1) {
                                var menuItems = menu.querySelectorAll('[role="menuitem"]');
                                for (var j = 0; j < menuItems.length; j++) {
                                    var menuItem = menuItems[j];
                                    if (menuItem.innerText === 'Duplicate') {
                                        resolve(menuItem);
                                        break;
                                    }
                                }

                                break;
                            }
                        }
                    })
                    // Add delay before simulating click on the duplicate
                    // option. Without the delay, it seems to not trigger the
                    // simulated click.
                    .then((duplicateEventOption) => {
                        this.debug && console.log('duplicate event option found:', duplicateEventOption);
                        return new Promise(resolve => {
                            this.debug && console.log('waiting');
                            setTimeout(() => {
                                this.debug && console.log('wait done');
                                resolve(duplicateEventOption);
                            }, 200);
                        });
                    })
                    .then((duplicateEventOption) => {
                        // Click using a "mousedown" event followed by a
                        // "mouseup" event as calling .click() on the object
                        // doesn't seem to trigger the click action to
                        // duplicate the event:
                        //   duplicateEventOption.click();

                        duplicateEventOption.dispatchEvent(
                            new Event('mousedown', {
                                'bubbles': true,
                            })
                        );

                        duplicateEventOption.dispatchEvent(
                            new Event('mouseup', {
                                'bubbles': true,
                            })
                        );

                        this.debug && console.log('duplicate event option clicked');
                    });
            })
            .then(() => {
                this.debug && console.log('finally resolving');
                resolve();
                this.debug && console.groupEnd();
            });
        });
    }

    getEventActionContainer() {
        var eventActionContainer = document.querySelector('.gcw-container');
        return eventActionContainer;
    }

    showEventActionContainer(eventActionContainer) {
        // this.debug && console.log('showEventActionContainer');
        eventActionContainer = eventActionContainer || this.getEventActionContainer();
        if (eventActionContainer) {
            eventActionContainer.style.display = '';
        }
    }

    hideEventActionContainer(eventActionContainer) {
        // this.debug && console.log('hideEventActionContainer');
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
        // this.debug && console.group('modify event bubble');

        attempt = attempt || 0;
        attempt += 1;
        // this.debug && console.log('attempt', attempt);

        if (attempt >= 5) {
            // this.debug && console.log('too many attempts');
            // this.debug && console.groupEnd();
            return;
        }

        var eventBubble = this.getEventBubble();
        if (!eventBubble) {
            // Hide event action buttons when there is no event bubble.
            this.hideEventActionContainer();

            setTimeout(() => {
                this.modifyEventBubble(attempt);
            }, 500);
            // this.debug && console.log('will try again soon');
            // this.debug && console.groupEnd();
            return;
        }

        var editEventButton = eventBubble.querySelector('[data-tooltip="Edit event"]');
        var eventEditable = editEventButton ? true : false;
        if (!eventEditable) {
            // this.debug && console.log('event not editable');
            // this.debug && console.groupEnd();
            return;
        }

        // this.debug && console.log('will modify event bubble');
        // this.debug && console.groupEnd();

        var eventActionContainer = this.getEventActionContainer();
        if (!eventActionContainer) {
            eventActionContainer = document.createElement('div');
            eventActionContainer.classList.add('gcw-container');
            // this.debug && console.log('new event bubble meta item:', eventActionContainer);

            var firstRowEventActions = document.createElement('div');
            for (var i in this.FIRST_ROW_BUTTONS) {
                var buttonLabel = this.FIRST_ROW_BUTTONS[i][0];
                var buttonAction = this.LABEL_AND_CHAR_TO_ACTION[buttonLabel];
                var buttonClassNames = this.FIRST_ROW_BUTTONS[i][1];
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
                var buttonAction = this.LABEL_AND_CHAR_TO_ACTION[buttonLabel];
                var buttonClassNames = this.SECOND_ROW_BUTTONS[i][1];
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
        this.debug && console.group('eventPageClickSaveButton');
        return new Promise((resolve, reject) => {
            waitUntilElementExists('[aria-label="Save"]')
            .then((saveButton) => {
                saveButton.click();
                this.debug && console.log('eventPageClickSaveButton: save button clicked');
                this.debug && console.groupEnd();
                resolve();
            });
        });
    }

    // TODO: Make this a promise.
    clickEventBubbleDeleteButton() {
        this.debug && console.info('clickEventBubbleDeleteButton');
        var deleteEventButton = document.querySelector('[aria-label="Delete event"]');
        this.debug && console.log('deleteEventButton:', deleteEventButton);
        deleteEventButton.click();
    }

    getCurrentMoveToDate() {
        this.debug && console.info('getCurrentMoveToDate');
        return this.moveToDateInput.value;
    }

    moveEventToMoveToDate(moveToDate) {
        this.debug && console.group('moveEventToMoveToDate');
        this.debug && console.log('moveToDate:', moveToDate);

        var eventDateInputFormattedDate = this.getEventDateFormattedDate(moveToDate);

        return new Promise((resolve, reject) => {
            this.waitUntilOnEventEditPage()
            .then(([
                startDateInput,
                endDateInput,
                eventTitleInput,
            ]) => {
                Promise.resolve()
                .then(() => setInputValue(startDateInput, eventDateInputFormattedDate))
                .then(() => setInputValue(endDateInput, eventDateInputFormattedDate))
                .then(() => eventTitleInput.focus())
                .then(() => {
                    this.debug && console.info('moveEventToMoveToDate all done');
                    this.debug && console.groupEnd();
                    resolve();
                });
            });
        });
    }

    handleKeyEvent(event) {
        // this.debug && console.info('handleKeyEvent');
        var character = event.key;
        // this.debug && console.log('character:', character);

        clearTimeout(this.editEventTimeout);

        if (event.getModifierState('CapsLock')) {
            this.debug && console.warn('caps lock is on');
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

        if (character === 'Escape') {
            this.debug && console.log('escape pressed. canceling');
            this.cleaningUpEventsCanceled = true;
            return;
        }

        // Only track a sequence of keystrokes when numeric keys are pressed.
        if ('0123456789'.indexOf(character) !== -1) {
            const currentTime = Date.now();

            // Reset list of recently pressed characters when enough time has
            // elapsed.
            if (currentTime - this.lastKeyTime > this.keystrokeDelay) {
                this.recentCharacterKeysPressedBuffer = [];
            }

            this.recentCharacterKeysPressedBuffer.push(character);
            this.lastKeyTime = currentTime;

            // console.log(this.recentCharacterKeysPressedBuffer);
            // console.log('"%s. "', this.recentCharacterKeysPressedBuffer.join(''));
        } else {
            // Reset list of recently pressed characters when a non-numeric key
            // is pressed.
            this.recentCharacterKeysPressedBuffer = [];
        }

        var eventBubble = this.getEventBubble();

        // Delete event.
        if (eventBubble && character === '#') {
            this.debug && console.log('delete event');
            this.clickEventBubbleDeleteButton();

        // Copy event (duplicate).
        } else if (eventBubble && character === 'c') {
            this.debug && console.log('copy event');
            this.clickEventBubbleOptionsDuplicate();

        // Move event.
        } else if (eventBubble && character === 'm') {
            this.debug && console.log('move event');
            this.clickEventBubbleEditButton()
            .then(() => this.waitUntilOnEventEditPage())
            .then(() => {
                var currentMoveToDate = this.getCurrentMoveToDate();
                if (currentMoveToDate === '') {
                    this.debug && console.warn('move to date empty');
                    alert('Error: Move to date empty');
                    return;
                }
                this.debug && console.log('moving event to', currentMoveToDate);

                this.moveEventToMoveToDate(currentMoveToDate)
                .then(() => this.eventPageClickSaveButton());
            });

        // Set calendar event prefix.
        } else if (eventBubble && this.recentCharacterKeysPressedBuffer.length) {
            this.debug && console.log('set calendar event prefix');
            event.preventDefault();

            var updateCalendarEventTitle = (
                ((label, action, eventTitlePrefix) => {
                    return (() => {
                        // console.log('timeout reached');
                        this.updateCalendarEventTitle(label, action, eventTitlePrefix);
                    });
                })(
                    character, // label
                    'toggle-prefix', // action
                    this.recentCharacterKeysPressedBuffer.join('') + '.', // eventTitlePrefix
                )
            );

            // Wait a bit for another key to be pressed when only 1 key has been
            // pressed.
            if (this.recentCharacterKeysPressedBuffer.length === 1) {
                this.editEventTimeout = setTimeout(updateCalendarEventTitle, 1000);

            // Otherwise, start updating calendar event without waiting for more
            // key presses.
            } else {
                updateCalendarEventTitle();
            }

        // Take requested action when event bubble is open and a keyboard shortcut matching the key pressed is found.
        } else if (eventBubble && character in this.LABEL_AND_CHAR_TO_ACTION) {
            event.preventDefault();
            this.doCharacterAction(character);

        // Update move-to date.
        } else if (character === 'j' || character === 'k') {
            this.debug && console.log('update move-to date');
            setTimeout(() => {
                this.updateMoveToDate();
            }, 3000);

        // Clean up calendar events.
        } else if (character === 'f') {
            this.debug && console.log('clean up calendar events');

            // Allow key press to take action when the focus is an
            // input that is a radio button.
            // <input type="radio" />
            if (event.target.nodeName === 'INPUT' &&
                event.target.hasAttribute('type') &&
                event.target.getAttribute('type') === 'radio') {
                this.debug && console.log('inside radio input. ok');

            // Ignore "f" key press when focus is inside an input element.
            // <input />
            } else if (event.target.nodeName === 'INPUT') {
                this.debug && console.log('inside other input type:', event.target.nodeName);
                return;
            }

            // Ignore "f" key press when focus is inside a textbox.
            // <div role="textbox" ...></div>
            if (event.target.getAttribute('role') === 'textbox') {
                this.debug && console.log('inside textbox');
                return;
            }

            // Ignore "f" key press when not on the custom week page.
            if (!this.isOnCustomWeekPage()) {
                this.debug && console.log('not on custom week page');
                return;
            }

            this.cleanUpEvents();

        // Decrease selected event day.
        } else if (character === 'ArrowLeft' && this.getEventBubble()) {
            this.debug && console.log('decrease selected event day; arrow key:', character);
            this.decreaseSelectedEventDay();

        // Increase/decrease selected event day.
        } else if (character === 'ArrowRight' && this.getEventBubble()) {
            this.debug && console.log('increase selected event day; arrow key:', character);
            this.increaseSelectedEventDay();

        } else {
            this.debug && console.log('other character:', character);
        }
    }

    waitUntilOnEventEditPage() {
        this.debug && console.log('waiting until on edit event page');
        return new Promise((resolve, reject) => {
            Promise.all([
                // Avoid checking if on edit event page using the url match
                // method as the url isn't reliably updated and will show the
                // previous url (e.g. /calendar/u/0/r/customweek/[...]) even
                // when the edit page is being shown.
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

    doCharacterAction(character) {
        this.debug && console.group('doCharacterAction');
        this.debug && console.log('character:', character);

        // Handle button click (e.g. for buttons *, -, 0, 1, 2, 3, 4, 5, 6, 7,
        // 8, 9, a, d, n, o, x).
        var label = character;
        var action = this.LABEL_AND_CHAR_TO_ACTION[character];
        var eventTitlePrefix = this.BUTTON_LABEL_TO_EVENT_TITLE_PREFIX[label];
        var autoClickEditRecurringEventDialogOptionThisEvent = true;
        var autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk = true;
        this.updateCalendarEventTitle(
            label,
            action,
            eventTitlePrefix,
            autoClickEditRecurringEventDialogOptionThisEvent,
            autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk,
        );

        this.debug && console.log('doCharacterAction done');
        this.debug && console.groupEnd();
    }

    // TODO: Make this a promise.
    updateCalendarEventTitle(
        label,  // from "data-label" (index 0; 0, 1, ..., 6, 7, 8, 9).
        action, // from "data-action" (index 1; toggle-prefix, mark-completed, etc.).
        eventTitlePrefix, // e.g. "2." for label 2.
        autoClickEditRecurringEventDialogOptionThisEvent = false,
        autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk = false,
    ) {
        this.debug && console.group('updateCalendarEventTitle');
        this.debug && console.log('label: "%s"', label);
        this.debug && console.log('action: "%s"', action);
        this.debug && console.log('eventTitlePrefix: "%s"', eventTitlePrefix);
        this.debug && console.log('autoClickEditRecurringEventDialogOptionThisEvent:', autoClickEditRecurringEventDialogOptionThisEvent);
        this.debug && console.log('autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk:', autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk);

        // For certain actions, automatically click the [OK] button when the
        // "This event" option is selected in the "Edit recurring event" dialog.
        // This will save the event changes for the individual recurring event
        // without affecting other recurring events in the series. Without this,
        // the modal will appear and everything is on pause until the modal is
        // acted upon.
        if (['mark-completed', 'remove-prefix', 'toggle-prefix'].includes(action) && !autoClickEditRecurringEventDialogOptionThisEvent) {
            autoClickEditRecurringEventDialogOptionThisEvent = true;
            this.debug && console.log('autoClickEditRecurringEventDialogOptionThisEvent is now:', autoClickEditRecurringEventDialogOptionThisEvent);
        }

        // Ensure move-to-date is set before attempting to mark event completed.
        if (action === 'mark-completed') {
            var currentMoveToDate = this.getCurrentMoveToDate();
            if (currentMoveToDate === '') {
                this.debug && console.warn('move to date empty');
                alert('Error: Move to date empty');
                this.debug && console.groupEnd();
                return;
            }
        }

        this.clickEventBubbleEditButton()
        .then(() => this.waitUntilOnEventEditPage())
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
            var newCalendarEventTitle = this.getNewEventTitle(
                originalCalendarEventTitle,
                action,
                eventTitlePrefix,
                eventCompleted,
                eventDate,
                date,
            );

            // Update calendar event.
            Promise.resolve()
            .then(() => setInputValue(eventTitleInput, newCalendarEventTitle))
            .then(() => {
                // Move event to the current move-to date if marked completed.
                if (eventCompleted) {
                    var currentMoveToDate = this.getCurrentMoveToDate();
                    if (currentMoveToDate === '') {
                        this.debug && console.warn('move to date empty');
                        alert('Error: Move to date empty');
                        return;
                    }
                    this.debug && console.log('moving event to', currentMoveToDate);

                    this.moveEventToMoveToDate(currentMoveToDate)
                    .then(() => this.eventPageClickSaveButton())
                    .then(() => this.waitUntilOnCustomWeekPage(
                        autoClickEditRecurringEventDialogOptionThisEvent,
                        autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk,
                    ))
                    .then(() => {
                        this.debug && console.log('updateCalendarEventTitle done (event completed)');
                        this.debug && console.groupEnd();
                    });

                } else {
                    Promise.resolve()
                    .then(() => this.eventPageClickSaveButton())
                    .then(() => this.waitUntilOnCustomWeekPage(
                        autoClickEditRecurringEventDialogOptionThisEvent,
                        autoClickAreYouSureChangesOnlyReflectedOnOwnCalendarOptionOk,
                    ))
                    .then(() => {
                        this.debug && console.log('updateCalendarEventTitle done (event not completed)');
                        this.debug && console.groupEnd();
                    });
                }
            });
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
        if (this.env === PROD_ENV) {
            document.addEventListener('click', (event) => {
                this.handleClick(event);
            }, false);

            document.addEventListener('keydown', (event) => {
                this.handleKeyEvent(event);
            }, false);

            document.addEventListener('mousemove', (event) => {
                this.handleMouseMove(event);
            });

            this.moveToDateRadioManual.addEventListener('change', (event) => {
                this.debug && console.log('moveToDateRadioManual changed');

                // Update move to date when empty.
                var currentMoveToDate = this.getCurrentMoveToDate();
                if (currentMoveToDate === '') {
                    this.updateMoveToDate();
                }

                this.updateMaxEventsPerCell(event.target.value);
                this.moveToDateInput.disabled = false;
                this.saveUserSettings();
            });

            this.moveToDateRadioSeven.addEventListener('change', (event) => {
                this.debug && console.log('moveToDateRadioSeven changed');
                this.updateMaxEventsPerCell(event.target.value);
                this.moveToDateInput.disabled = true;
                this.saveUserSettings();
            });

            this.moveToDateRadioFourteen.addEventListener('change', (event) => {
                this.debug && console.log('moveToDateRadioFourteen changed');
                this.updateMaxEventsPerCell(event.target.value);
                this.moveToDateInput.disabled = true;
                this.saveUserSettings();
            });

            this.moveToDateInput.addEventListener('change', (event) => {
                this.debug && console.log('moveToDateInput changed');
                this.saveUserSettings();
            });
        }
    }

    updateMoveToDate(attempt) {
        this.debug && console.group('updateMoveToDate');

        if (this.env !== PROD_ENV) {
            return;
        }

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
        var topCellDate = this.getTopCellDate(calendarGridRows);
        if (topCellDate !== undefined) {
            this.moveToDateInput.value = this.getInputDateFormattedDate(topCellDate);
            this.debug && console.log('moveToDateInput value is now: "%s"', this.moveToDateInput.value);
        }

        this.debug && console.groupEnd();
    }

    updateMaxEventsPerCell(maxEventsPerCell) {
        this.debug && console.group('updateMaxEventsPerCell');
        this.debug && console.log('maxEventsPerCell:', maxEventsPerCell);
        this.setOption('maxEventsPerCell', maxEventsPerCell);
        this.clearTopCellDate();
        this.updateMoveToDate();
        this.debug && console.groupEnd();
    }

    getUserSettings() {
        this.debug && console.group('getUserSettings');

        if (this.env !== PROD_ENV) {
            return;
        }

        var userSettings = localStorage.getItem('settings');
        var parsedUserSettings = {};
        if (userSettings !== null) {
            parsedUserSettings = JSON.parse(userSettings);
            this.debug && console.log('existing user settings found:', parsedUserSettings);
        } else {
            this.debug && console.log('existing user settings not found');

            // Set default settings.
            parsedUserSettings = {
                'manual': true,
                'seven': false,
                'fourteen': false,
            };
            this.debug && console.log('using default user settings');
        }

        this.debug && console.groupEnd();

        return parsedUserSettings;
    }

    saveUserSettings() {
        this.debug && console.group('saveUserSettings');

        var settings = this.getUserSettings();
        settings['manual'] = this.moveToDateRadioManual.checked;
        settings['seven'] = this.moveToDateRadioSeven.checked;
        settings['fourteen'] = this.moveToDateRadioFourteen.checked;

        if (this.moveToDateInput.value !== '') {
            this.debug && console.log('settings moveToDate:', settings['moveToDate']);
            settings['moveToDate'] = this.moveToDateInput.value;
            this.debug && console.log('settings moveToDate is now:', settings['moveToDate']);
        }

        this.debug && console.log('saving settings:', settings);
        localStorage.setItem('settings', JSON.stringify(settings));

        if (this.moveToDateInput.value === '' && settings['moveToDate'] === '') {
            alert('move to date value empty when saving');
        }

        this.debug && console.log('settings saved:', this.getUserSettings());
        this.debug && console.groupEnd();
    }

    restoreUserSettings() {
        this.debug && console.group('restoreUserSettings');

        if (this.env !== PROD_ENV) {
            return;
        }

        var parsedUserSettings = this.getUserSettings();
        if (parsedUserSettings !== null) {
            if (parsedUserSettings['manual']) {
                this.moveToDateForm['max-events-per-cell'].value = 'manual';
                this.moveToDateInput.disabled = false;
            }

            if (parsedUserSettings['seven']) {
                this.moveToDateForm['max-events-per-cell'].value = '7';
                this.moveToDateInput.disabled = true;
            }

            if (parsedUserSettings['fourteen']) {
                this.moveToDateForm['max-events-per-cell'].value = '14';
                this.moveToDateInput.disabled = true;
            }

            this.moveToDateInput.value = parsedUserSettings['moveToDate'];
            this.debug && console.log('moveToDateInput value is now: "%s"', this.moveToDateInput.value);

            if (this.moveToDateInput.value === '') {
                alert('move to date value empty when restoring settings');
            } else if (this.moveToDateInput.value === null) {
                alert('move to date value null when restoring settings');
            }
        }

        this.debug && console.groupEnd();
    }

    addMoveToDateField() {
        this.debug && console.info('addMoveToDateField');

        if (this.env !== PROD_ENV) {
            return;
        }

        var moveToDateForm = document.createElement('form');
        moveToDateForm.classList.add('_move-to-date-container');
        moveToDateForm.style.position = 'absolute';
        moveToDateForm.style.right = '165px';
        moveToDateForm.style.top = '37px';
        moveToDateForm.style.zIndex = '1000';
        this.moveToDateForm = moveToDateForm;

        var moveToDateRadioManual = document.createElement('input');
        moveToDateRadioManual.name = 'max-events-per-cell';
        moveToDateRadioManual.type = 'radio';
        moveToDateRadioManual.value = 'manual';
        var moveToDateRadioManualLabel = document.createElement('label');
        moveToDateRadioManualLabel.appendChild(moveToDateRadioManual);
        moveToDateRadioManualLabel.appendChild(document.createTextNode('Manual'));
        moveToDateForm.appendChild(moveToDateRadioManualLabel);
        this.moveToDateRadioManual = moveToDateRadioManual;

        var moveToDateRadioSeven = document.createElement('input');
        moveToDateRadioSeven.name = 'max-events-per-cell';
        moveToDateRadioSeven.type = 'radio';
        moveToDateRadioSeven.value = '7';
        var moveToDateRadioSevenLabel = document.createElement('label');
        moveToDateRadioSevenLabel.appendChild(moveToDateRadioSeven);
        moveToDateRadioSevenLabel.appendChild(document.createTextNode('7 Events'));
        moveToDateForm.appendChild(moveToDateRadioSevenLabel);
        this.moveToDateRadioSeven = moveToDateRadioSeven;

        var moveToDateRadioFourteen = document.createElement('input');
        moveToDateRadioFourteen.checked = 'checked';
        moveToDateRadioFourteen.name = 'max-events-per-cell';
        moveToDateRadioFourteen.type = 'radio';
        moveToDateRadioFourteen.value = '14';
        var moveToDateRadioFourteenLabel = document.createElement('label');
        moveToDateRadioFourteenLabel.appendChild(moveToDateRadioFourteen);
        moveToDateRadioFourteenLabel.appendChild(document.createTextNode('14 Events'));
        moveToDateForm.appendChild(moveToDateRadioFourteenLabel);
        this.moveToDateRadioFourteen = moveToDateRadioFourteen;

        var moveToDateInput = document.createElement('input');
        moveToDateInput.classList.add('_move-to-date-input');
        moveToDateInput.disabled = true;
        moveToDateInput.placeholder = 'Move-to Date';
        moveToDateInput.style.textAlign = 'center';
        moveToDateInput.type = 'date';
        moveToDateForm.appendChild(moveToDateInput);
        this.moveToDateInput = moveToDateInput;

        document.body.appendChild(moveToDateForm);
        this.debug && console.log('moveToDateForm:', moveToDateForm);
    }

    keepCurrentSelectorsUpdated() {
        this.debug && console.info('keepCurrentSelectorsUpdated');

        if (this.env !== PROD_ENV) {
            return;
        }

        setInterval(() => {
            var currentDateNode = document.querySelector('.F262Ye');
            if (currentDateNode && currentDateNode !== this.currentDateNode) {
                this.currentDateNode && this.currentDateNode.classList.remove('_gcw-current-date');
                this.currentDateNode = currentDateNode.parentNode;
                this.currentDateNode.classList.add('_gcw-current-date');
            }
        }, 3000);
    }

    cleanUpEvents() {
        // Move events from the current move-to date evenly across the previous
        // week.
        this.debug && console.info('cleanUpEvents');

        this.spinner.show();

        if (this.cleaningUpEvents) {
            this.debug && console.warn('already cleaning up events');
            this.spinner.hide();
            return;
        }

        var currentMoveToDate = this.getCurrentMoveToDate();
        if (currentMoveToDate === '') {
            this.debug && console.warn('move to date empty');
            alert('Error: Move to date empty');
            this.spinner.hide();
            return;
        }

        this.cleaningUpEvents = true;

        var moveFromDate = new Date(currentMoveToDate + ' 00:00:00');
        this.debug && console.log('moveFromDate:', moveFromDate);

        var maxMoveToDate = new Date(currentMoveToDate + ' 00:00:00');
        maxMoveToDate.setDate(maxMoveToDate.getDate() - 7);
        this.debug && console.log('maxMoveToDate:', maxMoveToDate);

        var minMoveToDate = new Date(currentMoveToDate + ' 00:00:00');
        minMoveToDate.setDate(minMoveToDate.getDate() - (7 + 6));
        this.debug && console.log('minMoveToDate:', minMoveToDate);

        this.moveEvents(
            moveFromDate,
            minMoveToDate,
            maxMoveToDate,
        ).then(() => {
            this.spinner.hide();
            this.cleaningUpEvents = false;
        });
    }

    addSpinner() {
        this.debug && console.info('addSpinner');
        var spinner = new Spinner({
            'env': this.env,
        });
        if (this.env === PROD_ENV) {
            document.body.appendChild(spinner.spinnerNode);
        }
        return spinner;
    }

    addOneDayToDate(dateObj) {
        dateObj.setDate(dateObj.getDate() + 1);
        return dateObj;
    }

    subtractOneDayToDate(dateObj) {
        dateObj.setDate(dateObj.getDate() - 1);
        return dateObj;
    }

    getDayFormatted(dateObj) {
        var dayFormatted = [
            dateObj.getFullYear(),
            [
                (parseInt(dateObj.getMonth().toString()) + 1).length === 1 ? '0' : '',
                (parseInt(dateObj.getMonth().toString()) + 1),
            ].join(''),
            [
                dateObj.getDate().toString().length === 1 ? '0' : '',
                dateObj.getDate().toString(),
            ].join(''),
        ].join('-');
        this.debug && console.log('dayFormatted:', dayFormatted);
        return dayFormatted;
    }

    getNextDayFormatted(dateObj) {
        this.debug && console.info('getNextDayFormatted:', dateObj);
        var nextDay = this.addOneDayToDate(dateObj);
        var nextDayFormatted = this.getDayFormatted(nextDay);
        this.debug && console.log('nextDayFormatted:', nextDayFormatted);
        return nextDayFormatted;
    }

    getPreviousDayFormatted(dateObj) {
        this.debug && console.info('getPreviousDayFormatted:', dateObj);
        var previousDay = this.subtractOneDayToDate(dateObj);
        var previousFormatted = this.getDayFormatted(previousDay);
        this.debug && console.log('previousFormatted:', previousFormatted);
        return previousFormatted;
    }

    decreaseSelectedEventDay() {
        this.debug && console.group('decreaseSelectedEventDay');
        this.changeSelectedEventDay('decrease');
        this.debug && console.groupEnd();
    }

    increaseSelectedEventDay() {
        this.debug && console.group('increaseSelectedEventDay');
        this.changeSelectedEventDay('increase');
        this.debug && console.groupEnd();
    }

    changeSelectedEventDay(direction) {
        this.debug && console.group('changeSelectedEventDay:', direction);
        this.clickEventBubbleEditButton()
        .then(() => this.waitUntilOnEventEditPage())
        .then(([
            startDateInput,
            endDateInput,
            eventTitleInput,
        ]) => {
            this.debug && console.log('on event edit page');
            this.debug && console.log('will change selected event day:', direction);

            var fn;
            if (direction === 'decrease') {
                fn = this.getPreviousDayFormatted;
            } else if (direction === 'increase') {
                fn = this.getNextDayFormatted;
            }
            // this.debug && console.log('fn:', fn);

            var startDateInputValue = startDateInput.value;
            this.debug && console.log('startDateInputValue:', startDateInputValue);

            var newStartDateInputValue = fn.call(this, new Date(startDateInputValue));
            this.debug && console.log('newStartDateInputValue:', newStartDateInputValue);

            var endDateInputValue = endDateInput.value;
            this.debug && console.log('endDateInputValue:', endDateInputValue);

            var newEndDateInputValue = fn.call(this, new Date(endDateInputValue));
            this.debug && console.log('newEndDateInputValue:', newEndDateInputValue);

            Promise.resolve()
            .then(() => setInputValue(startDateInput, newStartDateInputValue))
            .then(() => setInputValue(endDateInput, newEndDateInputValue))
            .then(() => eventTitleInput.focus())
            .then(() => {
                this.debug && console.log('done updating start and end dates');
                this.eventPageClickSaveButton();
            });
        });

        this.debug && console.groupEnd();
    }

    switchToWeeks(numberOfWeeks) {
        this.debug && console.info('switchToWeeks');
        this.debug && console.log('numberOfWeeks:', numberOfWeeks);

        waitUntilElementExists('button[aria-label="Settings menu"]')
        .then((settingsMenuButton) => {
            settingsMenuButton.click();

            waitUntilElementExists('ul[aria-label="Settings menu"]')
            .then((settingsMenu) => {
                this.debug && console.log('settingsMenu:', settingsMenu);
                var settingsMenuItems = Array.from(settingsMenu.querySelectorAll('[role="menuitem"]')).filter((item) => {
                    return item.innerText === 'Settings';
                });
                var settingsMenuItem = settingsMenuItems[0];
                this.debug && console.log('settingsMenuItem:', settingsMenuItem);

                triggerMouseEvent(settingsMenuItem, 'mousedown');
                triggerMouseEvent(settingsMenuItem, 'mouseup');
                this.debug && console.log('clicked settingsMenuItem');

                waitUntilElementExists('[aria-label="Set custom view"]')
                .then((setCustomViewListbox) => {
                    this.debug && console.log('setCustomViewListbox:', setCustomViewListbox);

                    var selectedSetCustomViewListbox = setCustomViewListbox.querySelector('[aria-selected="true"]');
                    selectedSetCustomViewListbox.click();

                    waitMilliseconds(500)
                    .then(() => {
                        var setCustomViewListboxTwoWeeks = setCustomViewListbox.querySelector('[aria-label="2 weeks"][role="option"]');
                        var setCustomViewListboxThreeWeeks = setCustomViewListbox.querySelector('[aria-label="3 weeks"][role="option"]');
                        var setCustomViewListboxFourWeeks = setCustomViewListbox.querySelector('[aria-label="4 weeks"][role="option"]');

                        if (numberOfWeeks === 2) {
                            setCustomViewListboxTwoWeeks.click();
                            this.debug && console.log('2 weeks clicked');
                        } else if (numberOfWeeks === 3) {
                            setCustomViewListboxThreeWeeks.click();
                            this.debug && console.log('3 weeks clicked');
                        } else if (numberOfWeeks === 4) {
                            setCustomViewListboxFourWeeks.click();
                            this.debug && console.log('4 weeks clicked');
                        } else {
                            this.debug && console.log('unexpected number of weeks');
                            return;
                        }

                        waitMilliseconds(500)
                        .then(() => {
                            var goBackButton = document.querySelector('[aria-label="Go back"]');
                            goBackButton.click();
                            this.debug && console.log('goBackButton clicked');
                        });
                    });
                });
            });
        });
    }

    addCustomViewSwitcher() {
        // Add buttons to switch number of weeks displayed in custom view.
        this.debug && console.info('addCustomViewSwitcher');

        if (this.env !== PROD_ENV) {
            return;
        }

        var customViewSwitcherContainer = document.createElement('div');
        customViewSwitcherContainer.classList.add('_custom-view-switcher');

        var switchToTwoWeeks = document.createElement('a');
        switchToTwoWeeks.innerText = '2 weeks';
        switchToTwoWeeks.onclick = (event) => {
            this.debug && console.log('switchToTwoWeeks clicked');
            event.preventDefault();
            this.switchToWeeks(2);
        };

        var switchToThreeWeeks = document.createElement('a');
        switchToThreeWeeks.innerText = '3 weeks';
        switchToThreeWeeks.onclick = (event) => {
            this.debug && console.log('switchToThreeWeeks clicked');
            event.preventDefault();
            this.switchToWeeks(3);
        };

        var switchToFourWeeks = document.createElement('a');
        switchToFourWeeks.innerText = '4 weeks';
        switchToFourWeeks.onclick = (event) => {
            this.debug && console.log('switchToFourWeeks clicked');
            event.preventDefault();
            this.switchToWeeks(4);
        };

        customViewSwitcherContainer.appendChild(switchToTwoWeeks);
        customViewSwitcherContainer.appendChild(switchToThreeWeeks);
        customViewSwitcherContainer.appendChild(switchToFourWeeks);
        this.debug && console.log('customViewSwitcherContainer:', customViewSwitcherContainer);
        document.body.appendChild(customViewSwitcherContainer);
    }

    _getDateComparisonObject(date) {
        return new Date(date).getTime();
    }
}

if (typeof(window) === 'undefined') {
    module.exports = GoogleCalendarWorkflow
} else {
    new GoogleCalendarWorkflow({
        'debug': DEBUG,
        'env': PROD_ENV,
    });
}
