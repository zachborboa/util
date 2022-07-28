const TEST_ENV = 'TEST';
const PROD_ENV = 'PROD';

class GoogleCalendarMoveToDate {
    // Maximum number of events to keep in a cell.
    #DEFAULT_MAX_EVENTS_PER_CELL = 14;

    // Oldest available cell date that has been found and should be used.
    topCellDate;

    constructor(options) {
        this.options = options;
        this.options.maxEventsPerCell = this.options.maxEventsPerCell || this.#DEFAULT_MAX_EVENTS_PER_CELL;
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

    clearTopCellDate() {
        this.debug && console.info('clearTopCellDate');
        this.topCellDate = undefined;
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
        this.debug && console.group('findTopCell');
        this.debug && console.log('cells:', cells);
        var topCell;

        // Check top to bottom.
        outer_loop:
        for (var rowIndex = 0; rowIndex < cells.length; rowIndex++) {
            this.debug && console.group('rowIndex:', rowIndex);

            var row = cells[rowIndex];
            this.debug && console.log('row:', row);

            var rowCells = this.findCellsInRow(row);
            // Check right to left.
            for (var cellIndex = rowCells.length - 1; cellIndex >= 0; cellIndex--) {
                this.debug && console.log('cellIndex:', cellIndex);
                var cell = rowCells[cellIndex];
                this.debug && console.log('cell:', cell);

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
                } else {
                    this.debug && console.log('ELSE');
                }
            }

            this.debug && console.groupEnd();
        }

        this.debug && console.log('topCell:', topCell);
        this.debug && console.groupEnd();
        return topCell;
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

    getCellDate(cell) {
        this.debug && console.info('getCellDate');
        this.debug && console.log('cell:', cell);
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
        return cellDate;
    }

    getTopCellDate(calendarGridRows) {
        this.debug && console.info('getTopCellDate');
        // Use date from input when in manual mode.
        if (this.options.maxEventsPerCell === 'manual') {
            var moveToDateInput = this.options.moveToDateInput;
            this.topCellDate = moveToDateInput.value;
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

    setOption(option, value) {
        this.options[option] = value;
    }

    getInputDateFormattedDate(date) {
        var inputDate = new Date(date);
        return inputDate.toISOString().slice(0, 10);
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

        else if (action === 'toggle-prefix' && !eventTitleStartsWithPrefix) {
            // Remove leading ~ character.
            newCalendarEventTitle = newCalendarEventTitle.replace(/^~ /, '');

            // Add chosen prefix.
            newCalendarEventTitle = eventTitlePrefix + ' ' + newCalendarEventTitle;
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

    _getDateComparisonObject(date) {
        return new Date(date).getTime();
    }
}

if (typeof(window) === 'undefined') {
    module.exports = GoogleCalendarMoveToDate
}
