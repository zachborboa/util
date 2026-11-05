// Find "Pause mobile notifications while you're using this device" nag and hide
// it.
var attempt = 0;
var findNagInterval = setInterval(() => {
    attempt += 1;

    if (attempt >= 10) {
        clearInterval(findNagInterval);
    }

    var promoPopup = document.querySelector('.promo-popup-header');
    if (promoPopup) {
        var element = promoPopup;
        while (element.parentElement) {
            element = element.parentElement;
            if (element.hasAttribute('role') && element.getAttribute('role') === 'dialog') {
                console.log('dialog found:', element);
                element.style.display = 'none';
                console.log('dialog hidden');
                break;
            }
        }
    }
}, 1000);
