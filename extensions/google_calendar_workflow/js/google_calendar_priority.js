class Workflow {
    constructor() {
        this.events = [];
    }

    setEvents(events) {
        this.events = events;
    }

    getEventById(targetEventId) {
        console.info('getEventById');
        console.log('targetEventId:', targetEventId);
        for (var i = 0; i < this.events.length; i++) {
            var calendarEvent = this.events[i];
            if (calendarEvent['id'] === targetEventId) {
                return calendarEvent;
            }
        }
    }

    getCalendarEventsWithMetadata() {
        console.group('getCalendarEventsWithMetadata');

        var updatedCalendarEvents = [];
        var priorityFound = false;
        var prioritySet = new Set();
        for (var i = 0; i < this.events.length; i++) {
            console.group('calendarEvent', i);

            var calendarEvent = {...this.events[i]};
            console.log('calendarEvent:', calendarEvent);

            var eventTitleIsNumbered = /^(?:\*\*\* )?(\d+)\. /.test(calendarEvent.title);
            console.log('eventTitleIsNumbered:', eventTitleIsNumbered);
            calendarEvent['is_numbered'] = eventTitleIsNumbered;

            var eventPriority = calendarEvent.title.match(/(\d+)\. /);
            // console.log('eventPriority: "%s"', eventPriority);
            if (eventPriority) {
                eventPriority = parseInt(eventPriority[1]);
                priorityFound = true;
                prioritySet.add(eventPriority);
            }
            calendarEvent['priority'] = eventPriority;

            updatedCalendarEvents.push(calendarEvent);
            console.groupEnd();
        }

        var priorityLowest = false;
        var priorityNextLowest = false;
        if (prioritySet.size) {
            priorityLowest = Math.max(...prioritySet);
            priorityNextLowest = priorityLowest + 1;
        }

        var calendarEventMetadata = {
            'events': updatedCalendarEvents,
            'priority_found': priorityFound,
            'priority_set': prioritySet,
            'priority_lowest': priorityLowest,
            'priority_next_lowest': priorityNextLowest,
        };
        console.log('calendarEventMetadata:', calendarEventMetadata);

        console.groupEnd();
        return calendarEventMetadata;
    }

    removeEventTitlePriority(eventTitle) {
        console.group('removeEventTitlePriority');
        console.log('eventTitle:', eventTitle);
        var updatedEventTitle = eventTitle.replace(/^\d+\. /, '');
        console.log('updatedEventTitle:', updatedEventTitle);
        console.groupEnd();
        return updatedEventTitle;
    }

    getEventTitleWithIncreasedPriority(calendarEvent) {
        console.group('getEventTitleWithIncreasedPriority');
        console.log('calendarEvent:', calendarEvent);

        var updatedEventTitle = calendarEvent.title;
        var updatedEventPriority;
        if (calendarEvent['priority'] === null || calendarEvent['priority'] === undefined) {
            updatedEventPriority = 1;
            updatedEventTitle = updatedEventPriority + '. ' + updatedEventTitle;
        } else {
            updatedEventPriority = calendarEvent['priority'] + 1;
            updatedEventTitle = updatedEventPriority + '. ' + this.removeEventTitlePriority(updatedEventTitle);
        }

        console.log('updatedEventTitle:', updatedEventTitle);
        console.groupEnd();
        return updatedEventTitle;
    }

    getEventPriority(targetEvent) {
        console.group('getEventPriority');
        console.log('targetEvent:', targetEvent);

        var eventPriority = null;
        var eventPriorityMatch = targetEvent.title.match(/(\d+)\. /);
        if (eventPriorityMatch) {
            eventPriority = parseInt(eventPriorityMatch[1]);
        }

        console.log('eventPriority:', eventPriority);
        return eventPriority;
    }

    getEventTitleWithPriority(calendarEvent, eventPriority) {
        console.group('getEventTitleWithPriority');
        console.log('calendarEvent:', calendarEvent);
        console.log('eventPriority:', eventPriority);

        var updatedEventTitle;
        if (calendarEvent['priority'] === null) {
            updatedEventTitle = eventPriority + '. ' + calendarEvent.title;
        } else {
            updatedEventTitle = eventPriority + '. ' + this.removeEventTitlePriority(calendarEvent.title);
        }

        console.log('updatedEventTitle:', updatedEventTitle);
        console.groupEnd();
        return updatedEventTitle;
    }

    increaseEventPriority(userTargetEvent) {
        console.group('increaseEventPriority');
        console.log('userTargetEvent:', userTargetEvent);

        var targetEvent = this.getEventById(userTargetEvent['id']);
        console.log('targetEvent:', targetEvent);
        console.log('targetEvent.priority:', targetEvent['priority']);

        var calendarEventMetadata = this.getCalendarEventsWithMetadata();
        console.log('priority_found:', calendarEventMetadata['priority_found']);

        var calendarEventChanges = [];
        if (calendarEventMetadata['priority_found'] === false) {
            calendarEventChanges.push({
                'event': targetEvent,
                'old_title': targetEvent.title,
                'new_title': this.getEventTitleWithIncreasedPriority(targetEvent),
            });

        } else if (
            calendarEventMetadata['priority_found'] === true &&
            (
                targetEvent['priority'] === null ||
                targetEvent['priority'] === undefined
            )) {
            calendarEventChanges.push({
                'event': targetEvent,
                'old_title': targetEvent.title,
                'new_title': this.getEventTitleWithPriority(targetEvent, calendarEventMetadata['priority_next_lowest']),
            });

        } else if (
            calendarEventMetadata['priority_found'] === true &&
            targetEvent['priority'] !== null) {

            var eventPriority = this.getEventPriority(targetEvent);
            var updatedTargetEventPriority = eventPriority === null ? FIXME : eventPriority - 1;
            calendarEventChanges.push({
                'event': targetEvent,
                'old_title': targetEvent.title,
                'new_title': this.getEventTitleWithPriority(targetEvent, updatedTargetEventPriority),
            });
            console.log('calendarEventChanges before:', calendarEventChanges);

            for (var i = 0; i < calendarEventMetadata['events'].length; i++) {
                var calendarEvent = calendarEventMetadata['events'][i];
                if (calendarEvent['id'] !== targetEvent['id']) {
                    console.log('found calendar event to change:', calendarEvent);

                    if (calendarEvent['priority'] !== null) {
                        if (calendarEvent['priority'] >= updatedTargetEventPriority) {
                            console.log('found calendar event has priority %s >= %s', calendarEvent['priority'], updatedTargetEventPriority);

                            var calendarEventChange = {
                                'event': calendarEvent,
                                'old_title': calendarEvent.title,
                                'new_title': this.getEventTitleWithPriority(calendarEvent, calendarEvent['priority'] + 1),
                                //'new_title': this.getEventTitleWithPriority(calendarEvent, calendarEvent['priority'] - 1),
                            };
                            console.log('calendarEventChange:', calendarEventChange);
                            calendarEventChanges.push(calendarEventChange);

                        } else {
                            console.log('found calendar event has OTHER priority %s', calendarEvent['priority']);
                        }
                    }
                }
            }

        } else {
            console.error('Error: unhandled case');
        }

        console.log('calendarEventChanges:', calendarEventChanges);

        for (var i = 0; i < calendarEventChanges.length; i++) {
            var calendarEventChange = calendarEventChanges[i];
            console.group('calendarEventChange %s:', i, calendarEventChange);

            for (var j = 0; j < this.events.length; j++) {
                // console.log('event index', j);
                var calendarEvent = this.events[j];
                if (calendarEvent.id === calendarEventChange.event.id) {
                    console.group('event index', j);

                    console.log('calendarEvent before:', calendarEvent);
                    calendarEvent['title'] = calendarEventChange['new_title'];
                    console.log('calendarEvent after:', calendarEvent);

                    console.groupEnd();
                }
            }

            console.groupEnd();
        }

        console.log('events after:', calendarEvents);

        calendarEventMetadata = this.getCalendarEventsWithMetadata();
        this.events = calendarEventMetadata['events'];

        console.log('events after:', this.events);

        console.groupEnd();
    }
}

var calendarEvent_doThing = {
    'id': '1',
    'title': 'Do thing',
};
var calendarEvent_doTheImportantThing = {
    'id': '2',
    'title': 'Do the important thing',
};
var calendarEvent_doTheMostImportantThing = {
    'id': '3',
    'title': 'Do the most important thing',
};

var calendarEvents = [
    calendarEvent_doThing,
    calendarEvent_doTheImportantThing,
    calendarEvent_doTheMostImportantThing,
];

var wf = new Workflow();
wf.setEvents(calendarEvents);

function diff(string_1, string_2) {
    const { spawnSync } = require('child_process');

    const command = 'diff';
    const args = [
        '--unified',
        `<(echo "${string_1}")`,
        `<(echo "${string_2}")`,
    ];
    const options = {
        'shell': '/bin/bash',
    };

    const diffResult = spawnSync(command, args, options);
    const diff = diffResult.stdout.toString();
    // console.log(diff);

    const diffHighlightResult = spawnSync('diff-highlight', [], { input: diff });
    const diffHighlight = diffHighlightResult.stdout.toString();
    // console.log(diffHighlight);

    const colorDiffResult = spawnSync('colordiff', [], { input: diffHighlight });
    const colorDiff = colorDiffResult.stdout.toString();
    console.log(colorDiff);
}

function doThingAndExpect(obj, funcName, args, expectations) {
    console.group('doThingAndExpect');

    var calendarEventsBefore = JSON.stringify(obj.events, null, 2);

    var fn = wf[funcName];
    fn.apply(wf, args);

    var calendarEventsAfter = JSON.stringify(obj.events, null, 2);

    // console.log(calendarEventsBefore);
    // console.log(calendarEventsAfter);

    diff(calendarEventsBefore, calendarEventsAfter);

    // console.log(expectations);

    var success = true;
    for (var i = 0; i < expectations.length; i++) {
        var expect = expectations[i];
        console.group('expect:', expect);

        var calendarEvent;
        for (var j = 0; j < obj.events.length; j++) {
            if (obj.events[j].id === expect.id) {
                calendarEvent = obj.events[j];
                // console.log('event found:', calendarEvent);
            }
        }

        for (var prop in expect) {
            if (expect[prop] !== calendarEvent[prop]) {
                console.log('FAIL: expect.' + prop + ' != ' + expect[prop]);
                success = false;

                console.log('funcName:', funcName);
                console.log('args:', args);
                console.log(calendarEvent);
                console.log(obj.events);
            } else {
                console.log('OK: expect.' + prop + ' = ' + expect[prop]);
            }
        }

        console.groupEnd();
    }

    console.groupEnd();

    return success;
}

var allTestsPass = true;

allTestsPass = allTestsPass && doThingAndExpect(
    wf,
    'increaseEventPriority',
    [
        calendarEvent_doTheImportantThing,
    ],
    [
        {
            'id': calendarEvent_doThing.id,
            'title': 'Do thing',
            'is_numbered': false,
            'priority': null,
        },
        {
            'id': calendarEvent_doTheImportantThing.id,
            'title': '1. Do the important thing',
            'is_numbered': true,
            'priority': 1,
        },
        {
            'id': calendarEvent_doTheMostImportantThing.id,
            'title': 'Do the most important thing',
            'is_numbered': false,
            'priority': null,
        },
    ],
);

allTestsPass = allTestsPass && doThingAndExpect(
    wf,
    'increaseEventPriority',
    [
        calendarEvent_doTheMostImportantThing,
    ],
    [
        {
            'id': calendarEvent_doThing.id,
            'title': 'Do thing',
            'is_numbered': false,
            'priority': null,
        },
        {
            'id': calendarEvent_doTheImportantThing.id,
            'title': '1. Do the important thing',
            'is_numbered': true,
            'priority': 1,
        },
        {
            'id': calendarEvent_doTheMostImportantThing.id,
            'title': '2. Do the most important thing',
            'is_numbered': true,
            'priority': 2,
        },
    ],
);

allTestsPass = allTestsPass && doThingAndExpect(
    wf,
    'increaseEventPriority',
    [
        calendarEvent_doTheMostImportantThing,
    ],
    [
        {
            'id': calendarEvent_doThing.id,
            'title': 'Do thing',
            'is_numbered': false,
            'priority': null,
        },
        {
            'id': calendarEvent_doTheImportantThing.id,
            'title': '2. Do the important thing',
            'is_numbered': true,
            'priority': 2,
        },
        {
            'id': calendarEvent_doTheMostImportantThing.id,
            'title': '1. Do the most important thing',
            'is_numbered': true,
            'priority': 1,
        },
    ],
);

allTestsPass = allTestsPass && doThingAndExpect(
    wf,
    'increaseEventPriority',
    [
        calendarEvent_doThing,
    ],
    [
        {
            'id': calendarEvent_doThing.id,
            'title': '3. Do thing',
            'is_numbered': true,
            'priority': 3,
        },
        {
            'id': calendarEvent_doTheImportantThing.id,
            'title': '2. Do the important thing',
            'is_numbered': true,
            'priority': 2,
        },
        {
            'id': calendarEvent_doTheMostImportantThing.id,
            'title': '1. Do the most important thing',
            'is_numbered': true,
            'priority': 1,
        },
    ],
);

allTestsPass = allTestsPass && doThingAndExpect(
    wf,
    'increaseEventPriority',
    [
        calendarEvent_doThing,
    ],
    [
        {
            'id': calendarEvent_doThing.id,
            'title': '2. Do thing',
            'is_numbered': true,
            'priority': 2,
        },
        {
            'id': calendarEvent_doTheImportantThing.id,
            'title': '3. Do the important thing',
            'is_numbered': true,
            'priority': 3,
        },
        {
            'id': calendarEvent_doTheMostImportantThing.id,
            'title': '1. Do the most important thing',
            'is_numbered': true,
            'priority': 1,
        },
    ],
);

allTestsPass = allTestsPass && doThingAndExpect(
    wf,
    'increaseEventPriority',
    [
        calendarEvent_doTheImportantThing,
    ],
    [
        {
            'id': calendarEvent_doThing.id,
            'title': '3. Do thing',
            'is_numbered': true,
            'priority': 3,
        },
        {
            'id': calendarEvent_doTheImportantThing.id,
            'title': '2. Do the important thing',
            'is_numbered': true,
            'priority': 2,
        },
        {
            'id': calendarEvent_doTheMostImportantThing.id,
            'title': '1. Do the most important thing',
            'is_numbered': true,
            'priority': 1,
        },
    ],
);

// TESTING:
// calendarEvents = increaseEventPriority(calendarEvent_doTheMostImportantThing, calendarEvents);
// calendarEvent_doThing, calendarEvents)['priority'] === 2;
// calendarEvent_doTheImportantThing, calendarEvents)['priority'] === 1;
// calendarEvent_doTheMostImportantThing, calendarEvents)['priority'] === 0;

console.log('\nallTestsPass:', allTestsPass);
