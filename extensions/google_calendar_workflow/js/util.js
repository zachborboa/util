'use strict';

const TIMEOUT_MS = 100;

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

function checkInputValue(input, value, resolve) {
    // Focus input before checking if the input's value is the desired
    // value. The value might be updated when another input loses focus.
    input.focus();
    DEBUG && console.log('input focused');

    // Avoid resolving immediately even if input's value already matches.
    // Input's value may be changed shortly after checking due to a delayed
    // update.
    setTimeout(() => {
        if (input.value === value) {
            DEBUG && console.log('value matches without updating');

            setTimeout(() => {
                DEBUG && console.log('checking value one more time');
                if (input.value === value) {
                    DEBUG && console.log('value matches without updating. resolving.');
                    DEBUG && console.groupEnd();
                    resolve();
                } else {
                    DEBUG && console.log('value no longer matches (desired value: "%s", current input value: "%s")', value, input.value);
                    checkInputValue(input, value, resolve);
                }
            }, TIMEOUT_MS);
        } else {
            DEBUG && console.log('value does not match (desired value: "%s", current input value: "%s")', value, input.value);

            input.value = value;
            DEBUG && console.log('value set (current input value: "%s")', input.value);

            setTimeout(() => {
                dispatchEvent(input, 'input');

                // Focus input after setting value. Without focusing on the
                // input, the input value is set properly when updating either a
                // calendar event start date or an end date, but after the
                // [Save] button is clicked, it's as if nothing changed on the
                // form, the calendar event does not get updated, and the user
                // is brought back to the calendar view. Focus the input so that
                // the calendar event input value change is detected and the
                // calendar event is updated when the [Save] button is clicked.
                input.focus();
                dispatchEvent(input, 'focus');

                DEBUG && console.log('input event sent with focus');

                DEBUG && console.log('value is now "%s"', input.value);
                checkInputValue(input, value, resolve);
            }, TIMEOUT_MS);
        }
    }, TIMEOUT_MS);
}

function setInputValue(input, value) {
    DEBUG && console.group('setInputValue');
    // DEBUG && console.log('input:', input);
    DEBUG && console.log('value:', value);
    return new Promise((resolve, reject) => {
        checkInputValue(input, value, resolve);
    });
}

function waitUntilElementExists(selector, baseElement, timeoutMilliseconds) {
    DEBUG && console.group('waitUntilElementExists:', selector);
    if (baseElement === undefined) {
        baseElement = document;
    }
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        var check = () => {
            const currentTime = Date.now();
            if (currentTime - startTime > timeoutMilliseconds) {
                DEBUG && console.warn('element not found within allotted time');
                DEBUG && console.groupEnd();
                resolve();
            } else {
                var element = baseElement.querySelector(selector);
                if (element) {
                    DEBUG && console.log('waitUntilElementExists.exists:', selector);
                    DEBUG && console.groupEnd();
                    resolve(element);
                } else {
                    setTimeout(check, TIMEOUT_MS);
                }
            }
        };
        setTimeout(check, TIMEOUT_MS);
    });
}

function waitUntilElementVisible(selector, baseElement) {
    DEBUG && console.group('waitUntilElementVisible:', selector);
    if (baseElement === undefined) {
        baseElement = document;
    }
    return new Promise((resolve, reject) => {
        waitUntilElementExists(selector, baseElement)
        .then((elementFound) => {
            var check = () => {
                if (isVisible(elementFound)) {
                    DEBUG && console.log('waitUntilElementVisible.found:', selector);
                    DEBUG && console.groupEnd();
                    resolve(elementFound);
                } else {
                    setTimeout(check, TIMEOUT_MS);
                }
            };
            setTimeout(check, TIMEOUT_MS);
        });
    });
}

function waitUntilEventHasMovedFromCell(sourceEvent, cell) {
    DEBUG && console.group('waitUntilEventHasMovedFromCell');
    DEBUG && console.log('sourceEvent:', sourceEvent);
    DEBUG && console.log('cell:', cell);
    return new Promise((resolve, reject) => {
        var check = () => {

            DEBUG && console.log('cell:', cell);
            if (document.body.contains(cell)) {
                DEBUG && console.log('cell still found in body');
            } else {
                DEBUG && console.log('cell disappeared');
            }

            DEBUG && console.log('sourceEvent:', sourceEvent);
            if (document.body.contains(sourceEvent)) {
                DEBUG && console.log('sourceEvent still found in body');
            } else {
                DEBUG && console.log('sourceEvent disappeared');
            }

            if (!document.body.contains(sourceEvent)) {
                DEBUG && console.log('event has disappeared from document.body');
                DEBUG && console.groupEnd();
                resolve();
            } else if (!cell.contains(sourceEvent)) {
                DEBUG && console.log('event has moved from cell');
                DEBUG && console.groupEnd();
                resolve();
            } else {
                DEBUG && console.log('cell still contains event');
                setTimeout(check, TIMEOUT_MS);
            }
        };
        setTimeout(check, TIMEOUT_MS);
    });
}

function isVisible(el) {
    return el && el.offsetParent !== null;
}

function doThingUntilTrue(thingToDoUntilTrue, maxTimeToWaitSeconds) {
    DEBUG && console.group('doThingUntilTrue');
    DEBUG && console.log('maxTimeToWaitSeconds:', maxTimeToWaitSeconds);

    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        var thingToDoInterval = setInterval(() => {
            if (thingToDoUntilTrue()) {
                DEBUG && console.log('thingToDoUntilTrue() success!');
                clearInterval(thingToDoInterval);
                resolve();
                DEBUG && console.groupEnd();
            } else {
                DEBUG && console.log('thingToDoUntilTrue() not successful');

                var secondsElapsed = (Date.now() - startTime) / 1000;
                if (secondsElapsed > maxTimeToWaitSeconds) {
                    DEBUG && console.log('thingToDoUntilTrue() fail after seconds:', secondsElapsed);
                    clearInterval(thingToDoInterval);
                    reject();
                    DEBUG && console.groupEnd();
                }
            }
        }, 1000);
    });
}

function waitMilliseconds(milliseconds) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, milliseconds)
    });
}

function triggerMouseEvent(targetElement, eventType) {
    console.info('triggerMouseEvent');
    console.log('targetElement:', targetElement);
    console.log('eventType:', eventType);

    var event = new MouseEvent(eventType, {
        'view': window,
        'bubbles': true,
        'cancelable': true,
    });
    targetElement.dispatchEvent(event);
}
