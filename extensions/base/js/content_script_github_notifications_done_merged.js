// Add a button to GitHub's notifications page that marks every merged pull request's notification as done in one click.
const DONE_MERGED_BUTTON_ID = 'base-github-notifications-done-merged-button';
const DONE_MERGED_LABEL_CLASS = 'base-github-notifications-done-merged-label';

// Match the notifications page only; this script loads on all of GitHub so it survives GitHub's in-page navigation.
function isNotificationsPage() {
    return location.pathname === '/notifications';
}

// Tell merged rows by GitHub's merge icon, since the row carries no other merged marker.
function isMergedRow(row) {
    return row.querySelector('.octicon-git-merge') !== null;
}

function isArchivedRow(row) {
    return row.classList.contains('notification-archived');
}

// Skip rows already marked done: GitHub keeps them in the list, hidden, until its next re-render.
function isMergedNotDoneRow(row) {
    if (isArchivedRow(row)) {
        return false;
    }
    return isMergedRow(row);
}

function findMergedRows() {
    const mergedRows = [];
    for (const row of document.querySelectorAll('.js-notifications-list-item')) {
        if (isMergedNotDoneRow(row)) {
            mergedRows.push(row);
        }
    }
    return mergedRows;
}

// Select exactly the merged rows, then press GitHub's own Done for the selection, so GitHub archives and removes them as if done by hand.
function markMergedDone() {
    for (const row of document.querySelectorAll('.js-notifications-list-item')) {
        const checkbox = row.querySelector('.js-notification-bulk-action-check-item');

        // Click rather than set checked, so GitHub's selection count and toolbar follow along.
        if (checkbox.checked !== isMergedNotDoneRow(row)) {
            checkbox.click();
        }
    }
    const doneSelectedButton = document.querySelector(
        '.js-notifications-mark-selected-actions form[action="/notifications/beta/archive"] button[type="submit"]',
    );
    if (doneSelectedButton === null) {
        console.warn('Done merged: found no Done button for the selected notifications');
        return;
    }
    doneSelectedButton.click();
}

// Lead the label with a copy of a merged row's icon, so the button's icon matches the list's shape and purple.
function createDoneMergedButton(mergeIcon) {
    const icon = mergeIcon.cloneNode(true);
    icon.classList.add('mr-1');
    const label = document.createElement('span');
    label.className = DONE_MERGED_LABEL_CLASS;

    const doneMergedButton = document.createElement('button');
    doneMergedButton.id = DONE_MERGED_BUTTON_ID;
    doneMergedButton.type = 'button';
    doneMergedButton.className = 'btn btn-sm ml-3';
    doneMergedButton.title = 'Mark every merged pull request on this page as done';
    doneMergedButton.append(icon, label);
    doneMergedButton.addEventListener('click', markMergedDone);
    return doneMergedButton;
}

// Keep the count current and hide the button while no merged rows are listed; write only on change, since each write retriggers the observer.
function updateDoneMergedButton() {
    if (!isNotificationsPage()) {
        return;
    }
    const markAllActions = document.querySelector('.js-notifications-mark-all-actions');
    if (markAllActions === null) {
        return;
    }

    const mergedRows = findMergedRows();
    let doneMergedButton = document.getElementById(DONE_MERGED_BUTTON_ID);
    if (doneMergedButton === null) {
        // Wait for a merged row to copy the icon from; until one is listed the button would have nothing to do.
        if (mergedRows.length === 0) {
            return;
        }
        doneMergedButton = createDoneMergedButton(mergedRows[0].querySelector('.octicon-git-merge'));
        markAllActions.parentElement.append(doneMergedButton);
    }
    const mergedCount = mergedRows.length;
    const label = doneMergedButton.querySelector(`.${DONE_MERGED_LABEL_CLASS}`);
    const labelText = `Done merged (${mergedCount})`;
    if (label.textContent !== labelText) {
        label.textContent = labelText;
    }
    const hidden = mergedCount === 0;
    if (doneMergedButton.hidden !== hidden) {
        doneMergedButton.hidden = hidden;
    }
}

// Re-add the button whenever GitHub re-renders the list or navigates to the notifications page.
// Watch class changes too, since marking a row done only swaps its class.
new MutationObserver(updateDoneMergedButton).observe(document.documentElement, {
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
});
updateDoneMergedButton();
