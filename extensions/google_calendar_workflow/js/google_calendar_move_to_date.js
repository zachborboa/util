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

        // Fetch calendar year from url (e.g. 2019 in "https://calendar.google.com/calendar/r/customweek/2019/12/9" and
        // not 2020 using "(new Date()).getFullYear()").
        var calendarYear = window.location.toString().match(/calendar\/r\/[a-z]+\/(\d\d\d\d)\//)[1];

        this.debug && console.log('calendarYear:', calendarYear);
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

        this.debug && console.log('topCellDate:', this.topCellDate);
        return this.topCellDate;
    }

    setOption(option, value) {
        this.options[option] = value;
    }

    _getDateComparisonObject(date) {
        return new Date(date).getTime();
    }
}

if (typeof(window) === 'undefined') {
    module.exports = GoogleCalendarMoveToDate
}
