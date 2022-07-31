'use strict';

const TEST_ENV = 'TEST';
const PROD_ENV = 'PROD';

class GoogleCalendarWorkflow {
    // Maximum number of events to keep in a cell.
    #DEFAULT_MAX_EVENTS_PER_CELL = 14;

    // Oldest available cell date that has been found and should be used.
    topCellDate;

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
        this.env = options.env;

        this.debug = options.debug ? true : false;
        this.options.maxEventsPerCell = this.options.maxEventsPerCell || this.#DEFAULT_MAX_EVENTS_PER_CELL;

        this.buttonClickedData = {};
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

        setTimeout(() => {
            this.updateMoveToDate();
            this.restoreUserSettings();
        }, 5000);
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
        // Use date from input when in manual mode.
        if (this.options.maxEventsPerCell === 'manual') {
            this.topCellDate = this.moveToDateInput.value;
        } else {
            // Calculate if cell date is older than the current top cell date only when a top cell is found.
            var topCell = this.findTopCell(calendarGridRows);
            if (topCell !== undefined) {
                var cellDate = this.getCellDate(topCell);
                if (this.topCellDate === undefined) {
                    this.debug && console.log('using newly calculated cellDate:', cellDate);
                    this.topCellDate = cellDate;
                } else {
                    this.debug && console.log('comparing cellDate %s to current topCellDate %s', cellDate, this.topCellDate);
                    if (this._getDateComparisonObject(cellDate) < this._getDateComparisonObject(this.topCellDate)) {
                        this.debug && console.log('updating current topCellDate');
                        this.topCellDate = cellDate;
                    } else {
                        this.debug && console.log('keeping current topCellDate');
                    }
                }
            }
        }

        this.debug && console.log('topCellDate:', this.topCellDate);
        return this.topCellDate;
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
        this.debug && console.info('getNewEventTitle');
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

        var cellFound;
        outer_loop:
        for (var rowIndex = 0; rowIndex < calendarGridRows.length; rowIndex++) {
            this.debug && console.group('rowIndex:', rowIndex);

            var row = calendarGridRows[rowIndex];
            var rowCells = this.findCellsInRow(row);
            // Check right to left.
            for (var cellIndex = rowCells.length - 1; cellIndex >= 0; cellIndex--) {
                this.debug && console.log('cellIndex:', cellIndex);
                var cell = rowCells[cellIndex];
                this.debug && console.log('cell:', cell);

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

        this.debug && console.groupEnd();
        return cellFound;
    }

    findCellWithMinEvents(calendarGridRows, minMoveToDateFindString, maxMoveToDateFindString) {
        this.debug && console.group('findCellByDateStringEnding');

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
                this.debug && console.log('cellIndex:', cellIndex);
                var cell = rowCells[cellIndex];
                this.debug && console.log('cell:', cell);

                // Figure out which day or days have the fewest number of
                // events.
                var cellEventsFound = this.countEventsInCell(cell);
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

    moveEvents(
        moveFromDate,
        minMoveToDate,
        maxMoveToDate,
        calendarGridRows,
    ) {
        // Find row containing both min day and max day. Check top to bottom.
        this.debug && console.group('moveEvents');
        this.debug && console.log('moveFromDate: %s', moveFromDate);
        this.debug && console.log('minMoveToDate: %s', minMoveToDate);
        this.debug && console.log('maxMoveToDate: %s', maxMoveToDate);
        this.debug && console.log('calendarGridRows:', calendarGridRows);

        var moveFromDateFindString = ', ' + new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric'}).format(moveFromDate);
        this.debug && console.log('moveFromDateFindString: "%s"', moveFromDateFindString);
        var moveFromDateCell = this.findCellByDateStringEnding(calendarGridRows, moveFromDateFindString);
        this.debug && console.log('moveFromDateCell:', moveFromDateCell);

        var minMoveToDateFindString = ', ' + new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric'}).format(minMoveToDate);
        this.debug && console.log('minMoveToDateFindString: "%s"', minMoveToDateFindString);

        var maxMoveToDateFindString = ', ' + new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric'}).format(maxMoveToDate);
        this.debug && console.log('maxMoveToDateFindString: "%s"', maxMoveToDateFindString);

        var firstCellWithMinEvents = this.findCellWithMinEvents(calendarGridRows, minMoveToDateFindString, maxMoveToDateFindString);
        this.debug && console.log('firstCellWithMinEvents:', firstCellWithMinEvents);

        this.debug && console.log('moveFromDate:', moveFromDate);
        var moveToDate = this.getCellDate(firstCellWithMinEvents);
        this.debug && console.log('moveToDate:', moveToDate);
        this.debug && console.log('moving events from this cell', moveFromDateCell, 'to this cell', firstCellWithMinEvents);

        // Edit event date of first event in source cell.
        var sourceEvent = moveFromDateCell.querySelector('[data-eventid]');
        if (!sourceEvent) {
            this.debug && console.log('source cell has no events');
            return;
        }

        console.log('sourceEvent:', sourceEvent);
        sourceEvent.click();

        waitUntilElementExists('[aria-label="Edit event"]')
        .then((editEventButton) => {
            editEventButton.click();
            console.log('edit event button clicked');

            this.waitUntilOnEventEditPage()
            .then(() => {
                console.log('on event edit page');
                console.log('ready to update event date');

                // var callback = this.eventPageClickSaveButton.bind(this);
                // this.moveEventToMoveToDate(moveToDate, callback);
            });
        });

        this.debug && console.groupEnd();
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
        return inputDate.toISOString().slice(0, 10);
    }

    // BEGIN class GoogleCalendarWorkflow.

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

    getCurrentMoveToDate() {
        this.debug && console.info('getCurrentMoveToDate');
        return this.moveToDateInput.value;
    }

    moveEventToMoveToDate(moveToDate, callback) {
        this.debug && console.info('moveEventToMoveToDate');
        this.debug && console.log('moveToDate:', moveToDate);

        var eventDateInputFormattedDate = this.getEventDateFormattedDate(moveToDate);

        Promise.all([
            waitUntilElementExists('[aria-label="Start date"]'),
            waitUntilElementExists('[aria-label="End date"]'),
            waitUntilElementExists('[aria-label="Title"]'),
        ]).then(([
            startDateInput,
            endDateInput,
            eventTitleInput,
        ]) => {

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
                var currentMoveToDate = this.getCurrentMoveToDate();
                if (currentMoveToDate === '') {
                    this.debug && console.warn('move to date empty');
                    return;
                }
                this.debug && console.log('moving event to', currentMoveToDate);

                var callback = this.eventPageClickSaveButton.bind(this);

                this.moveEventToMoveToDate(currentMoveToDate, callback);
            });

        // Update move-to date.
        } else if (character === 'j' || character === 'k') {
            setTimeout(() => {
                this.updateMoveToDate();
            }, 3000);

        // Clean up calendar events.
        } else if (character === 'f') {
            this.cleanUpEvents();
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
            var newCalendarEventTitle = this.getNewEventTitle(
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
                    var currentMoveToDate = this.getCurrentMoveToDate();
                    if (currentMoveToDate === '') {
                        this.debug && console.warn('move to date empty');
                        return;
                    }
                    this.debug && console.log('moving event to', currentMoveToDate);

                    var callback = this.eventPageClickSaveButton.bind(this);

                    this.moveEventToMoveToDate(currentMoveToDate, callback);
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
        }
    }

    updateMoveToDate(attempt) {
        if (this.env !== PROD_ENV) {
            return;
        }

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
        var topCellDate = this.getTopCellDate(calendarGridRows);
        if (topCellDate !== undefined) {
            this.moveToDateInput.value = this.getInputDateFormattedDate(topCellDate);
        }

        this.debug && console.groupEnd();
    }

    updateMaxEventsPerCell(maxEventsPerCell) {
        this.debug && console.info('updateMaxEventsPerCell');
        this.debug && console.log('maxEventsPerCell:', maxEventsPerCell);
        this.setOption('maxEventsPerCell', maxEventsPerCell);
        this.clearTopCellDate();
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
        if (this.env !== PROD_ENV) {
            return;
        }

        this.debug && console.info('restoreUserSettings');

        if (this.env !== PROD_ENV) {
            return;
        }

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

        if (this.env !== PROD_ENV) {
            return;
        }

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

        var currentMoveToDate = this.getCurrentMoveToDate();
        if (currentMoveToDate === '') {
            this.debug && console.warn('move to date empty');
            return;
        }

        var moveFromDate = new Date(currentMoveToDate + ' 00:00:00');
        console.log('moveFromDate:', moveFromDate);

        var maxMoveToDate = new Date(currentMoveToDate + ' 00:00:00');
        maxMoveToDate.setDate(maxMoveToDate.getDate() - 7);
        console.log('maxMoveToDate:', maxMoveToDate);

        var minMoveToDate = new Date(currentMoveToDate + ' 00:00:00');
        minMoveToDate.setDate(minMoveToDate.getDate() - (7 + 6));
        console.log('minMoveToDate:', minMoveToDate);

        var calendarGridRows = document.querySelectorAll('[data-view-heading] [role="presentation"] [role="row"]');
        this.moveEvents(
            moveFromDate,
            minMoveToDate,
            maxMoveToDate,
            calendarGridRows,
        );
    }

    _getDateComparisonObject(date) {
        return new Date(date).getTime();
    }
}

if (typeof(window) === 'undefined') {
    module.exports = GoogleCalendarWorkflow
} else {
    new GoogleCalendarWorkflow({
        'debug': true,
        'env': PROD_ENV,
    });
}
