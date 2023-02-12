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

function waitUntilToastMessageDisappears() {
    DEBUG && console.group('waitUntilToastMessageDisappears');
    return new Promise((resolve, reject) => {
        waitUntilElementExists('.u1KZub', undefined, 3000)
        .then((elementFound) => {
            var check = () => {
                if (!isVisible(elementFound)) {
                    DEBUG && console.log('toast message has disappeared');
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

function isVisible(el) {
    return el && el.offsetParent !== null;
}

function clickElementAndWaitUntilElementExists(elementToClickSelector, elementToClickBase, selector) {
    DEBUG && console.group('clickElementAndWaitUntilElementExists');
    DEBUG && console.log('elementToClickSelector:', elementToClickSelector);
    DEBUG && console.log('selector:', selector);

    return new Promise((resolve, reject) => {
        // Amount of time can elapse before clicking element again.
        const clickAgainDelay = 5000;

        var elementToClick = elementToClickBase.querySelector(elementToClickSelector);
        if (elementToClick) {
            elementToClick.click();
            // DEBUG && console.log('elementToClick clicked:', elementToClick);
        } else {
            DEBUG && console.warn('elementToClick not found using selector:', elementToClickSelector);
        }

        var lastClickedTime = Date.now();

        const check = () => {
            var element = document.querySelector(selector);
            if (element) {
                DEBUG && console.log('element using selector "%s" found', selector);
                resolve(element);
                DEBUG && console.groupEnd();
            } else {
                const currentTime = Date.now();
                DEBUG && console.log(currentTime - lastClickedTime, currentTime - lastClickedTime > clickAgainDelay);

                if (currentTime - lastClickedTime > clickAgainDelay) {

                    var elementToClick = elementToClickBase.querySelector(elementToClickSelector);
                    if (elementToClick) {
                        elementToClick.click();
                        // DEBUG && console.log('elementToClick clicked:', elementToClick);
                    } else {
                        DEBUG && console.warn('elementToClick not found using selector:', elementToClickSelector);
                    }

                    lastClickedTime = currentTime;
                }

                setTimeout(check, 1000);
            }
        };
        setTimeout(check, 1000);
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
