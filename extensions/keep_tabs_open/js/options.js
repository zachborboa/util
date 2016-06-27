console.info('options.js');

$('#keep-open-add-another-url').click(function(event) {
    event.preventDefault();
    $('#keep-open-url-pattern')
        .clone()
        .removeAttr('id')
        .appendTo('.keep-open-url-pattern-wrapper');
});
