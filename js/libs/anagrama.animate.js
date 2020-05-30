// * requires: 
// Waypoints - 4.0.1 - http://imakewebthings.com/waypoints/
// include noframework.waypoints.min.js file.

/*
 * <div class="fade-on-scroll">__<div>
 * <div class="animate-on-scroll">__<div>
 */

/*
 * Anagrama 2020
 * https://www.anagrama.com/
 */

NodeList.prototype.forEach = Array.prototype.forEach;

$(window).on('load', function () {
  setAnimationWaypoints()
});

function setAnimationWaypoints() {
  if (document.querySelector('.animate-on-scroll') || document.querySelector('.fade-on-scroll')) {
    var animateOnScroll = document.querySelectorAll('.animate-on-scroll, .fade-on-scroll');
    animateOnScroll.forEach(function (value, index) {
      var waypoint = new Waypoint({
        element: value,
        handler: function (direction) {
          if (direction == 'down') {
            var thisElement = this.element;
            thisElement.classList.add('animate');
            setTimeout(function () {
              thisElement.classList.remove('animate-on-scroll', 'fade-on-scroll', 'animate');
            }, 1500);
          }
        },
        offset: '100%'
      })
    });
  }
}
