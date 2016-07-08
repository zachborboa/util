var assert = require('assert');

var tests = [
    // Test url opens when no patterns match.
    {
        'urls_currently_open': [
            'https://www.example.com/',
        ],
        'settings': [
            {
                'url_to_open': 'https://www.google.com/calendar/render',
                'when_patterns_not_found': [
                    'https:\/\/accounts\.google\.com\/ServiceLogin',
                    'https:\/\/calendar\.google\.com\/',
                    'https:\/\/www\.google\.com\/calendar',
                ],
            },
        ],
        'urls_that_should_open': [
            'https://www.google.com/calendar/render',
        ],
    },

    // Test url does not open when a pattern matches.
    {
        'urls_currently_open': [
            'https://calendar.google.com/calendar/render#main_7',
        ],
        'settings': [
            {
                'url_to_open': 'https://www.google.com/calendar/render',
                'when_patterns_not_found': [
                    'https:\/\/accounts\.google\.com\/ServiceLogin',
                    'https:\/\/calendar\.google\.com\/',
                    'https:\/\/www\.google\.com\/calendar',
                ],
            },
        ],
        'urls_that_should_open': [
        ],
    },

    // Test url does not open when one of several patterns match.
    {
        'urls_currently_open': [
            'https://www.google.com/calendar/render',
        ],
        'settings': [
            {
                'url_to_open': 'https://www.google.com/calendar/render',
                'when_patterns_not_found': [
                    'https:\/\/accounts\.google\.com\/ServiceLogin',
                    'https:\/\/calendar\.google\.com\/',
                    'https:\/\/www\.google\.com\/calendar',
                ],
            },
        ],
        'urls_that_should_open': [
        ],
    },

    // Test url does not open when a pattern matches one of several urls.
    {
        'urls_currently_open': [
            'https://www.example.com/',
            'https://example.org/',
            'https://accounts.google.com/ServiceLogin?service=cl&continue=https://calendar.google.com/',
        ],
        'settings': [
            {
                'url_to_open': 'https://www.google.com/calendar/render',
                'when_patterns_not_found': [
                    'https:\/\/accounts\.google\.com\/ServiceLogin',
                    'https:\/\/calendar\.google\.com\/',
                    'https:\/\/www\.google\.com\/calendar',
                ],
            },
        ],
        'urls_that_should_open': [
        ],
    },

    // Test only the first url should open when a subsequent pattern matches the url to be opened.
    {
        'urls_currently_open': [
            'https://www.example.com/',
            'https://example.org/',
        ],
        'settings': [
            {
                'url_to_open': 'https://accounts.google.com/ServiceLogin?service=mail&continue=https://mail.google.com/',
                'when_patterns_not_found': [
                    'https:\/\/accounts\.google\.com\/ServiceLogin',
                    'https:\/\/mail\.google\.com\/',
                ],
            },
            {
                'url_to_open': 'https://www.google.com/calendar/render',
                'when_patterns_not_found': [
                    'https:\/\/accounts\.google\.com\/ServiceLogin',
                    'https:\/\/calendar\.google\.com\/',
                    'https:\/\/www\.google\.com\/calendar',
                ],
            },
        ],
        'urls_that_should_open': [
            'https://accounts.google.com/ServiceLogin?service=mail&continue=https://mail.google.com/',
        ],
    },
];

for ( var i = 0; i < tests.length; i++ ) {
    var test = tests[i];
    var openUrls = test['urls_currently_open'];
    var settings = test['settings'];

    var ActualUrlsThatOpened = [];
    for ( var j = 0; j < settings.length; j++ ) {
        var setting = settings[j];
        var urlToMaybeOpen = setting['url_to_open'];
        var whenPatternsNotFound = setting['when_patterns_not_found'];
        var found = false;
        dance:
        for ( var k = 0; k < whenPatternsNotFound.length; k++ ) {
            var pattern = whenPatternsNotFound[k];
            var regex = RegExp(pattern);
            for ( var m = 0; m < openUrls.length; m++ ) {
                var openUrl = openUrls[m];
                if ( regex.test(openUrl) ) {
                    found = true;
                    break dance;
                }
            }
        }

        if ( ! found ) {
            // Add url to list of urls to open.
            ActualUrlsThatOpened.push(urlToMaybeOpen);

            // Add url that will be opened to list of effectively open urls.
            openUrls.push(urlToMaybeOpen);
        }
    }

    var ExpectedUrlsThatShouldOpen = test['urls_that_should_open'];
    assert.deepEqual(ActualUrlsThatOpened, ExpectedUrlsThatShouldOpen);
}
