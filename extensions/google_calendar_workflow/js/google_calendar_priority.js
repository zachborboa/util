function getCalendarEventsWithMetadata(calendarEvents) {
    console.group('getCalendarEventsWithMetadata');

    var updatedCalendarEvents = [];
    var priorityFound = false;
    var prioritySet = new Set();
    for (var i = 0; i < calendarEvents.length; i++) {
        console.group('calendarEvent', i);

        var calendarEvent = {...calendarEvents[i]};
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

function removeEventTitlePriority(eventTitle) {
    console.group('removeEventTitlePriority');
    console.log('eventTitle:', eventTitle);
    var updatedEventTitle = eventTitle.replace(/^\d+\. /, '');
    console.log('updatedEventTitle:', updatedEventTitle);
    console.groupEnd();
    return updatedEventTitle;
}

function getEventTitleWithIncreasedPriority(calendarEvent) {
    console.group('getEventTitleWithIncreasedPriority');
    console.log('calendarEvent:', calendarEvent);

    var updatedEventTitle = calendarEvent.title;
    var updatedEventPriority;
    if (calendarEvent['priority'] === null || calendarEvent['priority'] === undefined) {
        updatedEventPriority = 1;
        updatedEventTitle = updatedEventPriority + '. ' + updatedEventTitle;
    } else {
        updatedEventPriority = calendarEvent['priority'] + 1;
        updatedEventTitle = updatedEventPriority + '. ' + removeEventTitlePriority(updatedEventTitle);
    }

    console.log('updatedEventTitle:', updatedEventTitle);
    console.groupEnd();
    return updatedEventTitle;
}

function getEventTitleWithPriority(calendarEvent, eventPriority) {
    console.group('getEventTitleWithPriority');
    console.log('calendarEvent:', calendarEvent);
    console.log('eventPriority:', eventPriority);

    var updatedEventTitle;
    if (calendarEvent['priority'] === null) {
        updatedEventTitle = eventPriority + '. ' + calendarEvent.title;
    } else {
        updatedEventTitle = eventPriority + '. ' + removeEventTitlePriority(calendarEvent.title);
    }

    console.log('updatedEventTitle:', updatedEventTitle);
    console.groupEnd();
    return updatedEventTitle;
}

function getEventPriority(targetEvent) {
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

function getEventById(targetEventId, calendarEvents) {
    console.info('getEventById');
    console.log('targetEventId:', targetEventId);
    console.log('calendarEvents:', calendarEvents);
    for (var i = 0; i < calendarEvents.length; i++) {
        var calendarEvent = calendarEvents[i];
        if (calendarEvent['id'] === targetEventId) {
            return calendarEvent;
        }
    }
}

function increaseEventPriority(targetEvent, calendarEvents) {
    console.group('increaseEventPriority');
    console.log('targetEvent:', targetEvent);
    targetEvent = getEventById(targetEvent['id'], calendarEvents);
    console.log('targetEvent:', targetEvent);
    console.log('targetEvent.priority:', targetEvent['priority']);
    console.log('events before:', calendarEvents);

    var calendarEventMetadata = getCalendarEventsWithMetadata(calendarEvents);
    console.log('priority_found:', calendarEventMetadata['priority_found']);

    var calendarEventChanges = [];
    if (calendarEventMetadata['priority_found'] === false) {
        calendarEventChanges.push({
            'event': targetEvent,
            'old_title': targetEvent.title,
            'new_title': getEventTitleWithIncreasedPriority(targetEvent),
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
            'new_title': getEventTitleWithPriority(targetEvent, calendarEventMetadata['priority_next_lowest']),
        });

    } else if (calendarEventMetadata['priority_found'] === true && targetEvent['priority'] !== null) {
        var eventPriority = getEventPriority(targetEvent);
        var updatedTargetEventPriority = eventPriority === null ? foo : eventPriority - 1;
        calendarEventChanges.push({
            'event': targetEvent,
            'old_title': targetEvent.title,
            'new_title': getEventTitleWithPriority(targetEvent, updatedTargetEventPriority),
        });
        console.log('calendarEventChanges before:', calendarEventChanges);

        for (var i = 0; i < calendarEventMetadata['events'].length; i++) {
            console.log(i);
            var calendarEvent = calendarEventMetadata['events'][i];
            if (calendarEvent['id'] !== targetEvent['id'] &&
                calendarEvent['priority'] !== null &&
                calendarEvent['priority'] >= updatedTargetEventPriority) {
                console.log('calendar event to change:', calendarEvent);

                var calendarEventChange = {
                    'event': calendarEvent,
                    'old_title': calendarEvent.title,
                    'new_title': getEventTitleWithPriority(calendarEvent, calendarEvent['priority'] + 1),
                    //'new_title': getEventTitleWithPriority(calendarEvent, calendarEvent['priority'] - 1),
                };
                console.log('calendarEventChange:', calendarEventChange);
                calendarEventChanges.push(calendarEventChange);
            }
        }

    } else {
        console.error('unhandled case');
    }

    console.log('calendarEventChanges:', calendarEventChanges);

    for (var i = 0; i < calendarEventChanges.length; i++) {
        console.group('calendarEventChange', i);

        var calendarEventChange = calendarEventChanges[i];
        console.log('calendarEventChange:', calendarEventChange);

        for (var j = 0; j < calendarEventMetadata['events'].length; j++) {
            console.log(j);
            var calendarEvent = calendarEventMetadata['events'][j];
            if (calendarEvent.id === calendarEventChange.event.id) {
                console.log('calendarEvent before:', calendarEvent);
                calendarEvent['title'] = calendarEventChange['new_title'];
                console.log('calendarEvent after:', calendarEvent);

                calendarEvents[j] = calendarEvent;
            }
        }

        console.groupEnd();
    }

    console.log('events after:', calendarEvents);

    calendarEventMetadata = getCalendarEventsWithMetadata(calendarEvents);
    calendarEvents = calendarEventMetadata['events'];

    console.log('events after:', calendarEvents);

    console.groupEnd();
    return calendarEvents;
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

function getEvent(targetEvent, calendarEvents) {
    for (var i = 0; i < calendarEvents.length; i++) {
        var calendarEvent = calendarEvents[i];
        if (calendarEvent['id'] === targetEvent['id']) {
            return calendarEvent;
        }
    }
}

var allTestsPass = true;

calendarEvents = increaseEventPriority(calendarEvent_doTheImportantThing, calendarEvents);
allTestsPass = allTestsPass && getEvent(calendarEvent_doThing, calendarEvents)['priority'] === null;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheImportantThing, calendarEvents)['priority'] === 1;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheMostImportantThing, calendarEvents)['priority'] === null;

calendarEvents = increaseEventPriority(calendarEvent_doTheMostImportantThing, calendarEvents);
allTestsPass = allTestsPass && getEvent(calendarEvent_doThing, calendarEvents)['priority'] === null;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheImportantThing, calendarEvents)['priority'] === 1;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheMostImportantThing, calendarEvents)['priority'] === 2;

calendarEvents = increaseEventPriority(calendarEvent_doTheMostImportantThing, calendarEvents);
allTestsPass = allTestsPass && getEvent(calendarEvent_doThing, calendarEvents)['priority'] === null;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheImportantThing, calendarEvents)['priority'] === 2;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheMostImportantThing, calendarEvents)['priority'] === 1;

calendarEvents = increaseEventPriority(calendarEvent_doThing, calendarEvents);
allTestsPass = allTestsPass && getEvent(calendarEvent_doThing, calendarEvents)['priority'] === 3;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheImportantThing, calendarEvents)['priority'] === 2;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheMostImportantThing, calendarEvents)['priority'] === 1;

calendarEvents = increaseEventPriority(calendarEvent_doThing, calendarEvents);
allTestsPass = allTestsPass && getEvent(calendarEvent_doThing, calendarEvents)['priority'] === 2;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheImportantThing, calendarEvents)['priority'] === 3;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheMostImportantThing, calendarEvents)['priority'] === 1;

calendarEvents = increaseEventPriority(calendarEvent_doTheImportantThing, calendarEvents);
allTestsPass = allTestsPass && getEvent(calendarEvent_doThing, calendarEvents)['priority'] === 3;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheImportantThing, calendarEvents)['priority'] === 2;
allTestsPass = allTestsPass && getEvent(calendarEvent_doTheMostImportantThing, calendarEvents)['priority'] === 1;

calendarEvents = increaseEventPriority(calendarEvent_doTheMostImportantThing, calendarEvents);
// allTestsPass = allTestsPass && getEvent(calendarEvent_doThing, calendarEvents)['priority'] === 2;
// allTestsPass = allTestsPass && getEvent(calendarEvent_doTheImportantThing, calendarEvents)['priority'] === 1;
// allTestsPass = allTestsPass && getEvent(calendarEvent_doTheMostImportantThing, calendarEvents)['priority'] === 0;

console.log('\nallTestsPass:', allTestsPass);
