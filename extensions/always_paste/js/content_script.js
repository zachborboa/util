const allowPaste = function(event) {
    event.stopImmediatePropagation();
    return true;
};

document.addEventListener('paste', allowPaste, true);
