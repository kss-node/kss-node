(function() {
  'use strict';

  var forEach = Array.prototype.forEach,
      map = Array.prototype.map;

  var classList = document.body.classList,
      kssSections = document.querySelectorAll('.kss-section'),
      listItems = document.querySelectorAll('.kss-js-breakpoint');

  var breakpoints = [];

  var clearActive = function(item) {
    item.parentNode.classList.remove('kss-breakpoint--active')
  };

  var applyBreakpoint = function (event) {
    if (event) {
      event.preventDefault();
    }
    var cssClass = this.textContent.trim();
    var width = this.title;

    breakpoints.forEach(function (breakpoint) {
      classList.remove.call(classList, breakpoint)
    })
    classList.add(cssClass);

    forEach.call(kssSections, function(section) {
      section.style.maxWidth = width;
      section.style.width = width;
    })

    forEach.call(listItems, clearActive);
    this.parentNode.classList.add('kss-breakpoint--active');
  };

  breakpoints = map.call(listItems, function (a) {
    a.addEventListener('click', applyBreakpoint)
    return a.textContent.trim();
  });

  document.addEventListener('DOMContentLoaded', applyBreakpoint.bind(listItems[listItems.length - 1]));
}());
