var pageUpButton = document.createElement('button');
pageUpButton.innerText = '↑';
pageUpButton.onclick = function() {
    console.log('pageUpButton clicked');
    window.scrollTo(0, window.scrollY - window.innerHeight);
};

var pageDownButton = document.createElement('button');
pageDownButton.innerText = '↓';
pageDownButton.onclick = function() {
    console.log('pageDownButton clicked');
    window.scrollTo(0, window.scrollY + window.innerHeight);
};


var pageUpButtonInner = document.createElement('div');
pageUpButtonInner.classList.add('_hn-arrow');
pageUpButtonInner.classList.add('_hn-page-up');
pageUpButtonInner.appendChild(pageUpButton);

var pageDownButtonInner = document.createElement('div');
pageDownButtonInner.classList.add('_hn-arrow');
pageDownButtonInner.classList.add('_hn-page-down');
pageDownButtonInner.appendChild(pageDownButton);


var pageUpButtonWrapper = document.createElement('div');
pageUpButtonWrapper.classList.add('_hn-arrow-wrapper');
pageUpButtonWrapper.appendChild(pageUpButtonInner);

var pageDownButtonWrapper = document.createElement('div');
pageDownButtonWrapper.classList.add('_hn-arrow-wrapper');
pageDownButtonWrapper.appendChild(pageDownButtonInner);


var pageNavigationWrapper = document.createElement('div');
pageNavigationWrapper.setAttribute('class', '_hn-nav');
pageNavigationWrapper.appendChild(pageUpButtonWrapper);
pageNavigationWrapper.appendChild(pageDownButtonWrapper);

document.body.appendChild(pageNavigationWrapper);

