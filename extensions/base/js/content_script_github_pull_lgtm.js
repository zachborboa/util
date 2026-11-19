// Add an LGTM button beside the Submit review button on a pull request's changes page, approving with an LGTM comment in one click.
const LGTM_BUTTON_ID = 'base-github-pull-lgtm-button';
const LGTM_COMMENT = 'LGTM';
const SUBMIT_REVIEW_TEXT = 'Submit review';

// Give up on the review dialog after this long; it opens well under a second when GitHub is healthy.
const DIALOG_TIMEOUT_MS = 5000;

// Match the changes page only; this script also loads on the other pull request tabs so it survives GitHub's in-page navigation.
function isChangesPage() {
    return /^\/[^/]+\/[^/]+\/pull\/\d+\/changes/.test(location.pathname);
}

// List the innermost elements carrying text, each one a label; React may split a label's text across several text nodes.
function findLabelElements(root) {
    const labelElements = [];
    for (const element of [root, ...root.querySelectorAll('*')]) {
        if (element.childElementCount === 0 && element.textContent.trim() !== '') {
            labelElements.push(element);
        }
    }
    return labelElements;
}

// Find a button by one of its labels, since GitHub's generated class names change between deploys.
// Match a single label rather than the whole text: GitHub renders a wide and a narrow label in one button and hides one with CSS.
function findButtonByText(root, text) {
    for (const button of root.querySelectorAll('button')) {
        for (const labelElement of findLabelElements(button)) {
            if (labelElement.textContent.trim() === text) {
                return button;
            }
        }
    }
    return null;
}

// Find the radio button with a label reading the given text; GitHub puts a description beside the option name in each label.
function findRadioByLabel(root, text) {
    for (const radio of root.querySelectorAll('input[type="radio"]')) {
        for (const label of radio.labels) {
            for (const labelElement of findLabelElements(label)) {
                if (labelElement.textContent.trim() === text) {
                    return radio;
                }
            }
        }
    }
    return null;
}

// Walk up from the Approve radio to the smallest container holding the whole review form.
function findReviewForm(approveRadio) {
    let node = approveRadio.parentElement;
    while (node !== null) {
        const hasTextarea = node.querySelector('textarea') !== null;
        const hasSubmitButton = findButtonByText(node, SUBMIT_REVIEW_TEXT) !== null;
        if (hasTextarea && hasSubmitButton) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}

function waitForApproveRadio() {
    return new Promise(function (resolve) {
        const startedAt = Date.now();
        const timer = setInterval(function () {
            const approveRadio = findRadioByLabel(document, 'Approve');
            if (approveRadio !== null) {
                clearInterval(timer);
                resolve(approveRadio);
            } else if (Date.now() - startedAt > DIALOG_TIMEOUT_MS) {
                clearInterval(timer);
                resolve(null);
            }
        }, 100);
    });
}

// Type into a React-controlled textarea through the native setter, so React's state sees the new value.
function setTextareaValue(textarea, value) {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    nativeSetter.call(textarea, value);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

// Look up Submit review at click time, since React may have replaced the button the LGTM button was cloned from.
async function approveWithLgtm() {
    findButtonByText(document, SUBMIT_REVIEW_TEXT).click();
    const approveRadio = await waitForApproveRadio();
    if (approveRadio === null) {
        console.warn('LGTM: review dialog never showed an Approve option');
        return;
    }
    // Leave the dialog open on a pull request GitHub won't let this user approve (their own), so they see why.
    else if (approveRadio.disabled) {
        console.warn('LGTM: Approve is disabled on this pull request');
        return;
    }

    const reviewForm = findReviewForm(approveRadio);
    if (reviewForm === null) {
        console.warn('LGTM: found no review form around the Approve option');
        return;
    }
    setTextareaValue(reviewForm.querySelector('textarea'), LGTM_COMMENT);
    approveRadio.click();
    findButtonByText(reviewForm, SUBMIT_REVIEW_TEXT).click();
}

// Clone the Submit review button so the LGTM button picks up GitHub's own styling.
function addLgtmButton() {
    if (!isChangesPage()) {
        return;
    } else if (document.getElementById(LGTM_BUTTON_ID) !== null) {
        return;
    }
    const submitReviewButton = findButtonByText(document, SUBMIT_REVIEW_TEXT);
    if (submitReviewButton === null) {
        return;
    }

    const lgtmButton = submitReviewButton.cloneNode(true);
    lgtmButton.id = LGTM_BUTTON_ID;
    lgtmButton.removeAttribute('aria-haspopup');
    lgtmButton.removeAttribute('aria-expanded');
    lgtmButton.removeAttribute('aria-controls');
    lgtmButton.removeAttribute('data-dd-action-name');
    lgtmButton.style.marginRight = '8px';
    lgtmButton.title = 'Approve with an LGTM comment';

    // Relabel every label, so the narrow-window one reads right too.
    for (const labelElement of findLabelElements(lgtmButton)) {
        labelElement.textContent = LGTM_COMMENT;
    }

    // Drop the dropdown arrow; the LGTM button acts on one click and opens no menu.
    for (const icon of lgtmButton.querySelectorAll('svg')) {
        icon.remove();
    }
    lgtmButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        approveWithLgtm();
    });
    submitReviewButton.before(lgtmButton);
}

// Re-add the button whenever GitHub's React rendering replaces the header or navigates between tabs.
new MutationObserver(addLgtmButton).observe(document.documentElement, {
    childList: true,
    subtree: true,
});
addLgtmButton();
