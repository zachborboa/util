function getCalendarEventsWithMetadata(calendarEvents) {
    console.group('getCalendarEventsWithMetadata');

    var priorityFound = false;
    var prioritySet = new Set();
    for (var i = 0; i < calendarEvents.length; i++) {
        console.group('calendarEvent', i);

        var calendarEvent = calendarEvents[i];
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

        console.groupEnd();
    }

    var priorityLowest = false;
    var priorityNextLowest = false;
    if (prioritySet.size) {
        priorityLowest = Math.max(...prioritySet);
        priorityNextLowest = priorityLowest + 1;
    }

    var calendarEventMetadata = {
        'events': calendarEvents,
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
    if (calendarEvent['priority'] === null) {
        updatedEventPriority = 1;
        updatedEventTitle = updatedEventPriority + '. ' + updatedEventTitle;
    } else {
        updatedEventPriority = calendarEvent['priority'] + 1;
        updatedEventTitle = updatedEventPriority + '. ' + removeEventTitlePriority(updatedEventTitle);
    }

    console.groupEnd();
    return updatedEventTitle;
}

function getEventTitleWithPriority(calendarEvent, eventPriority) {
    console.group('getEventTitleWithPriority');
    console.log('calendarEvent:', calendarEvent);

    var updatedEventTitle;
    if (calendarEvent['priority'] === null) {
        updatedEventTitle = eventPriority + '. ' + calendarEvent.title;
    } else {
        updatedEventTitle = eventPriority + '. ' + removeEventTitlePriority(calendarEvent.title);
    }

    console.groupEnd();
    return updatedEventTitle;
}

function increaseEventPriority(targetEvent, calendarEvents) {
    console.group('increaseEventPriority');
    console.log('targetEvent:', targetEvent);
    console.log('events before:', calendarEvents);

    var calendarEventMetadata = getCalendarEventsWithMetadata(calendarEvents);

    var calendarEventChanges = [];
    if (calendarEventMetadata['priority_found'] === false) {
        calendarEventChanges.push({
            'event': targetEvent,
            'old_title': targetEvent.title,
            'new_title': getEventTitleWithIncreasedPriority(targetEvent),
        });

    } else if (calendarEventMetadata['priority_found'] === true && targetEvent['priority'] === null) {
        calendarEventChanges.push({
            'event': targetEvent,
            'old_title': targetEvent.title,
            'new_title': getEventTitleWithPriority(targetEvent, calendarEventMetadata['priority_next_lowest']),
        });

    } else if (calendarEventMetadata['priority_found'] === true && targetEvent['priority'] !== null) {
        calendarEventChanges.push({
            'event': targetEvent,
            'old_title': targetEvent.title,
            'new_title': getEventTitleWithPriority(targetEvent, targetEvent['priority'] - 1),
        });
        console.log('calendarEventChanges before:', calendarEventChanges);

        for (var i = 0; i < calendarEventMetadata['events'].length; i++) {
            console.log(i);
            var calendarEvent = calendarEventMetadata['events'][i];
            if (calendarEvent['id'] !== targetEvent['id'] && calendarEvent['priority'] !== null) {
                console.log('calendar event to change:', calendarEvent);

                var calendarEventChange = {
                    'event': calendarEvent,
                    'old_title': calendarEvent.title,
                    'new_title': getEventTitleWithPriority(calendarEvent, calendarEvent['priority'] + 1),
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

calendarEvents = increaseEventPriority(calendarEvent_doTheImportantThing, calendarEvents);
calendarEvents = increaseEventPriority(calendarEvent_doTheMostImportantThing, calendarEvents);
calendarEvents = increaseEventPriority(calendarEvent_doTheMostImportantThing, calendarEvents);
