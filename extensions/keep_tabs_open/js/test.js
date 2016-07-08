var assert = require('assert');

console.log('================================================================================');

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
    console.log('--------------------------------------------------------------------------------');
    console.log('TEST ' + i);

    var test = tests[i];
    console.log('test:', test);

    var openUrls = test['urls_currently_open'];
    console.log('open urls:', openUrls);

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
            console.log('looking for pattern:', pattern);
            var regex = RegExp(pattern);
            console.log('regex:', regex);
            for ( var m = 0; m < openUrls.length; m++ ) {
                var openUrl = openUrls[m];
                console.log('looking for pattern:', pattern, 'in open url:', openUrl);
                if ( regex.test(openUrl) ) {
                    console.log('pattern found');
                    found = true;
                    break dance;
                }
            }
            console.log('---');
        }

        if ( ! found ) {
            console.log('pattern not found');
            console.log('adding url', urlToMaybeOpen, 'to list of urls to open');
            ActualUrlsThatOpened.push(urlToMaybeOpen);

            // Add url that will be opened to list of effectively open urls.
            openUrls.push(urlToMaybeOpen);
        }
    }

    var ExpectedUrlsThatShouldOpen = test['urls_that_should_open'];

    console.log('number of urls that should have opened:', ExpectedUrlsThatShouldOpen.length);
    console.log('number of urls that actually opened:', ActualUrlsThatOpened.length);

    console.log('expected:', ExpectedUrlsThatShouldOpen);
    console.log('actual:', ActualUrlsThatOpened);

    assert.deepEqual(ActualUrlsThatOpened, ExpectedUrlsThatShouldOpen);
}
