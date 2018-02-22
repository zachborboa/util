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
    'calendar_color' => '#c6dafc',
    'blueberry'      => '#c5cbe9',
    'lavender'       => '#d7dbef',
    'peacock'        => '#b3e1f7',
    'sage'           => '#c2e9d7',
    'basil'          => '#b6d9c7',
    'banana'         => '#fcecbe',
    'tangerine'      => '#fccbbc',
    'flamingo'       => '#f8d8d5',
    'tomato'         => '#f2b3b3',
    'grape'          => '#ddbde6',
    'graphite'       => '#d0d0d0',
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
echo $scss;

ob_start();
foreach ($new_background_color_past_events as $new_background_color_name => $new_color) {
    $classic_color_name = $new_to_classic_name[$new_background_color_name];
    $classic_color = $classic_background_color_past_events_hex[$classic_color_name];
    echo
        '    // ' . $new_background_color_name . ' => ' . $classic_color_name . '.' . "\n" .
        '    &[style="background-color:' . $new_color . ';"] {' . "\n" .
        '        background-color: ' . $classic_color . ' !important;' . "\n" .
        '    }' . "\n" .
        '';
}
$scss = ob_get_contents();
ob_end_clean();
file_put_contents('past_events.inc.scss', $scss);
