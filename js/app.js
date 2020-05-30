/* --- Function Index --- */
var site = {
  // 1st function to fire
  ready: ready,
  // 2nd function to fire
  load: load,
  scroll: scroll,
  resize: resize,
  /* this is function to set functionalities depending on the link rute */
  routeSwitch: routeSwitch,
  responsive: function getResponsive() {
    var windowWidth = window.innerWidth;
    var size;
    if (windowWidth > 768) {
      size = "lg"
    }
    else if (windowWidth <= 768 && windowWidth > 426) {
      size = "md"
    }
    else if (windowWidth <= 426) {
      size = "sm"
    }

    return size
  },
  closeAllOpenModals: closeAllOpenModals,
  header: {
    init: function init() {
      var waitExist = setInterval(function () {
        if ($('#burger-menu').length) {
          clearInterval(waitExist);

          $('#burger-menu').click(function () {
            site.header.open(this)
          })
        }
      }, 100);
    },
    open: toggleMobileMenu,
    close: closeMobileMenu
  }
}

function ready() {
  // Load Partials
  $("header").load("./partials/_header.html");
  $("footer").load("./partials/_footer.html");

  // Load Modals
  $("#modal-01").load("./modals/_modal.html");

  scroll();
}

$(document).ready(function () {
  site.ready();
});

function load() {
  site.header.init()
  site.routeSwitch();

  $('.loader-image').fadeOut(350);
  $('.loader-component').delay(600).fadeOut('slow');
  $('main').css({
    opacity: 1
  });
}

$(window).on('load', function () {
  site.load();
});

function resize() {
  var r = site.responsive()

  site.closeAllOpenModals()
}

$(window).on('resize', function () {
  site.resize();
});

function scroll() {
  if ($(window).scrollTop() > 50) {
    $("header").addClass("active-background");
    $(".mobile-nav-header").addClass("active-background");
  } else {
    //remove the background property so it comes transparent again (defined in your css)
    $("header").removeClass("active-background");
    $(".mobile-nav-header").removeClass("active-background");
  }
}

$(window).on("scroll", function () {
  site.scroll();
});

// VALIDATE FORMS
(function () {
  'use strict';
  window.addEventListener('load', function () {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function (form) {
      form.addEventListener('submit', function (event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();

function routeSwitch() {
  var location = document.location.pathname;
  var nav, contactLink;

  if (this.winWidth > 769) {
    nav = $("header .nav-grid")
    contactLink = $("header .contact-link")
  }
  else {
    nav = $(".mobile-menu .mobile-nav")
    contactLink = $(".mobile-nav-header .contact-link")
  }

  switch (location) {

    case "/":
    case "/home":
      /* set all the functionality for the specific rute */

      // $("header").addClass("dark");
      // $(".mobile-nav-header").addClass("dark");
      break;

    default:
      break;
  }

  /* this timeOut allows to set an animation in the header if needed */
  // setTimeout(function () {
  // }, 900);
}

function toggleMobileMenu(el) {
  var el = $(el) // $(el) ----> #burger-menu
  if ($("#burger-menu").hasClass("animating")) return;

  if (site.responsive() == "sm") {
    //close
    if ($(".js-menu").hasClass("js-menu--opened")) {
      site.header.close()
    }
    //open
    else {
      $(".js-menu").show()
      el.addClass("open animating")
      TweenMax.to($(".js-pushright"), .6, {
        x: window.innerWidth,
        ease: Power3.easeInOut
      })
      TweenMax.fromTo($(".js-menu"), .6, {
        x: -window.innerWidth
      }, {
        x: 0,
        ease: Power3.easeInOut,
        onComplete: function () {
          $(".js-menu").addClass("js-menu--opened open")
          el.removeClass("animating");
        }
      })
    }
  }
  else if (site.responsive() == "md") {
    //close
    if ($(".js-menu").hasClass("js-menu--opened")) {
      site.header.close()
    }
    //open
    else {
      $(".js-menu").show()
      var menuWidth = $(".js-menu").width();
      el.addClass("open animating")
      TweenMax.fromTo($(".js-menu"), .6, {
        x: -menuWidth
      }, {
        x: 0,
        ease: Power3.easeInOut,
        onComplete: function () {
          $(".js-menu").addClass("js-menu--opened open")
          el.removeClass("animating");
        }
      })
    }
  }
}

function closeMobileMenu() {
  //close
  if ($(".js-menu").hasClass("js-menu--opened")) {
    $("#burger-menu").addClass("animating")
    TweenMax.to($(".js-pushright"), .5, {
      x: 0,
      ease: Power3.easeInOut,
      clearProps: "transform,z-index"
    })
    TweenMax.to($(".js-menu"), .5, {
      x: -window.innerWidth,
      ease: Expo.easeInOut,
      onComplete: function () {
        $(".js-menu").removeClass("js-menu--opened open").hide()
        $("#burger-menu").removeClass("open animating");
        TweenMax.to($(".js-menu-item"), .5, {
          opacity: 1,
          ease: Expo.easeOut
        })
      }
    })
  }
}

function closeAllOpenModals() {
  site.header.close()
}
