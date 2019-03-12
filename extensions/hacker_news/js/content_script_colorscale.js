// Colorscale.

/**
 * Item score must meet this value to be highlighted. Use 0-100.
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

    for (const nodePair of nodePairs) {
        var node = nodePair[0];
        var nodeValue = nodePair[1];
        var relativeValue = nodeValue / maxValue * 100;

        // Skip highlighting items that don't meet the scoring threshold.
        if (relativeValue < MIN_SCORE_HIGHLIGHT_THRESHOLD) {
            continue;
        } else if (relativeValue < 50) {
            var start = GREEN;
            var end = YELLOW;
            var interpolationValue = relativeValue;
        } else {
            var start = YELLOW;
            var end = RED;
            var interpolationValue = relativeValue % 51;
        }

        var startColors = start.getColors();
        var endColors = end.getColors();
        var R = Interpolate(startColors.r, endColors.r, 50, interpolationValue);
        var G = Interpolate(startColors.g, endColors.g, 50, interpolationValue);
        var B = Interpolate(startColors.b, endColors.b, 50, interpolationValue);
        node.style.color = '#000';
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
