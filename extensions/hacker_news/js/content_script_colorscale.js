// Colorscale.

/**
 * Desired minimum number of items that should be highlighted. Should be less
 * than the number of items that are expected to be on the page (e.g. less than
 * 30 when there are 30 items per page).
 */
const MIN_HIGHLIGHTED_ENTRY_COUNT = 5;

/**
 * Item score must meet this value to be highlighted. Use a value starting from
 * 0 up to 100.
 */
const MIN_SCORE_HIGHLIGHT_THRESHOLD = 15;

const RED = new Color(230, 124, 115);
const YELLOW = new Color(255, 214, 102);
const GREEN = new Color(87, 187, 138);


function Interpolate(start, end, steps, count) {
    var s = start;
    var e = end;
    var final = s + (((e - s) / steps) * count);
    return Math.floor(final);
}

function Color(_r, _g, _b) {
    var r, g, b;
    var setColors = function(_r, _g, _b) {
        r = _r;
        g = _g;
        b = _b;
    };
    setColors(_r, _g, _b);
    this.getColors = function() {
        var colors = {
            r: r,
            g: g,
            b: b,
        };
        return colors;
    };
}

function colorscaleNodes(nodes, valueRegex) {
    // Find max value and gather (node, value) pairs.
    let maxValue = 0;
    let nodePairs = [];
    for (const node of nodes) {
        var match = node.innerText.match(valueRegex);
        if (match !== null) {
            var nodeValue = parseInt(match);
            maxValue = Math.max(maxValue, nodeValue);
            nodePairs.push([node, nodeValue]);
        }
    }

    // Determine the maximum number to use to ensure that at least a reasonable
    // number of entries are highlighted.
    var maxValueForThreshold = maxValue;

    var attemptCount = 0;
    var maxAttempts = 1000;
    do {
        attemptCount += 1;

        var highlightedCount = 0;

        // Ensure that at least N number of items are highlighted. This helps
        // avoid only a few items being highighted (e.g. when there are 1 or 2
        // really popular items).
        for (const nodePair of nodePairs) {
            var node = nodePair[0];
            var nodeValue = nodePair[1];
            var relativeValueForThreshold = nodeValue / maxValueForThreshold * 100;

            node.style.color = '#000';

            // Count number of entries that would be highlighted (as it meets the
            // minimum score to be highlighted).
            if (relativeValueForThreshold >= MIN_SCORE_HIGHLIGHT_THRESHOLD) {
                highlightedCount += 1;
            }
        }

        // Lower the maximum value to use as the minimum number of entries that
        // would have been highlighted wouldn't be reached using the current
        // maximum value.
        if (highlightedCount < MIN_HIGHLIGHTED_ENTRY_COUNT) {
            maxValueForThreshold -= 10;
        }

        // Stop adjusting the maximum value when the desired minimum number of
        // entries will be highlighted.
        if (highlightedCount >= MIN_HIGHLIGHTED_ENTRY_COUNT) {
            break;
        }

        if (maxValueForThreshold <= 0) {
            maxValueForThreshold = maxValue;
            break;
        }

    } while (attemptCount < maxAttempts);


    for (const nodePair of nodePairs) {
        var node = nodePair[0];
        var nodeValue = nodePair[1];
        var relativeValueForThreshold = nodeValue / maxValueForThreshold * 100;
        var relativeValueForColor = nodeValue / maxValue * 100;

        node.style.color = '#000';

        // Skip highlighting items that don't meet the scoring threshold.
        if (relativeValueForThreshold < MIN_SCORE_HIGHLIGHT_THRESHOLD) {
            node.style.backgroundColor = '';
            continue;
        } else if (relativeValueForThreshold < 50) {
            var start = GREEN;
            var end = YELLOW;
            var interpolationValue = relativeValueForColor;
        } else {
            var start = YELLOW;
            var end = RED;
            var interpolationValue = relativeValueForColor % 51;
        }

        var startColors = start.getColors();
        var endColors = end.getColors();
        var R = Interpolate(startColors.r, endColors.r, 50, interpolationValue);
        var G = Interpolate(startColors.g, endColors.g, 50, interpolationValue);
        var B = Interpolate(startColors.b, endColors.b, 50, interpolationValue);
        node.style.backgroundColor = 'rgb(' + R + ',' + G + ',' + B + ')';
    }
}

// Add colorscale to submission scores.
var submissionScores = document.querySelectorAll('.score');
var valueRegex = /(\d+) points/;
colorscaleNodes(submissionScores, valueRegex);

// Add colorscale to submission comment scores.
var commentLinks = document.querySelectorAll('a[href^=item]:nth-child(2n+0)');
var valueRegex = /(\d+)\xa0comments/;
colorscaleNodes(commentLinks, valueRegex);
