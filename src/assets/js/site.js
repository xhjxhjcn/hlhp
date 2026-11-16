/* Shared behaviour: mobile nav, header hide-on-scroll, to-top, focus traps. */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;

  /* -------------------------------------------------- mobile navigation */
  var overlay = doc.getElementById("mobile-navigation");
  var openBtn = doc.querySelector("[data-nav-open]");

  function setNav(open) {
    if (!overlay) return;
    overlay.classList.toggle("is-open", open);
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    if (openBtn) openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    body.classList.toggle("is-locked", open);
    if (open) {
      var first = overlay.querySelector("a, button");
      if (first) first.focus();
    } else if (openBtn) {
      openBtn.focus();
    }
  }

  if (openBtn) {
    openBtn.addEventListener("click", function () {
      setNav(!overlay.classList.contains("is-open"));
    });
  }

  if (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay || event.target.closest("[data-nav-close]")) {
        setNav(false);
      }
    });
    overlay.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNav(false);
      });
    });
  }

  /* ------------------------------------------------ hide header on scroll */
  var topbar = doc.querySelector("[data-topbar]");
  // Section pages pin a second heading bar right below the topbar; hiding only
  // the topbar would leave that bar floating with a gap, so keep it in place.
  var pinnedHeading = doc.querySelector(".page-heading-bar");
  if (topbar && !pinnedHeading && !doc.documentElement.hasAttribute("data-keep-header")) {
    var lastY = window.scrollY;
    var ticking = false;

    var onScroll = function () {
      var y = window.scrollY;
      if (y > lastY && y > 180) {
        topbar.classList.add("is-hidden");
      } else if (y < lastY) {
        topbar.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );
  }

  /* --------------------------------------------------------- back to top */
  doc.querySelectorAll("[data-to-top]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ------------------------------------------- generic modal open/close */
  function bindModal(modalSelector, openSelector, closeSelector) {
    var modal = doc.querySelector(modalSelector);
    if (!modal) return null;
    var lastFocused = null;

    function open() {
      lastFocused = doc.activeElement;
      modal.classList.add("is-open");
      body.classList.add("is-locked");
      var focusable = modal.querySelector("button, a, [tabindex]");
      if (focusable) focusable.focus();
    }

    function close() {
      modal.classList.remove("is-open");
      body.classList.remove("is-locked");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    doc.querySelectorAll(openSelector).forEach(function (btn) {
      btn.addEventListener("click", open);
    });
    modal.querySelectorAll(closeSelector).forEach(function (btn) {
      btn.addEventListener("click", close);
    });
    modal.addEventListener("click", function (event) {
      if (event.target === modal) close();
    });
    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("is-open")) close();
    });

    return { open: open, close: close };
  }

  var noticeModal = bindModal("[data-notice-modal]", "[data-notice-open]", "[data-notice-close]");
  var changelogModal = bindModal("[data-changelog-modal]", "[data-changelog-open]", "[data-changelog-close]");

  window.__site = {
    setNav: setNav,
    noticeModal: noticeModal,
    changelogModal: changelogModal,
  };

  /* -------------------------------------------- escape closes mobile nav */
  doc.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay && overlay.classList.contains("is-open")) {
      setNav(false);
    }
  });
})();
