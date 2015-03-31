$(document).ready(function () {

  // Smooth scroll to #anchor
  $('a[href^="#"]').on('click', function (e) {
    e.preventDefault();

    var target = this.hash;
    var $target = $(target);

    $('html, body').stop().animate({
      'scrollTop': $target.offset().top
    }, 900, 'swing', function () {
      window.location.hash = target;
    });
  });

  // Show overlay on hamburger click
  $('.hamburger').click(function() {
    $('nav.menu-overlay').toggle();
  });

  $('nav.menu-overlay>ul>li>a').click(function() {
    $('nav.menu-overlay').toggle();
  });

});
