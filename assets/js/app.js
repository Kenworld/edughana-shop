var MyScroll = "";
(function (window, document, $, undefined) {
  "use strict";
  var isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Nokia|Opera Mini/i.test(
      navigator.userAgent
    )
      ? !0
      : !1;
  var Scrollbar = window.Scrollbar;
  var Init = {
    i: function (e) {
      Init.s();
      Init.methods();
    },
    s: function (e) {
      (this._window = $(window)),
        (this._document = $(document)),
        (this._body = $("body")),
        (this._html = $("html"));
    },
    methods: function (e) {
      Init.w();
      Init.backToTop();
      Init.preloader();
      Init.dropdown();
      Init.wow();
      Init.header();
      Init.slick();
      Init.countdownInit(".countdown", "2026/02/28");
      Init.filterToggle();
      Init.checkBoxes();
      Init.priceRangeSlider();
      Init.quantityHandle();
      Init.cartSidebar();
      Init.formValidation();
      Init.contactForm();
    },
    w: function (e) {
      if (isMobile) {
        $("body").addClass("is-mobile");
      }
    },
    backToTop: function () {
      var btn = $("#backto-top");
      $(window).on("scroll", function () {
        if ($(window).scrollTop() > 300) {
          btn.addClass("show");
        } else {
          btn.removeClass("show");
        }
      });
      btn.on("click", function (e) {
        e.preventDefault();
        $("html, body").animate({ scrollTop: 0 }, "300");
      });
    },
    preloader: function () {
      setTimeout(function () {
        $("#preloader").fadeOut("slow");
      }, 2000);
    },
    dropdown: function () {
      const selectedAll = document.querySelectorAll(".wrapper-dropdown");
      selectedAll.forEach((selected) => {
        const optionsContainer = selected.children[2];
        const optionsList = selected.querySelectorAll(
          "div.wrapper-dropdown li"
        );
        selected.addEventListener("click", () => {
          let arrow = selected.children[1];
          if (selected.classList.contains("active")) {
            handleDropdown(selected, arrow, !1);
          } else {
            let currentActive = document.querySelector(
              ".wrapper-dropdown.active"
            );
            if (currentActive) {
              let anotherArrow = currentActive.children[1];
              handleDropdown(currentActive, anotherArrow, !1);
            }
            handleDropdown(selected, arrow, !0);
          }
        });
        for (let o of optionsList) {
          o.addEventListener("click", () => {
            selected.querySelector(".selected-display").innerHTML = o.innerHTML;
          });
        }
      });
      window.addEventListener("click", function (e) {
        if (e.target.closest(".wrapper-dropdown") === null) {
          closeAllDropdowns();
        }
      });
      function closeAllDropdowns() {
        const selectedAll = document.querySelectorAll(".wrapper-dropdown");
        selectedAll.forEach((selected) => {
          const optionsContainer = selected.children[2];
          let arrow = selected.children[1];
          handleDropdown(selected, arrow, !1);
        });
      }
      function handleDropdown(dropdown, arrow, open) {
        if (open) {
          arrow.classList.add("rotated");
          dropdown.classList.add("active");
        } else {
          arrow.classList.remove("rotated");
          dropdown.classList.remove("active");
        }
      }
    },
    wow: function () {
      if ($(".wow").length) {
        var wow = new WOW({
          boxClass: "wow",
          animateClass: "animated",
          mobile: !0,
          live: !0,
        });
        wow.init();
      }
    },
    header: function () {
      function dynamicCurrentMenuClass(selector) {
        let FileName = window.location.href.split("/").reverse()[0];
        selector.find("li").each(function () {
          let anchor = $(this).find("a");
          if ($(anchor).attr("href") == FileName) {
            $(this).addClass("current");
          }
        });
        selector.children("li").each(function () {
          if ($(this).find(".current").length) {
            $(this).addClass("current");
          }
        });
        if ("" == FileName) {
          selector.find("li").eq(0).addClass("current");
        }
      }
      if ($(".main-menu__list").length) {
        let mainNavUL = $(".main-menu__list");
        dynamicCurrentMenuClass(mainNavUL);
      }
      if ($(".main-menu__nav").length && $(".mobile-nav__container").length) {
        let navContent = document.querySelector(".main-menu__nav").innerHTML;
        let mobileNavContainer = document.querySelector(
          ".mobile-nav__container"
        );
        mobileNavContainer.innerHTML = navContent;
      }
      if ($(".sticky-header__content").length) {
        let navContent = document.querySelector(".main-menu").innerHTML;
        let mobileNavContainer = document.querySelector(
          ".sticky-header__content"
        );
        mobileNavContainer.innerHTML = navContent;
      }
      if ($(".mobile-nav__container .main-menu__list").length) {
        let dropdownAnchor = $(
          ".mobile-nav__container .main-menu__list .dropdown > a"
        );
        dropdownAnchor.each(function () {
          let self = $(this);
          let toggleBtn = document.createElement("BUTTON");
          toggleBtn.setAttribute("aria-label", "dropdown toggler");
          toggleBtn.innerHTML = "<i class='fa fa-angle-down'></i>";
          self.append(function () {
            return toggleBtn;
          });
          self.find("button").on("click", function (e) {
            e.preventDefault();
            let self = $(this);
            self.toggleClass("expanded");
            self.parent().toggleClass("expanded");
            self.parent().parent().children("ul").slideToggle();
          });
        });
      }
      if ($(".mobile-nav__toggler").length) {
        $(".mobile-nav__toggler").on("click", function (e) {
          e.preventDefault();
          $(".mobile-nav__wrapper").toggleClass("expanded");
          $("body").toggleClass("locked");
        });
      }
      $(window).on("scroll", function () {
        if ($(".stricked-menu").length) {
          var headerScrollPos = 130;
          var stricky = $(".stricked-menu");
          if ($(window).scrollTop() > headerScrollPos) {
            stricky.addClass("stricky-fixed");
          } else if ($(this).scrollTop() <= headerScrollPos) {
            stricky.removeClass("stricky-fixed");
          }
        }
      });
    },
    slick: function () {
      if ($(".featured-product-slider").length) {
        $(".featured-product-slider").slick({
          slidesToShow: 4,
          slidesToScroll: 1,
          autoplay: !0,
          autoplaySpeed: 3000,
          dots: !1,
          arrows: !1,
          centerPadding: "0",
          cssEase: "linear",
          responsive: [
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 821, settings: { slidesToShow: 2 } },
            { breakpoint: 768, settings: { slidesToShow: 1 } },
          ],
        });
      }
      if ($(".testimonail-slider").length) {
        $(".testimonail-slider").slick({
          slidesToShow: 4,
          slidesToScroll: 1,
          autoplay: !0,
          autoplaySpeed: 3000,
          dots: !1,
          arrows: !1,
          centerPadding: "0",
          cssEase: "linear",
          responsive: [
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 821, settings: { slidesToShow: 2 } },
            { breakpoint: 768, settings: { slidesToShow: 1 } },
          ],
        });
      }
      if ($(".brand-slider").length) {
        $(".brand-slider").slick({
          autoplay: !0,
          autoplaySpeed: 0,
          speed: 10000,
          arrows: !1,
          swipe: !0,
          slidesToShow: 6,
          cssEase: "linear",
          pauseOnFocus: !1,
          pauseOnHover: !1,
          responsive: [
            { breakpoint: 1699, settings: { slidesToShow: 5 } },
            { breakpoint: 1499, settings: { slidesToShow: 4 } },
            { breakpoint: 1299, settings: { slidesToShow: 3 } },
            { breakpoint: 821, settings: { slidesToShow: 2 } },
          ],
        });
      }
      if ($(".product-detail-slider").length) {
        $(".product-detail-slider").slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: !1,
          fade: !0,
          asNavFor: ".product-slider-asnav",
        });
      }
      if ($(".product-slider-asnav").length) {
        $(".product-slider-asnav").slick({
          slidesToShow: 4,
          slidesToScroll: 1,
          asNavFor: ".product-detail-slider",
          dots: !1,
          arrows: !1,
          centerMode: !1,
          variableWidth: !0,
          focusOnSelect: !0,
        });
      }
      $(".btn-prev").click(function () {
        var $this = $(this).attr("data-slide");
        $("." + $this).slick("slickPrev");
      });
      $(".btn-next").click(function () {
        var $this = $(this).attr("data-slide");
        $("." + $this).slick("slickNext");
      });
    },
    countdownInit: function (countdownSelector, countdownTime, countdown) {
      var eventCounter = $(countdownSelector);
      if (eventCounter.length) {
        eventCounter.countdown(countdownTime, function (e) {
          $(this).html(
            e.strftime(
              "<li><h2>%D</h2><h6>Days</h6></li>\
              <li><h5>:</h5></li>\
              <li><h2>%H</h2><h6>Hrs</h6></li>\
              <li><h5>:</h5></li>\
              <li><h2>%M</h2><h6>Mins</h6></li>\
              <li><h5>:</h5></li>\
              <li><h2>%S</h2><h6>Secs</h6></li>"
            )
          );
        });
      }
    },
    filterToggle: function () {
      if ($(".category-block").length) {
        $(".category-block .title").on("click", function (e) {
          var count = $(this).data("count");
          if (
            $(".category-block.box-" + count + " .content-block").is(":visible")
          ) {
            $(".category-block.box-" + count + " span i").removeClass(
              "fa-chevron-up"
            );
            $(".category-block.box-" + count + " span i").addClass(
              "fa-chevron-down"
            );
            $(".category-block.box-" + count + " .content-block").hide("slow");
          } else {
            $(".category-block.box-" + count + " span i").removeClass(
              "fa-chevron-down"
            );
            $(".category-block.box-" + count + " span i").addClass(
              "fa-chevron-up"
            );
            $(".category-block.box-" + count + " .content-block").show("slow");
          }
        });
      }
      if ($(".toggle-sidebar").length) {
        $(".filter-btn").on("click", function () {
          $(".toggle-sidebar").animate({ left: "0" }, 300);
          $(".sidebar-overlay").fadeIn(300);
          $("body").addClass("no-scroll");
        });
        $(".sidebar-overlay").on("click", function () {
          $(".toggle-sidebar").animate({ left: "-800px" }, 300);
          $(this).fadeOut(300);
          $("body").removeClass("no-scroll");
        });
      }
      if ($(".feature-products").length) {
        $(".tab-link").click(function () {
          var tabID = $(this).attr("data-tab");
          $(this).addClass("active").siblings().removeClass("active");
          $("#tab-" + tabID)
            .addClass("active")
            .siblings()
            .removeClass("active");
          var currentSlider = $("#tab-" + tabID).find(".product-slider");
          if (currentSlider.hasClass("slick-initialized")) {
            currentSlider.slick("setPosition");
          } else {
            currentSlider.slick();
          }
        });
      }
    },
    filterToggle: function () {
      if ($(".ageGroup-block").length) {
        $(".ageGroup-block .title").on("click", function (e) {
          var count = $(this).data("count");
          if (
            $(".ageGroup-block.box-" + count + " .content-block").is(":visible")
          ) {
            $(".ageGroup-block.box-" + count + " span i").removeClass(
              "fa-chevron-up"
            );
            $(".ageGroup-block.box-" + count + " span i").addClass(
              "fa-chevron-down"
            );
            $(".ageGroup-block.box-" + count + " .content-block").hide("slow");
          } else {
            $(".ageGroup-block.box-" + count + " span i").removeClass(
              "fa-chevron-down"
            );
            $(".ageGroup-block.box-" + count + " span i").addClass(
              "fa-chevron-up"
            );
            $(".ageGroup-block.box-" + count + " .content-block").show("slow");
          }
        });
      }
      if ($(".toggle-sidebar").length) {
        $(".filter-btn").on("click", function () {
          $(".toggle-sidebar").animate({ left: "0" }, 300);
          $(".sidebar-overlay").fadeIn(300);
          $("body").addClass("no-scroll");
        });
        $(".sidebar-overlay").on("click", function () {
          $(".toggle-sidebar").animate({ left: "-800px" }, 300);
          $(this).fadeOut(300);
          $("body").removeClass("no-scroll");
        });
      }
      if ($(".feature-products").length) {
        $(".tab-link").click(function () {
          var tabID = $(this).attr("data-tab");
          $(this).addClass("active").siblings().removeClass("active");
          $("#tab-" + tabID)
            .addClass("active")
            .siblings()
            .removeClass("active");
          var currentSlider = $("#tab-" + tabID).find(".product-slider");
          if (currentSlider.hasClass("slick-initialized")) {
            currentSlider.slick("setPosition");
          } else {
            currentSlider.slick();
          }
        });
      }
    },
    checkBoxes: function () {
      $(".sub-checkboxes").hide();
      $(".arrow-block").click(function () {
        var subCheckboxes = $(this).next(".sub-checkboxes");
        var chevronIcon = $(this).find("i");
        subCheckboxes.slideToggle("fast");
        chevronIcon.toggleClass("fa-chevron-down fa-chevron-up");
      });
      $(".check-block, .sub-check-box").click(function (event) {
        event.stopPropagation();
      });
      if ($(".customer-container").length) {
        $(".signin-button").click(function () {
          $(".sign-form").slideToggle();
        });
      }
    },
    priceRangeSlider: function () {
      const priceGap = 1000;
      $(".price-input input").on("input", function () {
        let minPrice = parseInt($(".price-input .input-min").val()),
          maxPrice = parseInt($(".price-input .input-max").val());
        if (
          maxPrice - minPrice >= priceGap &&
          maxPrice <= $(".range-input .range-max").attr("max")
        ) {
          if ($(this).hasClass("input-min")) {
            $(".range-input .range-min").val(minPrice);
            $(".slider .progress").css(
              "left",
              (minPrice / $(".range-input .range-min").attr("max")) * 100 + "%"
            );
          } else {
            $(".range-input .range-max").val(maxPrice);
            $(".slider .progress").css(
              "right",
              100 -
                (maxPrice / $(".range-input .range-max").attr("max")) * 100 +
                "%"
            );
          }
        }
      });
      $(".range-input input").on("input", function () {
        let minVal = parseInt($(".range-input .range-min").val()),
          maxVal = parseInt($(".range-input .range-max").val());
        if (maxVal - minVal < priceGap) {
          if ($(this).hasClass("range-min")) {
            $(".range-input .range-min").val(maxVal - priceGap);
          } else {
            $(".range-input .range-max").val(minVal + priceGap);
          }
        } else {
          $(".price-input .input-min").val(minVal);
          $(".price-input .input-max").val(maxVal);
          $(".slider .progress").css(
            "left",
            (minVal / $(".range-input .range-min").attr("max")) * 100 + "%"
          );
          $(".slider .progress").css(
            "right",
            100 -
              (maxVal / $(".range-input .range-max").attr("max")) * 100 +
              "%"
          );
        }
      });
    },
    quantityHandle: function () {
      $(".decrement").on("click", function () {
        var qtyInput = $(this).closest(".quantity-wrap").children(".number");
        var qtyVal = parseInt(qtyInput.val());
        if (qtyVal > 1) {
          qtyInput.val(qtyVal - 1);
        }
      });
      $(".increment").on("click", function () {
        var qtyInput = $(this).closest(".quantity-wrap").children(".number");
        var qtyVal = parseInt(qtyInput.val());
        qtyInput.val(parseInt(qtyVal + 1));
      });
    },
    cartSidebar: function () {
      $(".cart-button").on("click", function () {
        $("#sidebar-cart").css("right", "0");
        $("#sidebar-cart-curtain")
          .fadeIn(0)
          .css("display", "block")
          .animate({ opacity: 1 }, 200);
      });
      $(".close-popup").on("click", function () {
        $("#sidebar-cart").css("right", "-101%");
        $("#sidebar-cart-curtain").animate({ opacity: 0 }, 200, function () {
          $(this).css("display", "none");
        });
      });
    },
    formValidation: function () {
      if ($(".contact-form").length) {
        $(".contact-form").validate();
      }
      if ($(".product-form").length) {
        $(".product-form").validate();
      }
      if ($(".blog-form").length) {
        $(".blog-form").validate();
      }
    },
    contactForm: function () {
      $(".contact-form").on("submit", function (e) {
        e.preventDefault();
        if ($(".contact-form").valid()) {
          var _self = $(this);
          _self
            .closest("div")
            .find('button[type="submit"]')
            .attr("disabled", "disabled");
          var data = $(this).serialize();
          $.ajax({
            url: "./assets/mail/contact.php",
            type: "post",
            dataType: "json",
            data: data,
            success: function (data) {
              $(".contact-form").trigger("reset");
              _self.find('button[type="submit"]').removeAttr("disabled");
              if (data.success) {
                document.getElementById("message").innerHTML =
                  "<h5 class='color-primary mt-3'>Email Sent Successfully</h5>";
              } else {
                document.getElementById("message").innerHTML =
                  "<h5 class='color-primary mt-3'>There is an error</h5>";
              }
              $("#messages").show("slow");
              $("#messages").slideDown("slow");
              setTimeout(function () {
                $("#messages").slideUp("hide");
                $("#messages").hide("slow");
              }, 4000);
            },
          });
        } else {
          return !1;
        }
      });
    },
  };
  Init.i();
})(window, document, jQuery);

import { auth } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  // Auth check for My Account/My Orders
  document.querySelectorAll(".requires-auth").forEach((link) => {
    link.addEventListener("click", function (e) {
      if (!auth.currentUser) {
        e.preventDefault();
        window.location.href = "login.html";
      }
    });
  });
});
