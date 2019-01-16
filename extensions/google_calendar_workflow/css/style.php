<?php
$new_to_classic_name = array(
    'calendar_color' => 'none',
    'blueberry'      => 'bold blue',
    'lavender'       => 'blue',
    'peacock'        => 'turquoise',
    'sage'           => 'green',
    'basil'          => 'bold green',
    'banana'         => 'yellow',
    'tangerine'      => 'orange',
    'flamingo'       => 'red',
    'tomato'         => 'bold red',
    'grape'          => 'purple',
    'graphite'       => 'gray',
);

$new_background_color_current_events = array(
    'calendar_color' => array('#4285f4', 'rgb(66, 133, 244)'),
    'blueberry'      => array('#3f51b5', 'rgb(63, 81, 181)'),
    'lavender'       => array('#7986cb', 'rgb(121, 134, 203)'),
    'peacock'        => array('#039be5', 'rgb(3, 155, 229)'),
    'sage'           => array('#33b679', 'rgb(51, 182, 121)'),
    'basil'          => array('#0b8043', 'rgb(11, 128, 67)'),
    'banana'         => array('#f6bf26', 'rgb(246, 191, 38)'),
    'tangerine'      => array('#f4511e', 'rgb(244, 81, 30)'),
    'flamingo'       => array('#e67c73', 'rgb(230, 124, 115)'),
    'tomato'         => array('#d50000', 'rgb(213, 0, 0)'),
    'grape'          => array('#8e24aa', 'rgb(142, 36, 170)'),
    'graphite'       => array('#616161', 'rgb(97, 97, 97)'),
);

$new_background_color_past_events = array(
    'calendar_color' => array('#c6dafc', 'rgb(198, 218, 252)'),
    'blueberry'      => array('#c5cbe9', 'rgb(197, 203, 233)'),
    'lavender'       => array('#d7dbef', 'rgb(215, 219, 239)'),
    'peacock'        => array('#b3e1f7', 'rgb(179, 225, 247)'),
    'sage'           => array('#c2e9d7', 'rgb(194, 233, 215)'),
    'basil'          => array('#b6d9c7', 'rgb(182, 217, 199)'),
    'banana'         => array('#fcecbe', 'rgb(252, 236, 190)'),
    'tangerine'      => array('#fccbbc', 'rgb(252, 203, 188)'),
    'flamingo'       => array('#f8d8d5', 'rgb(248, 216, 213)'),
    'tomato'         => array('#f2b3b3', 'rgb(242, 179, 179)'),
    'grape'          => array('#ddbde6', 'rgb(221, 189, 230)'),
    'graphite'       => array('#d0d0d0', 'rgb(208, 208, 208)'),
);

$classic_background_color_current_events_hex = array(
    'none'       => '#a2c8e7',
    'bold blue'  => '#5b89ed',
    'blue'       => '#a4bdfc',
    'turquoise'  => '#46d6db',
    'green'      => '#7ae7bf',
    'bold green' => '#51b749',
    'yellow'     => '#fbd75b',
    'orange'     => '#ffb878',
    'red'        => '#ff887c',
    'bold red'   => '#dc2127',
    'purple'     => '#dbadff',
    'gray'       => '#e1e1e1',
);

$classic_background_color_past_events_hex = array(
    'none'       => '#e3e3ff',
    'bold blue'  => '#dde6fb',
    'blue'       => '#e4ebfe',
    'turquoise'  => '#c7f3f4',
    'green'      => '#d7f8ec',
    'bold green' => '#dcf1db',
    'yellow'     => '#fef3cd',
    'orange'     => '#ffead6',
    'red'        => '#ffdbd7',
    'bold red'   => '#f8d3d4',
    'purple'     => '#f4e6ff',
    'gray'       => '#f6f6f6',
);

ob_start();
foreach ($new_background_color_current_events as $new_background_color_name => $new_colors) {
    list($hex, $rgb) = $new_colors;
    $classic_color_name = $new_to_classic_name[$new_background_color_name];
    $classic_color = $classic_background_color_current_events_hex[$classic_color_name];
    echo
        '    // ' . $new_background_color_name . ' => ' . $classic_color_name . '.' . "\n" .
        '    &[style="background-color: ' . $rgb . ';"],' . "\n" .
        '    &[style="background-color:' . strtoupper($hex) . ';"] {' . "\n" .
        '        background-color: ' . $classic_color . ' !important;' . "\n" .
        '    }' . "\n" .
        '';
}
$scss = ob_get_contents();
ob_end_clean();
file_put_contents('current_events.inc.scss', $scss);

ob_start();
foreach ($new_background_color_past_events as $new_background_color_name => $new_colors) {
    list($hex, $rgb) = $new_colors;
    $classic_color_name = $new_to_classic_name[$new_background_color_name];
    $classic_color = $classic_background_color_past_events_hex[$classic_color_name];
    echo
        '    // ' . $new_background_color_name . ' => ' . $classic_color_name . '.' . "\n" .
        '    &[style*="' . $rgb . '"],' . "\n" .
        '    &[style*="' . strtolower($hex) . '"] {' . "\n" .
        '        background-color: ' . $classic_color . ' !important;' . "\n" .
        '    }' . "\n" .
        '';
}
$scss = ob_get_contents();
ob_end_clean();
file_put_contents('past_events.inc.scss', $scss);
