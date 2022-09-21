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

        setTimeout(checkInputValue, 100);
    });
}

function waitUntilElementExists(selector, baseElement) {
    if (baseElement === undefined) {
        baseElement = document;
    }
    return new Promise((resolve, reject) => {
        var check = () => {
            var element = baseElement.querySelector(selector);
            if (element) {
                resolve(element);
            } else {
                setTimeout(check, 100);
            }
        };
        setTimeout(check, 100);
    });
}

function isVisible(obj) {
    return obj.offsetWidth > 0 && obj.offsetHeight > 0;
}
