function setInputValue(input, value) {
    console.info('setInputValue');
    console.log('input:', input);
    console.log('value:', value);
    return new Promise((resolve, reject) => {
        input.focus();
        console.log('focused');
        if (input.value === value) {
            console.log('value matches. resolving.');
            resolve();
            return;
        }

        console.log('value does not match (current value: "%s")', input.value);
        setTimeout(() => {
            if (input.value === value) {
                console.log('value now matches. resolving.');
                resolve();
                return;
            }

            input.value = value;
            console.log('value set (value="%s")', input.value);

            setTimeout(() => {
                dispatchEvent(input, 'input');
                console.log('input event sent');

                setTimeout(() => {
                    console.log('resolved');
                    resolve();
                }, 250);
            }, 250);
        }, 10);
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
