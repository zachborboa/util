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

function setInputValue(input, value) {
    console.group('setInputValue');
    console.log('input:', input);
    console.log('value:', value);
    return new Promise((resolve, reject) => {

        function checkInputValue() {
            // Focus input before checking if the input's value is the desired
            // value. The value might be updated when another input loses focus.
            input.focus();
            console.log('input focused');

            // Avoid resolving immediately even if input's value already matches.
            // Input's value may be changed shortly after checking due to a delayed
            // update.
            setTimeout(() => {
                if (input.value === value) {
                    console.log('value matches without updating');

                    setTimeout(() => {
                        console.log('checking value one more time');
                        if (input.value === value) {
                            console.log('value matches without updating. resolving.');
                            console.groupEnd();
                            resolve();
                        } else {
                            console.log('value no longer matches (desired value: "%s", current input value: "%s")', value, input.value);
                            checkInputValue();
                        }
                    }, 100);
                } else {
                    console.log('value does not match (desired value: "%s", current input value: "%s")', value, input.value);

                    input.value = value;
                    console.log('value set (current input value: "%s")', input.value);

                    setTimeout(() => {
                        dispatchEvent(input, 'input');
                        console.log('input event sent');

                        console.log('value is now "%s"', input.value);
                        checkInputValue();
                    }, 100);
                }
            }, 100);
        }

        checkInputValue();
    });
}

function waitUntilElementExists(selector, baseElement) {
    console.group('waitUntilElementExists:', selector);
    if (baseElement === undefined) {
        baseElement = document;
    }
    return new Promise((resolve, reject) => {
        var check = () => {
            var element = baseElement.querySelector(selector);
            if (element) {
                console.log('waitUntilElementExists.exists:', selector);
                console.groupEnd();
                resolve(element);
            } else {
                setTimeout(check, 10);
            }
        };
        setTimeout(check, 10);
    });
}

function waitUntilElementVisible(selector, baseElement) {
    console.group('waitUntilElementVisible:', selector);
    if (baseElement === undefined) {
        baseElement = document;
    }
    return new Promise((resolve, reject) => {
        waitUntilElementExists(selector, baseElement)
        .then((elementFound) => {
            var check = () => {
                if (isVisible(elementFound)) {
                    console.log('waitUntilElementVisible.found:', selector);
                    console.groupEnd();
                    resolve(elementFound);
                } else {
                    setTimeout(check, 100);
                }
            };
            setTimeout(check, 100);
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
            DEBUG && console.log('elementToClick clicked:', elementToClick);
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
                        DEBUG && console.log('elementToClick clicked:', elementToClick);
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
