console.clear();
// Colorscale.

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

function highlightNodes(nodePairsToHighlight, maxValue) {
    for (const nodePair of nodePairsToHighlight) {
        var node = nodePair[0];
        var nodeValue = nodePair[1];
        var relativeValueForThreshold = nodeValue / maxValue * 100;
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

function colorscaleNodes(nodes, valueRegex) {
    // Gather list of node values and (node, value) pairs.
    let nodeValues = [];
    let nodePairs = [];
    for (const node of nodes) {
        var match = node.innerText.match(valueRegex);
        if (match !== null) {
            var nodeValue = parseInt(match);
            nodeValues.push(nodeValue);
            nodePairs.push([node, nodeValue]);
        }
    }

    var sortedNodePairs = [...nodePairs].sort((a, b) => a[1] - b[1]).reverse();

    // Exclude a few of the top entries from dominating the coloring by
    // highlighting them separately.

    // Highlight top entries using the maximum value.
    var maxValue = sortedNodePairs[0][1];
    highlightNodes(sortedNodePairs.slice(0, 2), maxValue);

    // Highlight all other entries using the adjusted maximum value.
    var adjustedMaxValue = sortedNodePairs.slice(2)[0][1];
    highlightNodes(sortedNodePairs.slice(2), adjustedMaxValue);
}

// Add colorscale to submission scores.
var submissionScores = document.querySelectorAll('.score');
var valueRegex = /(\d+) points/;
colorscaleNodes(submissionScores, valueRegex);

// Add colorscale to submission comment scores.
var commentLinkSelector;
if (window.location.pathname === '/ask') {
    commentLinkSelector = 'a[href^=item]:nth-child(3n+2)';
} else {
    commentLinkSelector = 'a[href^=item]:nth-child(2n+0)';
}
var commentLinks = document.querySelectorAll(commentLinkSelector);
var valueRegex = /(\d+)\xa0comments/;
colorscaleNodes(commentLinks, valueRegex);
